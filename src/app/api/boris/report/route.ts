import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// GET — Boris M weekly report
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)

  // ─── 1. Funnel metrics ────────────────────────────────
  const funnelSteps = [
    'PAGE_VIEW', 'UPLOAD_ROOM', 'MARK_WALL', 'SELECT_STYLE',
    'GENERATE_ART', 'ADD_TO_CART', 'START_CHECKOUT',
  ]

  const funnelCounts: Record<string, number> = {}
  for (const step of funnelSteps) {
    const sessions = await prisma.telemetryEvent.findMany({
      where: { event: step, createdAt: { gte: since } },
      distinct: ['sessionId'],
      select: { sessionId: true },
    })
    funnelCounts[step] = sessions.length
  }

  // Biggest drop-off
  let worstDropOff = { from: '', to: '', dropPercent: 0 }
  for (let i = 1; i < funnelSteps.length; i++) {
    const prev = funnelCounts[funnelSteps[i - 1]] || 0
    const curr = funnelCounts[funnelSteps[i]] || 0
    if (prev > 0) {
      const drop = ((prev - curr) / prev) * 100
      if (drop > worstDropOff.dropPercent) {
        worstDropOff = { from: funnelSteps[i - 1], to: funnelSteps[i], dropPercent: Math.round(drop * 10) / 10 }
      }
    }
  }

  // ─── 2. Error summary ─────────────────────────────────
  const errors = await prisma.telemetryEvent.findMany({
    where: {
      event: { in: ['UI_ERROR_SHOWN', 'API_ERROR', 'CHECKOUT_FAIL', 'CHECKOUT_NETWORK'] },
      createdAt: { gte: since },
    },
    select: { event: true, metadata: true },
  })

  const errorCounts: Record<string, number> = {}
  for (const e of errors) {
    const meta = e.metadata as Record<string, unknown> | null
    const key = meta?.errorCode ? `${e.event}:${meta.errorCode}` : e.event
    errorCounts[key] = (errorCounts[key] || 0) + 1
  }

  const topErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ─── 3. Revenue ───────────────────────────────────────
  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID', createdAt: { gte: since } },
    select: { totalCents: true },
  })
  const revenueSEK = paidOrders.reduce((sum, o) => sum + o.totalCents, 0) / 100

  // ─── 4. Top generated styles ──────────────────────────
  const genEvents = await prisma.telemetryEvent.findMany({
    where: { event: 'GENERATE_ART', createdAt: { gte: since } },
    select: { metadata: true },
  })
  const styleCounts: Record<string, number> = {}
  for (const ev of genEvents) {
    const meta = ev.metadata as Record<string, unknown> | null
    const style = meta?.style ? String(meta.style) : 'unknown'
    styleCounts[style] = (styleCounts[style] || 0) + 1
  }
  const topStyles = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ─── 5. Device split ──────────────────────────────────
  const deviceEvents = await prisma.telemetryEvent.groupBy({
    by: ['device'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  })
  const deviceSplit = deviceEvents.map((d: { device: string | null; _count: { id: number } }) => ({
    device: d.device || 'unknown',
    count: d._count.id,
  }))

  // ─── 6. Open insights ────────────────────────────────
  const openInsights = await prisma.borisInsight.count({
    where: { status: 'open' },
  })
  const unresolvedIncidents = await prisma.borisMemory.count({
    where: { type: 'INCIDENT', resolved: false },
  })

  // ─── 7. Slow actions ─────────────────────────────────
  const slowActions = await prisma.telemetryEvent.count({
    where: { event: 'SLOW_ACTION', createdAt: { gte: since } },
  })

  // ─── Build report ─────────────────────────────────────
  const totalPageViews = funnelCounts['PAGE_VIEW'] || 0
  const totalCheckouts = funnelCounts['START_CHECKOUT'] || 0

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    summary: {
      totalSessions: totalPageViews,
      totalOrders: paidOrders.length,
      revenueSEK,
      avgOrderSEK: paidOrders.length > 0 ? Math.round(revenueSEK / paidOrders.length) : 0,
      overallConversion: totalPageViews > 0
        ? Math.round((totalCheckouts / totalPageViews) * 10000) / 100
        : 0,
    },
    worstDropOff,
    topErrors,
    topStyles,
    deviceSplit,
    openInsights,
    unresolvedIncidents,
    slowActions,
    funnel: funnelSteps.map((step) => ({
      step,
      sessions: funnelCounts[step] || 0,
    })),
    recommendations: generateRecommendations({
      worstDropOff,
      topErrors,
      slowActions,
      totalPageViews,
      paidOrderCount: paidOrders.length,
    }),
  })
}

// ─── Auto-generate recommendations ─────────────────────
function generateRecommendations(data: {
  worstDropOff: { from: string; to: string; dropPercent: number }
  topErrors: { error: string; count: number }[]
  slowActions: number
  totalPageViews: number
  paidOrderCount: number
}) {
  const recs: string[] = []

  if (data.worstDropOff.dropPercent > 50) {
    recs.push(`Kritisk drop-off (${data.worstDropOff.dropPercent}%) mellan ${data.worstDropOff.from} → ${data.worstDropOff.to}. Undersök UX-friktion i detta steg.`)
  } else if (data.worstDropOff.dropPercent > 30) {
    recs.push(`Hög drop-off (${data.worstDropOff.dropPercent}%) mellan ${data.worstDropOff.from} → ${data.worstDropOff.to}. Överväg A/B-test.`)
  }

  if (data.topErrors.length > 0 && data.topErrors[0].count > 5) {
    recs.push(`Vanligaste felet: "${data.topErrors[0].error}" (${data.topErrors[0].count} gånger). Prioritera fix.`)
  }

  if (data.slowActions > 10) {
    recs.push(`${data.slowActions} långsamma åtgärder registrerade. Undersök prestanda.`)
  }

  if (data.totalPageViews > 100 && data.paidOrderCount === 0) {
    recs.push('Många sidvisningar men inga betalningar. Kontrollera checkout-flödet.')
  }

  if (recs.length === 0) {
    recs.push('Inga akuta problem identifierade. Fortsätt övervaka.')
  }

  return recs
}
