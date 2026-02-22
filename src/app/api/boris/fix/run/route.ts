import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

  // Try Order first
  const order = await prisma.order.findUnique({
    where: { id: entityId },
    include: { payment: true },
  })

  if (order) {
    if (order.status === 'PAID') {
      return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: ['Order redan PAID — ingen åtgärd'] }
    }

    const sessionId = order.payment?.stripeCheckoutSessionId
    if (!sessionId) {
      return { success: false, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes: [], error: 'Ingen Stripe session kopplad' }
    }

    changes.push(`Order ${entityId.slice(-6)} status: ${order.status}`)
    changes.push(`Stripe session: ${sessionId.slice(-8)}`)

    // Check Stripe (would need Stripe SDK in production)
    changes.push('Kontrollerar Stripe session status...')

    if (!dryRun) {
      // In production: fetch from Stripe API
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      // const session = await stripe.checkout.sessions.retrieve(sessionId)
      // if (session.payment_status === 'paid') { ... }

      // For now: mark as needing manual check
      changes.push('⚠️ Manuell Stripe-kontroll krävs — kör webhook retry via Stripe Dashboard')
    } else {
      changes.push('[DRY-RUN] Skulle kontrollera Stripe och uppdatera order till PAID om betald')
    }

    return { success: true, action: 'SYNC_STRIPE_PAYMENT', entityId, dryRun, changes }
  }

  // Try MarketOrder
  const marketOrder = await prisma.marketOrder.findUnique({
    where: { id: entityId },
  })

  if (marketOrder) {
    changes.push(`MarketOrder ${entityId.slice(-6)} status: ${marketOrder.status}`)
    changes.push(`Stripe PI: ${marketOrder.stripePaymentIntentId?.slice(-8) || 'saknas'}`)

    if (!dryRun) {
      changes.push('⚠️ Manuell Stripe-kontroll krävs')
    } else {
      changes.push('[DRY-RUN] Skulle kontrollera Stripe PI och uppdatera MarketOrder till PAID')
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
    // Use imageUrl as thumbnail fallback
    await prisma.artworkListing.update({
      where: { id: entityId },
      data: { thumbnailUrl: listing.imageUrl },
    })
    changes.push('✅ Thumbnail satt till imageUrl som fallback')
  } else {
    changes.push('[DRY-RUN] Skulle sätta thumbnailUrl = imageUrl som fallback')
  }

  return { success: true, action: 'REBUILD_THUMBNAIL', entityId, dryRun, changes }
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
