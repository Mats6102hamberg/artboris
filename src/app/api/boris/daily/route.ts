import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// GET — Boris Daily Machine Report
export async function GET() {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck
  const now = new Date()

  // Yesterday: 00:00 → 23:59
  const yesterdayStart = new Date(now)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  yesterdayStart.setHours(0, 0, 0, 0)

  const yesterdayEnd = new Date(now)
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
  yesterdayEnd.setHours(23, 59, 59, 999)

  // Day before yesterday (for comparison)
  const dayBeforeStart = new Date(yesterdayStart)
  dayBeforeStart.setDate(dayBeforeStart.getDate() - 1)
  const dayBeforeEnd = new Date(yesterdayEnd)
  dayBeforeEnd.setDate(dayBeforeEnd.getDate() - 1)

  // ─── 1. Revenue yesterday ──────────────────────────────
  const yesterdayOrders = await prisma.order.findMany({
    where: { status: 'PAID', createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    select: { totalCents: true },
  })
  const revenueSEK = yesterdayOrders.reduce((sum, o) => sum + o.totalCents, 0) / 100

  const dayBeforeOrders = await prisma.order.findMany({
    where: { status: 'PAID', createdAt: { gte: dayBeforeStart, lte: dayBeforeEnd } },
    select: { totalCents: true },
  })
  const revenueDayBeforeSEK = dayBeforeOrders.reduce((sum, o) => sum + o.totalCents, 0) / 100

  // ─── 2. Funnel + biggest drop (yesterday) ──────────────
  const funnelSteps = [
    'PAGE_VIEW', 'UPLOAD_ROOM', 'MARK_WALL', 'SELECT_STYLE',
    'GENERATE_ART', 'ADD_TO_CART', 'START_CHECKOUT',
  ]

  const funnelCounts: Record<string, number> = {}
  for (const step of funnelSteps) {
    const sessions = await prisma.telemetryEvent.findMany({
      where: { event: step, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      distinct: ['sessionId'],
      select: { sessionId: true },
    })
    funnelCounts[step] = sessions.length
  }

  let biggestDrop = { from: '', to: '', dropPercent: 0 }
  for (let i = 1; i < funnelSteps.length; i++) {
    const prev = funnelCounts[funnelSteps[i - 1]] || 0
    const curr = funnelCounts[funnelSteps[i]] || 0
    if (prev > 0) {
      const drop = ((prev - curr) / prev) * 100
      if (drop > biggestDrop.dropPercent) {
        biggestDrop = {
          from: funnelSteps[i - 1],
          to: funnelSteps[i],
          dropPercent: Math.round(drop),
        }
      }
    }
  }

  // ─── 3. Top blockers (auto-detected) ──────────────────
  const blockers: { label: string; severity: 'high' | 'medium' | 'low' }[] = []

  // Check: artists without Stripe Connect
  try {
    const artistsWithoutStripe = await prisma.artistProfile.count({
      where: { stripeAccountId: null },
    })
    if (artistsWithoutStripe > 0) {
      blockers.push({
        label: `${artistsWithoutStripe} konstnärer saknar Stripe-koppling`,
        severity: artistsWithoutStripe > 3 ? 'high' : 'medium',
      })
    }
  } catch { /* silent */ }

  // Check: failed fulfillments
  const failedFulfillments = await prisma.fulfillment.count({
    where: { status: 'FAILED', createdAt: { gte: yesterdayStart } },
  })
  if (failedFulfillments > 0) {
    blockers.push({
      label: `${failedFulfillments} misslyckade leveranser`,
      severity: 'high',
    })
  }

  // Check: unresolved incidents
  const unresolvedIncidents = await prisma.borisMemory.count({
    where: { type: 'INCIDENT', resolved: false },
  })
  if (unresolvedIncidents > 0) {
    blockers.push({
      label: `${unresolvedIncidents} olösta incidenter`,
      severity: unresolvedIncidents > 5 ? 'high' : 'medium',
    })
  }

  // Check: checkout errors yesterday
  const checkoutErrors = await prisma.telemetryEvent.count({
    where: {
      event: { in: ['CHECKOUT_FAIL', 'CHECKOUT_NETWORK'] },
      createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
    },
  })
  if (checkoutErrors > 0) {
    blockers.push({
      label: `${checkoutErrors} checkout-fel igår`,
      severity: checkoutErrors > 3 ? 'high' : 'medium',
    })
  }

  // Check: slow actions
  const slowActions = await prisma.telemetryEvent.count({
    where: { event: 'SLOW_ACTION', createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
  })
  if (slowActions > 5) {
    blockers.push({
      label: `${slowActions} långsamma åtgärder`,
      severity: slowActions > 20 ? 'high' : 'medium',
    })
  }

  // ─── 4. Auto-generated actions ─────────────────────────
  const actions: string[] = []

  if (blockers.some(b => b.label.includes('Stripe'))) {
    actions.push('Aktivera Stripe-påminnelse för konstnärer utan koppling')
  }

  if (biggestDrop.from === 'START_CHECKOUT' || biggestDrop.from === 'ADD_TO_CART') {
    actions.push('Visa leveranstid tidigare i flödet')
  }

  if (biggestDrop.dropPercent > 50) {
    actions.push(`Undersök UX-friktion mellan ${biggestDrop.from} → ${biggestDrop.to}`)
  }

  if (revenueSEK > 0) {
    // Find best-selling style yesterday
    const soldItems = await prisma.orderItem.findMany({
      where: { order: { status: 'PAID', createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } },
      include: { design: { select: { style: true } } },
    })
    const styleCounts: Record<string, number> = {}
    for (const item of soldItems) {
      const style = item.design?.style || 'unknown'
      styleCounts[style] = (styleCounts[style] || 0) + 1
    }
    const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]
    if (topStyle) {
      actions.push(`Feature bästsäljare "${topStyle[0]}" på startsidan`)
    }
  }

  if (checkoutErrors > 0) {
    actions.push('Granska checkout-felloggar och fixa root cause')
  }

  if (failedFulfillments > 0) {
    actions.push('Kör om misslyckade leveranser via admin')
  }

  if (actions.length === 0) {
    actions.push('Inga akuta åtgärder — fortsätt övervaka')
  }

  // ─── 5. Sales Readiness per artist ──────────────────────
  interface ArtistReadiness {
    id: string
    name: string
    readyPercent: number
    missing: string[]
  }

  const artistReadiness: ArtistReadiness[] = []
  try {
    const artists = await prisma.artistProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        stripeAccountId: true,
        stripeOnboardingDone: true,
        listings: {
          where: { isPublic: true },
          select: { id: true },
        },
        _count: { select: { listings: true } },
      },
    })

    for (const artist of artists) {
      const missing: string[] = []
      let score = 0

      // 1. Stripe (20%)
      if (artist.stripeAccountId && artist.stripeOnboardingDone) {
        score += 20
      } else {
        missing.push('Stripe')
      }

      // 2. Bio (20%)
      if (artist.bio && artist.bio.length >= 10) {
        score += 20
      } else {
        missing.push('Bio')
      }

      // 3. At least 3 listings (20%)
      if (artist._count.listings >= 3) {
        score += 20
      } else {
        missing.push(`${3 - artist._count.listings} storlekar`)
      }

      // 4. At least 1 published (20%)
      if (artist.listings.length >= 1) {
        score += 20
      } else {
        missing.push('Publicerade verk')
      }

      // 5. Avatar (20%)
      if (artist.avatarUrl && artist.avatarUrl.length > 0) {
        score += 20
      } else {
        missing.push('Profilbild')
      }

      artistReadiness.push({
        id: artist.id,
        name: artist.displayName,
        readyPercent: score,
        missing,
      })
    }
  } catch { /* silent */ }

  const avgReadiness = artistReadiness.length > 0
    ? Math.round(artistReadiness.reduce((sum, a) => sum + a.readyPercent, 0) / artistReadiness.length)
    : 0

  // ─── 6. Sessions & visitors ────────────────────────────
  const yesterdaySessions = await prisma.telemetryEvent.findMany({
    where: { event: 'PAGE_VIEW', createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    distinct: ['sessionId'],
    select: { sessionId: true },
  })

  // ─── Build response ────────────────────────────────────
  return NextResponse.json({
    date: yesterdayStart.toISOString().split('T')[0],
    revenue: {
      yesterdaySEK: revenueSEK,
      dayBeforeSEK: revenueDayBeforeSEK,
      changePercent: revenueDayBeforeSEK > 0
        ? Math.round(((revenueSEK - revenueDayBeforeSEK) / revenueDayBeforeSEK) * 100)
        : revenueSEK > 0 ? 100 : 0,
      orderCount: yesterdayOrders.length,
    },
    sessions: yesterdaySessions.length,
    biggestDrop,
    blockers,
    actions,
    salesReadiness: {
      avgPercent: avgReadiness,
      artists: artistReadiness.sort((a, b) => a.readyPercent - b.readyPercent),
    },
    funnel: funnelSteps.map(step => ({
      step,
      sessions: funnelCounts[step] || 0,
    })),
  })
}
