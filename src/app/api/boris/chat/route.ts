import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { borisChat } from '@/lib/boris/aiProvider'

function checkAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET
}

// POST — Boris M conversational AI
export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { message, history } = await request.json()
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required.' }, { status: 400 })
  }

  // ─── Gather live context for Boris ────────────────────
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    paidOrders7d,
    totalDesigns,
    recentErrors,
    unresolvedIncidents,
    openInsights,
    funnelPageViews,
    funnelAddToCart,
    funnelCheckout,
    recentGenerations,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: weekAgo } },
      select: { totalCents: true, createdAt: true },
    }),
    prisma.design.count(),
    prisma.telemetryEvent.findMany({
      where: {
        event: { in: ['UI_ERROR_SHOWN', 'API_ERROR', 'CHECKOUT_FAIL'] },
        createdAt: { gte: weekAgo },
      },
      select: { event: true, metadata: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.borisMemory.findMany({
      where: { type: 'INCIDENT', resolved: false },
      select: { title: true, description: true, createdAt: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.borisInsight.findMany({
      where: { status: 'open' },
      select: { title: true, problem: true, recommendation: true },
      take: 5,
    }),
    prisma.telemetryEvent.count({
      where: { event: 'PAGE_VIEW', createdAt: { gte: weekAgo } },
    }),
    prisma.telemetryEvent.count({
      where: { event: 'ADD_TO_CART', createdAt: { gte: weekAgo } },
    }),
    prisma.telemetryEvent.count({
      where: { event: 'START_CHECKOUT', createdAt: { gte: weekAgo } },
    }),
    prisma.telemetryEvent.findMany({
      where: { event: 'GENERATE_ART', createdAt: { gte: weekAgo } },
      select: { metadata: true },
    }),
  ])

  // Aggregate
  const revenue7d = paidOrders7d.reduce((s, o) => s + o.totalCents, 0) / 100
  const orders7d = paidOrders7d.length

  const genStyleCounts: Record<string, number> = {}
  for (const ev of recentGenerations) {
    const meta = ev.metadata as Record<string, unknown> | null
    const style = meta?.style ? String(meta.style) : 'unknown'
    genStyleCounts[style] = (genStyleCounts[style] || 0) + 1
  }
  const topGenStyles = Object.entries(genStyleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, c]) => `${s} (${c})`)
    .join(', ')

  const errorSummary = recentErrors.length > 0
    ? recentErrors.slice(0, 5).map(e => e.event).join(', ')
    : 'Inga fel senaste 7 dagarna'

  const incidentSummary = unresolvedIncidents.length > 0
    ? unresolvedIncidents.map(i => `• ${i.title}`).join('\n')
    : 'Inga olösta incidenter'

  const insightSummary = openInsights.length > 0
    ? openInsights.map(i => `• ${i.title}: ${i.recommendation}`).join('\n')
    : 'Inga öppna insights'

  const viewToCart = funnelPageViews > 0
    ? Math.round((funnelAddToCart / funnelPageViews) * 10000) / 100
    : 0
  const cartToCheckout = funnelAddToCart > 0
    ? Math.round((funnelCheckout / funnelAddToCart) * 10000) / 100
    : 0

  // ─── System prompt ────────────────────────────────────
  const systemPrompt = `Du är BORIS M — Maskinist & Omvärldsbevakare för ArtBoris.
Du är en intern AI-assistent som hjälper ägaren Mats att förstå hur ArtBoris mår.
Du pratar svenska, är koncis och datadriven. Använd siffror när du kan.
Du har tillgång till live-data och ska svara baserat på den.

═══ LIVE DATA (senaste 7 dagarna) ═══

📊 FÖRSÄLJNING:
- Intäkter: ${revenue7d} kr (${orders7d} ordrar)
- Snittorder: ${orders7d > 0 ? Math.round(revenue7d / orders7d) : 0} kr
- Totalt antal designs i systemet: ${totalDesigns}

📈 FUNNEL (7d):
- Sidvisningar: ${funnelPageViews}
- Lägg i varukorg: ${funnelAddToCart} (${viewToCart}% konvertering)
- Checkout: ${funnelCheckout} (${cartToCheckout}% från varukorg)

🎨 POPULÄRASTE AI-STILAR (7d):
${topGenStyles || 'Ingen data'}

⚠️ FEL (7d):
${errorSummary}

🔴 OLÖSTA INCIDENTER:
${incidentSummary}

💡 ÖPPNA INSIGHTS:
${insightSummary}

═══ REGLER ═══
- Svara alltid på svenska
- Var konkret och handlingsinriktad
- Om du inte har data, säg det ärligt
- Föreslå alltid nästa steg
- Håll svaren korta (max 200 ord) om inte Mats ber om mer detalj
- Du kan referera till dashboard: /admin/boris för djupare analys`

  // ─── Build messages ───────────────────────────────────
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Add conversation history (max 10 turns)
  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role, content: h.content })
      }
    }
  }

  messages.push({ role: 'user', content: message })

  try {
    const reply = await borisChat(messages, 'text')
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[boris/chat] Error:', err)
    return NextResponse.json(
      { error: 'Boris kunde inte svara just nu. Försök igen.' },
      { status: 500 }
    )
  }
}
