import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface BorisIssue {
  id: string
  type: 'ORDER_STUCK' | 'ORDER_DUPLICATE' | 'MEDIA_MISSING' | 'PRICE_ZERO' | 'ARTIST_NO_STRIPE' | 'FULFILLMENT_FAILED'
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

  // ─── A) Orders stuck in PENDING > 30 min ──────────────
  try {
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const stuckOrders = await prisma.order.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        createdAt: { lt: thirtyMinAgo },
      },
      include: {
        payment: true,
      },
    })

    for (const order of stuckOrders) {
      const minutesStuck = Math.round((now.getTime() - order.createdAt.getTime()) / 60000)
      issues.push({
        id: `order-stuck-${order.id}`,
        type: 'ORDER_STUCK',
        severity: minutesStuck > 120 ? 'high' : 'medium',
        title: `Order ${order.id.slice(-6)} fastnar i PENDING`,
        description: `Order skapad ${minutesStuck} min sedan, fortfarande PENDING. Stripe session: ${order.payment?.stripeCheckoutSessionId?.slice(-8) || 'saknas'}`,
        entityId: order.id,
        entityType: 'Order',
        revenueImpactSEK: order.totalCents / 100,
        fixAction: 'SYNC_STRIPE_PAYMENT',
        evidence: {
          orderId: order.id,
          status: order.status,
          minutesStuck,
          stripeSessionId: order.payment?.stripeCheckoutSessionId,
          stripePaymentIntentId: order.payment?.stripePaymentIntentId,
          paymentPaidAt: order.payment?.paidAt,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] Order scan failed:', err)
  }

  // ─── B) MarketOrders stuck ────────────────────────────
  try {
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const stuckMarketOrders = await prisma.marketOrder.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: thirtyMinAgo },
      },
      select: {
        id: true,
        totalCents: true,
        stripePaymentIntentId: true,
        createdAt: true,
        listing: { select: { title: true } },
      },
    })

    for (const mo of stuckMarketOrders) {
      const minutesStuck = Math.round((now.getTime() - mo.createdAt.getTime()) / 60000)
      issues.push({
        id: `market-stuck-${mo.id}`,
        type: 'ORDER_STUCK',
        severity: minutesStuck > 120 ? 'high' : 'medium',
        title: `MarketOrder "${mo.listing.title}" fastnar`,
        description: `MarketOrder PENDING i ${minutesStuck} min. PI: ${mo.stripePaymentIntentId?.slice(-8) || 'saknas'}`,
        entityId: mo.id,
        entityType: 'MarketOrder',
        revenueImpactSEK: mo.totalCents / 100,
        fixAction: 'SYNC_STRIPE_PAYMENT',
        evidence: {
          marketOrderId: mo.id,
          minutesStuck,
          stripePaymentIntentId: mo.stripePaymentIntentId,
        },
        detectedAt: now.toISOString(),
      })
    }
  } catch (err) {
    console.error('[boris/fix/scan] MarketOrder scan failed:', err)
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
