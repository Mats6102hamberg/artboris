import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const FUNNEL_STEPS = [
  'PAGE_VIEW',
  'VIEW_PRODUCT',
  'CLICK_TRY_ON_WALL',
  'UPLOAD_ROOM',
  'MARK_WALL',
  'SELECT_STYLE',
  'GENERATE_ART',
  'SELECT_VARIANT',
  'SELECT_SIZE',
  'SELECT_FRAME',
  'ADD_TO_CART',
  'START_CHECKOUT',
  'PAYMENT_SUCCESS',
]

// GET — funnel analysis with drop-off rates, segmented by device/locale
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7', 10)
  const device = searchParams.get('device') // mobile, desktop, tablet
  const locale = searchParams.get('locale') // sv, en, etc.

  const since = new Date()
  since.setDate(since.getDate() - days)

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
    event: { in: FUNNEL_STEPS },
  }
  if (device) where.device = device
  if (locale) where.locale = locale

  // Count unique sessions per funnel step
  const events = await prisma.telemetryEvent.groupBy({
    by: ['event'],
    where: {
      createdAt: { gte: since },
      event: { in: FUNNEL_STEPS },
      ...(device ? { device } : {}),
      ...(locale ? { locale } : {}),
    },
    _count: { sessionId: true },
  })

  // Also get unique sessions per step
  const uniqueSessions: Record<string, number> = {}
  for (const step of FUNNEL_STEPS) {
    const count = await prisma.telemetryEvent.findMany({
      where: { ...where, event: step },
      distinct: ['sessionId'],
      select: { sessionId: true },
    })
    uniqueSessions[step] = count.length
  }

  // Build funnel with drop-off
  const funnel = FUNNEL_STEPS.map((step, i) => {
    const sessions = uniqueSessions[step] || 0
    const prevSessions = i === 0 ? sessions : (uniqueSessions[FUNNEL_STEPS[i - 1]] || 0)
    const dropOff = prevSessions > 0 ? ((prevSessions - sessions) / prevSessions) * 100 : 0
    const rawCount = events.find((ev) => ev.event === step)?._count?.sessionId || 0

    return {
      step,
      index: i,
      sessions,
      rawEvents: rawCount,
      dropOffPercent: Math.round(dropOff * 10) / 10,
      conversionFromPrev: prevSessions > 0 ? Math.round(((sessions / prevSessions) * 100) * 10) / 10 : 0,
    }
  })

  // Overall conversion
  const topSessions = uniqueSessions[FUNNEL_STEPS[0]] || 0
  const bottomSessions = uniqueSessions[FUNNEL_STEPS[FUNNEL_STEPS.length - 1]] || 0
  const overallConversion = topSessions > 0 ? Math.round(((bottomSessions / topSessions) * 100) * 100) / 100 : 0

  // Worst drop-off
  const worstDropOff = funnel
    .filter((s) => s.index > 0 && s.dropOffPercent > 0)
    .sort((a, b) => b.dropOffPercent - a.dropOffPercent)[0] ?? null

  return NextResponse.json({
    period: { days, since: since.toISOString(), device, locale },
    funnel,
    overallConversion,
    worstDropOff,
    totalSessions: topSessions,
  })
}
