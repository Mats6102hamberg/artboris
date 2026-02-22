import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendBorisHighAlert } from '@/server/services/email/adminAlert'

// Cooldown: don't re-check same Stripe session within 10 min
// Persisted in BorisMemory to survive serverless cold starts
const STRIPE_COOLDOWN_MS = 10 * 60 * 1000
const ORDER_MIN_AGE_MS = 5 * 60 * 1000 // Skip orders younger than 5 min

async function isStripeCooldown(stripeId: string): Promise<boolean> {
  try {
    const mem = await prisma.borisMemory.findFirst({
      where: { tags: { hasEvery: ['stripe-cooldown', stripeId] } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    if (!mem) return false
    return Date.now() - mem.createdAt.getTime() < STRIPE_COOLDOWN_MS
  } catch { return false }
}

async function setStripeCooldown(stripeId: string): Promise<void> {
  try {
    // Delete any existing cooldown for this ID, then create fresh
    await prisma.borisMemory.deleteMany({
      where: { tags: { hasEvery: ['stripe-cooldown', stripeId] } },
    })
    await prisma.borisMemory.create({
      data: {
        type: 'PATTERN',
        title: `Stripe check: ${stripeId.slice(-8)}`,
        description: `Cooldown marker for Stripe ID ${stripeId}`,
        tags: ['stripe-cooldown', stripeId],
        confidence: 1.0,
        resolved: true,
      },
    })
  } catch { /* non-critical */ }
}

async function cleanupStaleCooldowns(): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const { count } = await prisma.borisMemory.deleteMany({
      where: {
        tags: { has: 'stripe-cooldown' },
        createdAt: { lt: oneHourAgo },
      },
    })
    if (count > 0) console.log(`[boris/fix/scan] Cleaned up ${count} stale cooldown entries`)
    return count
  } catch { return 0 }
}

export interface BorisIssue {
  id: string
  type: 'ORDER_MISMATCH' | 'ORDER_ABANDONED' | 'ORDER_DUPLICATE' | 'MEDIA_MISSING' | 'MEDIA_TEMP_FIX' | 'PRICE_ZERO' | 'ARTIST_NO_STRIPE' | 'FULFILLMENT_FAILED' | 'NEEDS_FULFILLMENT' | 'NEEDS_ORDER_EMAIL' | 'FIX_FAILED'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  summary: string
  primaryId: string
  recommendedAction: string
  entityId: string
  entityType: 'Order' | 'MarketOrder' | 'ArtworkListing' | 'ArtistProfile' | 'Fulfillment' | 'BorisMemory'
  revenueImpactSEK: number
  fixAction: string
  evidence: Record<string, unknown>
  detectedAt: string
}

// GET — Scan for all known issue types
export async function GET() {
  const issues: BorisIssue[] = []
  const now = new Date()

  // Cleanup stale cooldown entries (>1h) to prevent BorisMemory growth
  await cleanupStaleCooldowns()

  // ─── A) Order Reconciliation: Stripe vs DB mismatch ───
  // Only flags real mismatches, not abandoned checkouts
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })

    // Find orders that are NOT paid in DB but have a Stripe session
    // Skip orders younger than 5 min (still in checkout flow)
    const minAge = new Date(now.getTime() - ORDER_MIN_AGE_MS)
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: { in: ['AWAITING_PAYMENT', 'DRAFT'] },
        createdAt: { lt: minAge },
      },
      include: { payment: true },
    })

    for (const order of unpaidOrders) {
      const sessionId = order.payment?.stripeCheckoutSessionId
      if (!sessionId) continue // No Stripe session = customer never started payment

      // Cooldown: skip if checked within last 10 min (persisted in DB)
      if (await isStripeCooldown(sessionId)) continue

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        await setStripeCooldown(sessionId)

        // Decision point: payment_status is the source of truth for money
        if (session.payment_status === 'paid' && order.status !== 'PAID') {
          // MISMATCH: Stripe says paid, DB says not paid → needs fix
          issues.push({
            id: `order-mismatch-${order.id}`,
            type: 'ORDER_MISMATCH',
            severity: 'high',
            title: `Order ${order.id.slice(-6)}: Stripe PAID, DB ${order.status}`,
            description: `Stripe session ${sessionId.slice(-8)} är betald men ordern är fortfarande ${order.status}. Webhook missades troligen.`,
            summary: `Stripe betald, DB ${order.status} — synka betalning`,
            primaryId: sessionId,
            recommendedAction: 'Kör SYNC_STRIPE_PAYMENT för att uppdatera DB till PAID',
            entityId: order.id,
            entityType: 'Order',
            revenueImpactSEK: order.totalCents / 100,
            fixAction: 'SYNC_STRIPE_PAYMENT',
            evidence: {
              orderId: order.id,
              dbStatus: order.status,
              stripePaymentStatus: session.payment_status,
              stripeSessionId: sessionId,
              stripePaymentIntentId: session.payment_intent,
              amountTotal: session.amount_total,
              customerEmail: session.customer_details?.email,
            },
            detectedAt: now.toISOString(),
          })
        } else if (
          session.status === 'expired' &&
          session.payment_status !== 'paid' &&
          order.status === 'AWAITING_PAYMENT'
        ) {
          // Abandoned: session expired + not paid + DB still AWAITING
          const minutesOld = Math.round((now.getTime() - order.createdAt.getTime()) / 60000)
          if (minutesOld > 1440) { // Only flag if > 24h old
            issues.push({
              id: `order-abandoned-${order.id}`,
              type: 'ORDER_ABANDONED',
              severity: 'low',
              title: `Order ${order.id.slice(-6)}: övergiven (${Math.round(minutesOld / 60)}h)`,
              description: `Stripe session expired + ej betald. Kan markeras CANCELED.`,
              summary: `Övergiven ${Math.round(minutesOld / 60)}h — säkert att rensa`,
              primaryId: sessionId,
              recommendedAction: 'Markera som CANCELED (auto-fixbar)',
              entityId: order.id,
              entityType: 'Order',
              revenueImpactSEK: 0,
              fixAction: 'MARK_ABANDONED',
              evidence: {
                orderId: order.id,
                dbStatus: order.status,
                stripeSessionStatus: session.status,
                stripePaymentStatus: session.payment_status,
                minutesOld,
                stripeSessionId: sessionId,
              },
              detectedAt: now.toISOString(),
            })
          }
        }
        // session.status === 'open' or payment_status === 'unpaid'/'no_payment_required' → ignore
      } catch (stripeErr) {
        console.error(`[boris/fix/scan] Stripe check failed for ${order.id}:`, stripeErr)
      }
    }
  } catch (err) {
    console.error('[boris/fix/scan] Order reconciliation failed:', err)
  }

  // ─── B) MarketOrder Reconciliation: Stripe PI vs DB ───
  try {
    const stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
      : null

    const pendingMarketOrders = await prisma.marketOrder.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        totalCents: true,
        stripePaymentIntentId: true,
        createdAt: true,
        listing: { select: { title: true } },
      },
    })

    for (const mo of pendingMarketOrders) {
      if (!mo.stripePaymentIntentId || !stripe) continue
      // Skip if younger than 5 min
      if (now.getTime() - mo.createdAt.getTime() < ORDER_MIN_AGE_MS) continue
      // Cooldown
      if (await isStripeCooldown(mo.stripePaymentIntentId)) continue

      try {
        const pi = await stripe.paymentIntents.retrieve(mo.stripePaymentIntentId)
        await setStripeCooldown(mo.stripePaymentIntentId)

        if (pi.status === 'succeeded') {
          issues.push({
            id: `market-mismatch-${mo.id}`,
            type: 'ORDER_MISMATCH',
            severity: 'high',
            title: `MarketOrder "${mo.listing.title}": Stripe PAID, DB PENDING`,
            description: `PaymentIntent ${mo.stripePaymentIntentId.slice(-8)} succeeded men MarketOrder är PENDING. Webhook missades.`,
            summary: `Stripe PI succeeded, DB PENDING — synka betalning`,
            primaryId: mo.stripePaymentIntentId,
            recommendedAction: 'Kör SYNC_STRIPE_PAYMENT för att uppdatera MarketOrder till PAID',
            entityId: mo.id,
            entityType: 'MarketOrder',
            revenueImpactSEK: mo.totalCents / 100,
            fixAction: 'SYNC_STRIPE_PAYMENT',
            evidence: {
              marketOrderId: mo.id,
              stripePaymentIntentId: mo.stripePaymentIntentId,
              stripeStatus: pi.status,
              dbStatus: 'PENDING',
            },
            detectedAt: now.toISOString(),
          })
        } else if (pi.status === 'canceled') {
          const minutesOld = Math.round((now.getTime() - mo.createdAt.getTime()) / 60000)
          if (minutesOld > 1440) {
            issues.push({
              id: `market-abandoned-${mo.id}`,
              type: 'ORDER_ABANDONED',
              severity: 'low',
              title: `MarketOrder "${mo.listing.title}": övergiven (${Math.round(minutesOld / 60)}h)`,
              description: `PaymentIntent canceled. Kan markeras CANCELED.`,
              summary: `PI canceled ${Math.round(minutesOld / 60)}h sedan — säkert att rensa`,
              primaryId: mo.stripePaymentIntentId,
              recommendedAction: 'Markera som CANCELED (auto-fixbar)',
              entityId: mo.id,
              entityType: 'MarketOrder',
              revenueImpactSEK: 0,
              fixAction: 'MARK_ABANDONED',
              evidence: {
                marketOrderId: mo.id,
                stripeStatus: pi.status,
                minutesOld,
              },
              detectedAt: now.toISOString(),
            })
          }
        }
      } catch (stripeErr) {
        console.error(`[boris/fix/scan] Stripe PI check failed for MarketOrder ${mo.id}:`, stripeErr)
      }
    }
  } catch (err) {
    console.error('[boris/fix/scan] MarketOrder reconciliation failed:', err)
  }

  // ─── C) Failed fulfillments ───────────────────────────
  try {
    const failedFulfillments = await prisma.fulfillment.findMany({
      where: { status: 'FAILED' },
      include: {
        orderItem: { include: { order: { select: { id: true, totalCents: true } } } },
      },
    })

    for (const f of failedFulfillments) {
      const orderId = f.orderItem.order.id
      issues.push({
        id: `fulfillment-failed-${f.id}`,
        type: 'FULFILLMENT_FAILED',
        severity: 'high',
        title: `Leverans misslyckad (order ${orderId.slice(-6)})`,
        description: f.internalNote || 'Upscale eller tryckfil misslyckades',
        summary: `Fulfillment FAILED — behöver retry`,
        primaryId: f.id,
        recommendedAction: 'Kör RETRY_FULFILLMENT för att återställa till NOT_STARTED',
        entityId: f.id,
        entityType: 'Fulfillment',
        revenueImpactSEK: f.orderItem.order.totalCents / 100,
        fixAction: 'RETRY_FULFILLMENT',
        evidence: {
          fulfillmentId: f.id,
          orderItemId: f.orderItemId,
          orderId,
          status: f.status,
          note: f.internalNote,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] Fulfillment scan failed:', err)
  }

  // ─── D) Listings with missing thumbnails ──────────────
  try {
    const listingsNoThumb = await prisma.artworkListing.findMany({
      where: {
        OR: [
          { thumbnailUrl: '' },
          { thumbnailUrl: null as unknown as string },
        ],
        isPublic: true,
      },
      select: { id: true, title: true, imageUrl: true },
      take: 20,
    })

    for (const listing of listingsNoThumb) {
      issues.push({
        id: `media-thumb-${listing.id}`,
        type: 'MEDIA_MISSING',
        severity: 'medium',
        title: `Saknad thumbnail: "${listing.title}"`,
        description: 'Publicerad listing utan thumbnail — visas inte korrekt i galleri',
        summary: `Thumbnail saknas — gallerivy påverkad`,
        primaryId: listing.id,
        recommendedAction: 'Kör REBUILD_THUMBNAIL för att sätta imageUrl som fallback',
        entityId: listing.id,
        entityType: 'ArtworkListing',
        revenueImpactSEK: 0,
        fixAction: 'REBUILD_THUMBNAIL',
        evidence: {
          listingId: listing.id,
          imageUrl: listing.imageUrl,
          thumbnailUrl: '',
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] Media scan failed:', err)
  }

  // ─── E) Artists without Stripe ────────────────────────
  try {
    const artistsNoStripe = await prisma.artistProfile.findMany({
      where: {
        isActive: true,
        OR: [
          { stripeAccountId: null },
          { stripeOnboardingDone: false },
        ],
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        stripeAccountId: true,
        stripeOnboardingDone: true,
        _count: { select: { listings: true } },
      },
    })

    for (const artist of artistsNoStripe) {
      const hasListings = artist._count.listings > 0
      issues.push({
        id: `artist-stripe-${artist.id}`,
        type: 'ARTIST_NO_STRIPE',
        severity: hasListings ? 'high' : 'low',
        title: `${artist.displayName} saknar Stripe`,
        description: artist.stripeAccountId
          ? 'Stripe-konto finns men onboarding ej klar'
          : 'Ingen Stripe-koppling alls',
        summary: `${artist.displayName}: ${artist.stripeAccountId ? 'onboarding ej klar' : 'ingen Stripe'} (${artist._count.listings} listings)`,
        primaryId: artist.stripeAccountId || artist.id,
        recommendedAction: hasListings ? 'Skicka påminnelse — konstnär har aktiva listings' : 'Låg prio — inga listings ännu',
        entityId: artist.id,
        entityType: 'ArtistProfile',
        revenueImpactSEK: 0,
        fixAction: 'NUDGE_ARTIST_STRIPE',
        evidence: {
          artistId: artist.id,
          email: artist.email,
          stripeAccountId: artist.stripeAccountId,
          stripeOnboardingDone: artist.stripeOnboardingDone,
          listingCount: artist._count.listings,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] Artist scan failed:', err)
  }

  // ─── F) Orders with zero price ────────────────────────
  try {
    const zeroPriceOrders = await prisma.order.findMany({
      where: { totalCents: 0, status: { not: 'CANCELED' } },
      select: { id: true, status: true, createdAt: true },
      take: 10,
    })

    for (const order of zeroPriceOrders) {
      issues.push({
        id: `price-zero-${order.id}`,
        type: 'PRICE_ZERO',
        severity: 'high',
        title: `Order ${order.id.slice(-6)} har pris 0 kr`,
        description: 'Order med totalCents = 0, troligen prisberäkningsfel',
        summary: `0 kr order — behöver prisomberäkning`,
        primaryId: order.id,
        recommendedAction: 'Kör RECALC_PRICE för att räkna om från items + frakt',
        entityId: order.id,
        entityType: 'Order',
        revenueImpactSEK: 0,
        fixAction: 'RECALC_PRICE',
        evidence: {
          orderId: order.id,
          totalCents: 0,
          status: order.status,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] Price scan failed:', err)
  }

  // ─── G) NEEDS_THUMB_GEN: temp-fix-applied listings ───
  try {
    const tempFixMemories = await prisma.borisMemory.findMany({
      where: {
        tags: { hasEvery: ['needs_thumb_gen', 'temp-fix-applied'] },
        resolved: false,
      },
      select: { title: true, description: true, createdAt: true },
    })

    for (const mem of tempFixMemories) {
      // Extract listing ID from description (format: "Listing XXXXXXXX använder...")
      const idMatch = mem.description.match(/Listing (\w+)/)
      const listingId = idMatch?.[1] || ''

      issues.push({
        id: `media-tempfix-${listingId || mem.createdAt.getTime()}`,
        type: 'MEDIA_TEMP_FIX',
        severity: 'medium',
        title: mem.title.replace('NEEDS_THUMB_GEN: ', 'Temp thumbnail: '),
        description: 'Använder imageUrl som thumbnail-fallback. Behöver riktig 600px thumbnail via Sharp.',
        summary: `Temp fallback aktiv — behöver riktig 600px thumbnail`,
        primaryId: listingId,
        recommendedAction: 'Generera riktig thumbnail via Sharp pipeline',
        entityId: listingId,
        entityType: 'ArtworkListing',
        revenueImpactSEK: 0,
        fixAction: 'REBUILD_THUMBNAIL',
        evidence: {
          tempFixApplied: true,
          originalMemory: mem.title,
          createdAt: mem.createdAt,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] NEEDS_THUMB_GEN scan failed:', err)
  }

  // ─── H) NEEDS_FULFILLMENT_TRIGGER: post-reconciliation ─
  try {
    const fulfillmentMems = await prisma.borisMemory.findMany({
      where: { tags: { has: 'needs_fulfillment_trigger' }, resolved: false },
      select: { title: true, description: true, createdAt: true },
    })
    for (const mem of fulfillmentMems) {
      const idMatch = mem.title.match(/Order (\w+)/)
      const orderId = idMatch?.[1] || ''
      issues.push({
        id: `needs-fulfillment-${orderId || mem.createdAt.getTime()}`,
        type: 'NEEDS_FULFILLMENT',
        severity: 'medium',
        title: `Fulfillment behövs: Order ${orderId}`,
        description: mem.description,
        summary: `PAID order utan fulfillment — behöver triggas`,
        primaryId: orderId,
        recommendedAction: 'Kör TRIGGER_FULFILLMENT för att skapa/resetta fulfillments',
        entityId: orderId,
        entityType: 'Order',
        revenueImpactSEK: 0,
        fixAction: 'TRIGGER_FULFILLMENT',
        evidence: { source: 'post-reconciliation', memory: mem.title },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] NEEDS_FULFILLMENT scan failed:', err)
  }

  // ─── I) NEEDS_ORDER_EMAIL: post-reconciliation ────────
  try {
    const emailMems = await prisma.borisMemory.findMany({
      where: { tags: { has: 'needs_order_email' }, resolved: false },
      select: { title: true, description: true, createdAt: true },
    })
    for (const mem of emailMems) {
      const idMatch = mem.title.match(/Order (\w+)/)
      const orderId = idMatch?.[1] || ''
      issues.push({
        id: `needs-email-${orderId || mem.createdAt.getTime()}`,
        type: 'NEEDS_ORDER_EMAIL',
        severity: 'medium',
        title: `Orderbekräftelse saknas: Order ${orderId}`,
        description: mem.description,
        summary: `Kund har inte fått orderbekräftelse`,
        primaryId: orderId,
        recommendedAction: 'Kör SEND_ORDER_CONFIRMATION för att skicka mail via Resend',
        entityId: orderId,
        entityType: 'Order',
        revenueImpactSEK: 0,
        fixAction: 'SEND_ORDER_CONFIRMATION',
        evidence: { source: 'post-reconciliation', memory: mem.title },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] NEEDS_ORDER_EMAIL scan failed:', err)
  }

  // ─── J) FIX_FAILED: previous fixes that failed post-check ─
  try {
    const failedMems = await prisma.borisMemory.findMany({
      where: { tags: { has: 'fix_failed' }, resolved: false },
      select: { id: true, title: true, description: true, createdAt: true, tags: true },
    })
    for (const mem of failedMems) {
      const actionMatch = mem.title.match(/FIX_FAILED: (\w+) on (\w+)/)
      const failedAction = actionMatch?.[1] || 'UNKNOWN'
      const entityShort = actionMatch?.[2] || ''
      issues.push({
        id: `fix-failed-${mem.id.slice(-8)}`,
        type: 'FIX_FAILED',
        severity: 'high',
        title: `Fix misslyckades: ${failedAction} (${entityShort})`,
        description: mem.description,
        summary: `${failedAction} misslyckades post-check — manuell åtgärd krävs`,
        primaryId: mem.id,
        recommendedAction: 'Undersök manuellt — kör om eller eskalera',
        entityId: entityShort,
        entityType: 'BorisMemory',
        revenueImpactSEK: 0,
        fixAction: failedAction,
        evidence: { source: 'post-check-fail', memoryId: mem.id, tags: mem.tags },
        detectedAt: mem.createdAt.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] FIX_FAILED scan failed:', err)
  }

  // Sort: high severity first, then by revenue impact
  const severityOrder = { high: 0, medium: 1, low: 2 }
  issues.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.revenueImpactSEK - a.revenueImpactSEK
  })

  // ─── Notify on NEW high-severity issues ────────────────
  const highIssues = issues.filter(i => i.severity === 'high')
  if (highIssues.length > 0) {
    try {
      // Load last scan's known HIGH issue IDs
      const lastScanMem = await prisma.borisMemory.findFirst({
        where: { tags: { has: 'boris-scan-state' } },
        orderBy: { createdAt: 'desc' },
      })
      const previousIds: string[] = lastScanMem?.data
        ? (typeof lastScanMem.data === 'object' && 'highIds' in (lastScanMem.data as Record<string, unknown>)
          ? ((lastScanMem.data as Record<string, unknown>).highIds as string[])
          : [])
        : []

      const newHighIssues = highIssues.filter(i => !previousIds.includes(i.id))

      if (newHighIssues.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://artboris.se'
        await sendBorisHighAlert({
          newHighCount: newHighIssues.length,
          topIssues: newHighIssues.slice(0, 3).map(i => ({
            title: i.title, type: i.type, entityId: i.entityId, revenueImpactSEK: i.revenueImpactSEK,
          })),
          totalIssueCount: issues.length,
          dashboardUrl: `${baseUrl}/boris`,
        })
      }

      // Persist current scan state
      await prisma.borisMemory.create({
        data: {
          type: 'PATTERN',
          title: `Scan state: ${highIssues.length} HIGH, ${issues.length} total`,
          description: `HIGH IDs: ${highIssues.map(i => i.id).join(', ')}`,
          tags: ['boris-scan-state'],
          data: { highIds: highIssues.map(i => i.id), scannedAt: now.toISOString() },
          confidence: 1.0,
          resolved: true,
        },
      })
    } catch (err) {
      console.error('[boris/fix/scan] HIGH alert/state failed:', err)
    }
  }

  return NextResponse.json({
    scannedAt: now.toISOString(),
    issueCount: issues.length,
    bySeverity: {
      high: highIssues.length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    totalRevenueAtRiskSEK: issues.reduce((sum, i) => sum + i.revenueImpactSEK, 0),
    issues,
  })
}
