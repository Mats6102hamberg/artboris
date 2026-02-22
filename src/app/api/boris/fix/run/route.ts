import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Rate limit: max 5 fixes per hour
const fixLog: { ts: number }[] = []
const MAX_FIXES_PER_HOUR = 5

interface FixResult {
  success: boolean
  action: string
  entityId: string
  dryRun: boolean
  changes: string[]
  error?: string
}

// POST — Run a fix action
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, entityId, dryRun = true } = body as {
    action: string
    entityId: string
    dryRun?: boolean
  }

  if (!action || !entityId) {
    return NextResponse.json({ error: 'action and entityId required' }, { status: 400 })
  }

  // Rate limit check
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentFixes = fixLog.filter(f => f.ts > oneHourAgo)
  if (!dryRun && recentFixes.length >= MAX_FIXES_PER_HOUR) {
    return NextResponse.json({
      error: `Rate limit: max ${MAX_FIXES_PER_HOUR} fixar per timme. ${recentFixes.length} körda.`,
    }, { status: 429 })
  }

  let result: FixResult

  try {
    switch (action) {
      case 'SYNC_STRIPE_PAYMENT':
        result = await syncStripePayment(entityId, dryRun)
        break
      case 'RETRY_FULFILLMENT':
        result = await retryFulfillment(entityId, dryRun)
        break
      case 'NUDGE_ARTIST_STRIPE':
        result = await nudgeArtistStripe(entityId, dryRun)
        break
      case 'REBUILD_THUMBNAIL':
        result = await rebuildThumbnail(entityId, dryRun)
        break
      case 'RECALC_PRICE':
        result = await recalcPrice(entityId, dryRun)
        break
      case 'MARK_ABANDONED':
        result = await markAbandoned(entityId, dryRun)
        break
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    // Log the fix
    if (!dryRun) {
      fixLog.push({ ts: Date.now() })
    }

    // Audit log to Boris Memory
    try {
      await prisma.borisMemory.create({
        data: {
          type: dryRun ? 'PATTERN' : 'INCIDENT',
          title: `${dryRun ? '[DRY-RUN] ' : ''}${action} on ${entityId.slice(-8)}`,
          description: result.changes.join('. ') || (result.error ?? 'No changes'),
          tags: ['boris-fix', action.toLowerCase(), dryRun ? 'dry-run' : 'executed'],
          confidence: result.success ? 1.0 : 0.3,
          resolved: result.success && !dryRun,
        },
      })
    } catch { /* audit log failure is non-critical */ }

    return NextResponse.json(result)
  } catch (err) {
    console.error(`[boris/fix/run] ${action} failed:`, err)
    return NextResponse.json({
      success: false,
      action,
      entityId,
      dryRun,
      changes: [],
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// ─── Fix Actions ─────────────────────────────────────────────

async function syncStripePayment(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return { success: false, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: [], error: 'STRIPE_SECRET_KEY saknas' }
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })

  // Try Order first
  const order = await prisma.order.findUnique({
    where: { id: entityId },
    include: { payment: true },
  })

  if (order) {
    if (order.status === 'PAID') {
      // Idempotency: already reconciled, log as noop
      try {
        await prisma.borisMemory.create({
          data: {
            type: 'PATTERN',
            title: `[NOOP] SYNC_STRIPE_PAYMENT on ${entityId.slice(-8)}`,
            description: 'Order redan PAID — ingen åtgärd krävdes (idempotent körning)',
            tags: ['boris-fix', 'sync_stripe_payment', 'noop'],
            confidence: 1.0,
            resolved: true,
          },
        })
      } catch { /* non-critical */ }
      return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: ['Order redan PAID — noop (already reconciled)'] }
    }

    const sessionId = order.payment?.stripeCheckoutSessionId
    if (!sessionId) {
      return { success: false, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: [], error: 'Ingen Stripe session kopplad' }
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    changes.push(`Order ${entityId.slice(-6)} DB-status: ${order.status}`)
    changes.push(`Stripe session ${sessionId.slice(-8)}: payment_status=${session.payment_status}, status=${session.status}`)

    if (session.payment_status !== 'paid') {
      changes.push('Stripe säger EJ betald — ingen åtgärd (inte en mismatch)')
      return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes }
    }

    // Stripe says paid, DB says not paid → real mismatch
    changes.push('❗ MISMATCH: Stripe PAID, DB ' + order.status)

    if (!dryRun) {
      await prisma.order.update({
        where: { id: entityId },
        data: { status: 'PAID' },
      })
      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { paidAt: new Date() },
        })
      }
      changes.push('✅ Order uppdaterad till PAID')
      changes.push('✅ Payment.paidAt satt')

      // Fix 3: Create follow-up issues for fulfillment + email
      await prisma.borisMemory.create({
        data: {
          type: 'INCIDENT',
          title: `NEEDS_FULFILLMENT_TRIGGER: Order ${entityId.slice(-6)}`,
          description: `Order reconciled till PAID via Boris Fix. Fulfillment behöver triggas (upscale + tryckfil + Crimson-mail).`,
          tags: ['boris-fix', 'needs_fulfillment_trigger', 'post-reconciliation'],
          confidence: 1.0,
          resolved: false,
        },
      })
      changes.push('📝 Skapade NEEDS_FULFILLMENT_TRIGGER uppföljning')

      await prisma.borisMemory.create({
        data: {
          type: 'INCIDENT',
          title: `NEEDS_ORDER_EMAIL: Order ${entityId.slice(-6)}`,
          description: `Order reconciled till PAID via Boris Fix. Orderbekräftelse-mail behöver skickas till kund.`,
          tags: ['boris-fix', 'needs_order_email', 'post-reconciliation'],
          confidence: 1.0,
          resolved: false,
        },
      })
      changes.push('📝 Skapade NEEDS_ORDER_EMAIL uppföljning')
    } else {
      changes.push('[DRY-RUN] Skulle uppdatera order till PAID + sätta payment.paidAt')
      changes.push('[DRY-RUN] Skulle skapa NEEDS_FULFILLMENT_TRIGGER + NEEDS_ORDER_EMAIL uppföljningar')
    }

    return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes }
  }

  // Try MarketOrder
  const marketOrder = await prisma.marketOrder.findUnique({
    where: { id: entityId },
  })

  if (marketOrder) {
    if (marketOrder.status === 'PAID') {
      return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: ['MarketOrder redan PAID — noop (already reconciled)'] }
    }
    if (!marketOrder.stripePaymentIntentId) {
      return { success: false, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: [], error: 'Ingen Stripe PI kopplad' }
    }

    const pi = await stripe.paymentIntents.retrieve(marketOrder.stripePaymentIntentId)
    changes.push(`MarketOrder ${entityId.slice(-6)} DB-status: ${marketOrder.status}`)
    changes.push(`Stripe PI ${marketOrder.stripePaymentIntentId.slice(-8)}: status=${pi.status}`)

    if (pi.status !== 'succeeded') {
      changes.push('Stripe säger EJ succeeded — ingen åtgärd')
      return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes }
    }

    changes.push('❗ MISMATCH: Stripe succeeded, DB ' + marketOrder.status)

    if (!dryRun) {
      await prisma.marketOrder.update({
        where: { id: entityId },
        data: { status: 'PAID', paidAt: new Date() },
      })
      changes.push('✅ MarketOrder uppdaterad till PAID')
    } else {
      changes.push('[DRY-RUN] Skulle uppdatera MarketOrder till PAID')
    }

    return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes }
  }

  return { success: false, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: [], error: 'Order/MarketOrder hittades inte' }
}

async function retryFulfillment(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []

  const fulfillment = await prisma.fulfillment.findUnique({
    where: { id: entityId },
    include: { orderItem: { include: { design: true } } },
  })

  if (!fulfillment) {
    return { success: false, action: 'RETRY_FULFILLMENT', entityId, dryRun, changes: [], error: 'Fulfillment hittades inte' }
  }

  changes.push(`Fulfillment ${entityId.slice(-6)} status: ${fulfillment.status}`)
  changes.push(`Design: ${fulfillment.orderItem.designId.slice(-6)}, Size: ${fulfillment.orderItem.sizeCode}`)

  if (fulfillment.internalNote) {
    changes.push(`Felorsak: ${fulfillment.internalNote}`)
  }

  if (!dryRun) {
    await prisma.fulfillment.update({
      where: { id: entityId },
      data: {
        status: 'NOT_STARTED',
        internalNote: `Retry av Boris ${new Date().toISOString()}. Tidigare: ${fulfillment.internalNote || 'okänt'}`,
      },
    })
    changes.push('✅ Fulfillment återställd till NOT_STARTED — webhook kommer köra om')
  } else {
    changes.push('[DRY-RUN] Skulle återställa fulfillment till NOT_STARTED för omgenerering')
  }

  return { success: true, action: 'RETRY_FULFILLMENT', entityId, dryRun, changes }
}

async function nudgeArtistStripe(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []

  const artist = await prisma.artistProfile.findUnique({
    where: { id: entityId },
    select: { displayName: true, email: true, stripeAccountId: true, stripeOnboardingDone: true },
  })

  if (!artist) {
    return { success: false, action: 'NUDGE_ARTIST_STRIPE', entityId, dryRun, changes: [], error: 'Konstnär hittades inte' }
  }

  changes.push(`Konstnär: ${artist.displayName} (${artist.email})`)
  changes.push(`Stripe: ${artist.stripeAccountId ? `Konto finns (${artist.stripeAccountId.slice(-6)})` : 'Saknas helt'}`)
  changes.push(`Onboarding: ${artist.stripeOnboardingDone ? 'Klar' : 'Ej klar'}`)

  if (!dryRun) {
    // In production: send email via Resend
    // await sendEmail({ to: artist.email, subject: 'Slutför din Stripe-koppling', ... })
    changes.push('⚠️ E-postpåminnelse bör skickas manuellt (Resend-integration planerad)')
  } else {
    changes.push(`[DRY-RUN] Skulle skicka påminnelse-mail till ${artist.email}`)
  }

  return { success: true, action: 'NUDGE_ARTIST_STRIPE', entityId, dryRun, changes }
}

async function rebuildThumbnail(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []

  const listing = await prisma.artworkListing.findUnique({
    where: { id: entityId },
    select: { title: true, imageUrl: true, thumbnailUrl: true },
  })

  if (!listing) {
    return { success: false, action: 'REBUILD_THUMBNAIL', entityId, dryRun, changes: [], error: 'Listing hittades inte' }
  }

  changes.push(`Listing: "${listing.title}"`)
  changes.push(`Bild: ${listing.imageUrl.slice(-20)}`)
  changes.push(`Thumbnail: ${listing.thumbnailUrl || 'SAKNAS'}`)

  if (!dryRun) {
    // Temp fix: use imageUrl as thumbnail fallback
    await prisma.artworkListing.update({
      where: { id: entityId },
      data: { thumbnailUrl: listing.imageUrl },
    })
    changes.push('✅ TEMP_FIX: Thumbnail satt till imageUrl som fallback')
    changes.push('⚠️ Bilden kan vara för stor för listor — riktig thumbnail behövs')

    // Create follow-up issue in BorisMemory
    await prisma.borisMemory.create({
      data: {
        type: 'PATTERN',
        title: `NEEDS_THUMB_GEN: "${listing.title}"`,
        description: `Listing ${entityId.slice(-8)} använder imageUrl som thumbnail-fallback. Behöver riktig 600px thumbnail via Sharp.`,
        tags: ['boris-fix', 'needs_thumb_gen', 'temp-fix-applied'],
        confidence: 1.0,
        resolved: false,
      },
    })
    changes.push('📝 Skapade uppföljnings-issue NEEDS_THUMB_GEN i Boris Memory')
  } else {
    changes.push('[DRY-RUN] Skulle sätta thumbnailUrl = imageUrl (temp fix)')
    changes.push('[DRY-RUN] Skulle skapa NEEDS_THUMB_GEN uppföljning')
  }

  return { success: true, action: 'REBUILD_THUMBNAIL', entityId, dryRun, changes }
}

async function markAbandoned(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion }) : null

  // Try Order
  const order = await prisma.order.findUnique({
    where: { id: entityId },
    include: { payment: true },
  })
  if (order) {
    changes.push(`Order ${entityId.slice(-6)} status: ${order.status}`)
    if (order.status === 'CANCELED') {
      return { success: true, action: 'MARK_ABANDONED', entityId, dryRun, changes: ['Redan CANCELED'] }
    }

    // Safety: verify Stripe says expired/canceled, not open/processing
    const sessionId = order.payment?.stripeCheckoutSessionId
    if (sessionId && stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        changes.push(`Stripe session: status=${session.status}, payment_status=${session.payment_status}`)

        if (session.status === 'open' || session.payment_status === 'paid') {
          return {
            success: false, action: 'MARK_ABANDONED', entityId, dryRun, changes,
            error: `Blockerad: Stripe session är ${session.status} / payment_status=${session.payment_status}. Kan inte markera som abandoned.`,
          }
        }
      } catch (err) {
        changes.push(`⚠️ Kunde inte verifiera Stripe: ${err instanceof Error ? err.message : 'okänt'}`)
      }
    }

    if (!dryRun) {
      await prisma.order.update({ where: { id: entityId }, data: { status: 'CANCELED' } })
      changes.push('✅ Order markerad som CANCELED')
    } else {
      changes.push('[DRY-RUN] Skulle markera order som CANCELED')
    }
    return { success: true, action: 'MARK_ABANDONED', entityId, dryRun, changes }
  }

  // Try MarketOrder
  const mo = await prisma.marketOrder.findUnique({ where: { id: entityId } })
  if (mo) {
    changes.push(`MarketOrder ${entityId.slice(-6)} status: ${mo.status}`)
    if (mo.status === 'CANCELED') {
      return { success: true, action: 'MARK_ABANDONED', entityId, dryRun, changes: ['Redan CANCELED'] }
    }

    // Safety: verify Stripe PI is not active
    if (mo.stripePaymentIntentId && stripe) {
      try {
        const pi = await stripe.paymentIntents.retrieve(mo.stripePaymentIntentId)
        changes.push(`Stripe PI: status=${pi.status}`)

        if (pi.status === 'processing' || pi.status === 'requires_action' || pi.status === 'succeeded') {
          return {
            success: false, action: 'MARK_ABANDONED', entityId, dryRun, changes,
            error: `Blockerad: Stripe PI är ${pi.status}. Kan inte markera som abandoned.`,
          }
        }
      } catch (err) {
        changes.push(`⚠️ Kunde inte verifiera Stripe PI: ${err instanceof Error ? err.message : 'okänt'}`)
      }
    }

    if (!dryRun) {
      await prisma.marketOrder.update({ where: { id: entityId }, data: { status: 'CANCELED' } })
      changes.push('✅ MarketOrder markerad som CANCELED')
    } else {
      changes.push('[DRY-RUN] Skulle markera MarketOrder som CANCELED')
    }
    return { success: true, action: 'MARK_ABANDONED', entityId, dryRun, changes }
  }

  return { success: false, action: 'MARK_ABANDONED', entityId, dryRun, changes: [], error: 'Order/MarketOrder hittades inte' }
}

async function recalcPrice(entityId: string, dryRun: boolean): Promise<FixResult> {
  const changes: string[] = []

  const order = await prisma.order.findUnique({
    where: { id: entityId },
    include: { items: true },
  })

  if (!order) {
    return { success: false, action: 'RECALC_PRICE', entityId, dryRun, changes: [], error: 'Order hittades inte' }
  }

  changes.push(`Order ${entityId.slice(-6)}: totalCents=${order.totalCents}`)
  changes.push(`${order.items.length} item(s)`)

  const recalcTotal = order.items.reduce((sum, item) => sum + item.lineTotalCents, 0)
  const recalcWithShipping = recalcTotal + order.shippingCents

  changes.push(`Omberäknat: items=${recalcTotal} + frakt=${order.shippingCents} = ${recalcWithShipping} öre`)

  if (recalcWithShipping === order.totalCents) {
    changes.push('Pris stämmer redan — ingen åtgärd')
    return { success: true, action: 'RECALC_PRICE', entityId, dryRun, changes }
  }

  if (!dryRun) {
    await prisma.order.update({
      where: { id: entityId },
      data: {
        subtotalCents: recalcTotal,
        totalCents: recalcWithShipping,
      },
    })
    changes.push(`✅ Uppdaterat: ${order.totalCents} → ${recalcWithShipping} öre`)
  } else {
    changes.push(`[DRY-RUN] Skulle uppdatera: ${order.totalCents} → ${recalcWithShipping} öre`)
  }

  return { success: true, action: 'RECALC_PRICE', entityId, dryRun, changes }
}

// GET — Audit log (recent fixes)
export async function GET() {
  const recentFixes = await prisma.borisMemory.findMany({
    where: { tags: { has: 'boris-fix' } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const fixesThisHour = fixLog.filter(f => f.ts > oneHourAgo).length

  return NextResponse.json({
    auditLog: recentFixes,
    rateLimit: {
      fixesThisHour,
      maxPerHour: MAX_FIXES_PER_HOUR,
      remaining: MAX_FIXES_PER_HOUR - fixesThisHour,
    },
  })
}
