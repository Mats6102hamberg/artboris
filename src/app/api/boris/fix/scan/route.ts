import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export interface BorisIssue {
  id: string
  type: 'ORDER_MISMATCH' | 'ORDER_ABANDONED' | 'ORDER_DUPLICATE' | 'MEDIA_MISSING' | 'MEDIA_TEMP_FIX' | 'PRICE_ZERO' | 'ARTIST_NO_STRIPE' | 'FULFILLMENT_FAILED'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  entityId: string
  entityType: 'Order' | 'MarketOrder' | 'ArtworkListing' | 'ArtistProfile' | 'Fulfillment'
  revenueImpactSEK: number
  fixAction: string
  evidence: Record<string, unknown>
  detectedAt: string
}

// GET — Scan for all known issue types
export async function GET() {
  const issues: BorisIssue[] = []
  const now = new Date()

  // ─── A) Order Reconciliation: Stripe vs DB mismatch ───
  // Only flags real mismatches, not abandoned checkouts
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })

    // Find orders that are NOT paid in DB but have a Stripe session
    const unpaidOrders = await prisma.order.findMany({
      where: {
        status: { in: ['AWAITING_PAYMENT', 'DRAFT'] },
      },
      include: { payment: true },
    })

    for (const order of unpaidOrders) {
      const sessionId = order.payment?.stripeCheckoutSessionId
      if (!sessionId) continue // No Stripe session = customer never started payment

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status === 'paid' && order.status !== 'PAID') {
          // MISMATCH: Stripe says paid, DB says not paid → needs fix
          issues.push({
            id: `order-mismatch-${order.id}`,
            type: 'ORDER_MISMATCH',
            severity: 'high',
            title: `Order ${order.id.slice(-6)}: Stripe PAID, DB ${order.status}`,
            description: `Stripe session ${sessionId.slice(-8)} är betald men ordern är fortfarande ${order.status}. Webhook missades troligen.`,
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
        } else if (session.status === 'expired') {
          // Abandoned: customer started but never paid — low severity info
          const minutesOld = Math.round((now.getTime() - order.createdAt.getTime()) / 60000)
          if (minutesOld > 1440) { // Only flag if > 24h old
            issues.push({
              id: `order-abandoned-${order.id}`,
              type: 'ORDER_ABANDONED',
              severity: 'low',
              title: `Order ${order.id.slice(-6)}: övergiven (${Math.round(minutesOld / 60)}h)`,
              description: `Stripe session expired. Kunden startade men betalade aldrig. Kan markeras CANCELED.`,
              entityId: order.id,
              entityType: 'Order',
              revenueImpactSEK: 0,
              fixAction: 'MARK_ABANDONED',
              evidence: {
                orderId: order.id,
                dbStatus: order.status,
                stripeStatus: session.status,
                minutesOld,
                stripeSessionId: sessionId,
              },
              detectedAt: now.toISOString(),
            })
          }
        }
        // session.status === 'open' → payment in progress, ignore
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

      try {
        const pi = await stripe.paymentIntents.retrieve(mo.stripePaymentIntentId)

        if (pi.status === 'succeeded') {
          issues.push({
            id: `market-mismatch-${mo.id}`,
            type: 'ORDER_MISMATCH',
            severity: 'high',
            title: `MarketOrder "${mo.listing.title}": Stripe PAID, DB PENDING`,
            description: `PaymentIntent ${mo.stripePaymentIntentId.slice(-8)} succeeded men MarketOrder är PENDING. Webhook missades.`,
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

  // Sort: high severity first, then by revenue impact
  const severityOrder = { high: 0, medium: 1, low: 2 }
  issues.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.revenueImpactSEK - a.revenueImpactSEK
  })

  return NextResponse.json({
    scannedAt: now.toISOString(),
    issueCount: issues.length,
    bySeverity: {
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    totalRevenueAtRiskSEK: issues.reduce((sum, i) => sum + i.revenueImpactSEK, 0),
    issues,
  })
}
