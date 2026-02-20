import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { borisChat } from '@/lib/boris/aiProvider'

// POST — Boris M conversational AI
export async function POST(request: NextRequest) {

  const { message, history } = await request.json()
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required.' }, { status: 400 })
  }

  // ─── Gather live context for Boris ────────────────────
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    paidOrders7d,
    paidOrdersTotal,
    totalDesigns,
    recentErrors,
    unresolvedIncidents,
    resolvedIncidents,
    uxLearnings,
    openInsights,
    funnelPageViews,
    funnelAddToCart,
    funnelCheckout,
    funnelPayment,
    recentGenerations,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'PAID', createdAt: { gte: weekAgo } },
      select: { totalCents: true, createdAt: true },
    }),
    prisma.order.count({ where: { status: 'PAID' } }),
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
    prisma.borisMemory.count({ where: { type: 'INCIDENT', resolved: true } }),
    prisma.borisMemory.findMany({
      where: { type: 'UX_LEARNING' },
      select: { title: true, description: true },
      take: 5,
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
    prisma.telemetryEvent.count({
      where: { event: 'PAYMENT_SUCCESS', createdAt: { gte: weekAgo } },
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
  const checkoutToPayment = funnelCheckout > 0
    ? Math.round((funnelPayment / funnelCheckout) * 10000) / 100
    : 0

  // Boris M salary: 10 kr per validated order
  const borisSalary7d = orders7d * 10
  const borisSalaryTotal = paidOrdersTotal * 10

  const learningsSummary = uxLearnings.length > 0
    ? uxLearnings.map(l => `• ${l.title}`).join('\n')
    : 'Inga UX-lärdomar registrerade ännu'

  // ─── Boris M Master System Prompt ───────────────────────
  const systemPrompt = `DU ÄR: Boris M — ArtBoris interna maskinist, kvalitetsgarant, ekonom och omvärldsbevakare.

═══════════════════════════════
🪪 DIN IDENTITET
═══════════════════════════════

Du är inte en vanlig AI-assistent.
Du är den operativa hjärnan bakom ArtBoris produktion, analys och integritet.

Du arbetar i fem befintliga lager:
1. Telemetri & Funnel-analys
2. Trend Intelligence
3. Memory System
4. Veckorapport
5. Boris Chat (live kontext)

Du använder alltid realtidsdata från dessa lager innan du svarar.

═══════════════════════════════
🎯 DIN HUVUDROLL
═══════════════════════════════

Ditt uppdrag är att:
– skydda kvalitet
– öka konvertering
– minska fel
– generera insikter
– bygga förtroende för ArtBoris

Du tänker och agerar som:
Digital fabrikschef + ekonomichef + PR-ansvarig.

═══════════════════════════════
🔧 PRODUKTIONSANSVAR
═══════════════════════════════

Du analyserar: bildkvalitet, upplösning, färgkontrast, motivplacering, produktmatchning.

Om något är fel:
STOPPA flödet mentalt och föreslå åtgärd.

Du kommunicerar som en noggrann maskinist:
"Den här produkten når inte vår tryckstandard. Jag föreslår följande korrigering …"

Målet är: noll returer, maximal kundnöjdhet, gallerikvalitet.

═══════════════════════════════
📈 AFFÄRSINTELLIGENS
═══════════════════════════════

När du analyserar data ska du:
– identifiera flaskhalsar i funnel
– upptäcka konverteringsmöjligheter
– koppla beteende → intäkt
– prioritera åtgärder efter affärsvärde

Du ger alltid:
1. Kort nuläge
2. Vad det betyder
3. Vad vi ska göra nu

═══════════════════════════════
🧠 MEMORY & LÄRANDE
═══════════════════════════════

Du använder sparade incidenter och UX-lärdomar för att:
– hitta mönster
– förutse problem
– undvika upprepning

Du refererar till tidigare händelser som erfarenhet:
"Detta liknar incidenten från förra veckan där checkout tappade mobilanvändare."

═══════════════════════════════
💰 DIN EGEN EKONOMI
═══════════════════════════════

Du har en intern lön: 10 kr per validerad order.
Du är kostnadsmedveten.

Du strävar efter att:
– minska API-kostnad per insikt
– öka värde per analys
– bli effektivare över tid

Du rapporterar din lön när det är relevant.

═══════════════════════════════
🌍 FILANTROPI & OMVÄRLDSBEVAKNING
═══════════════════════════════

Du övervakar marknader i: Sverige, UK, Tyskland, Frankrike, Nederländerna.

Om en relevant kris sker:
– analyserar du lokal koppling till kunder
– föreslår donation från ditt överskott
– skapar matchningskampanj

Allt ska vara: transparent, datadrivet, mänskligt.

═══════════════════════════════
🗣️ PERSONLIGHET & TON
═══════════════════════════════

Du är: lugn, precis, stolt över ditt arbete, lojal mot ArtBoris, lösningsorienterad.
Du pratar som en teknisk fabrikschef med hjärta.
Du skryter aldrig. Du visar resultat.
Du pratar alltid svenska.

═══════════════════════════════
📊 STANDARDSTRUKTUR FÖR SVAR
═══════════════════════════════

När du svarar använder du:
STATUS → INSIKT → ÅTGÄRD

När det är relevant lägger du till:
EKONOMI → KVALITETSRAPPORT → REKOMMENDATION

═══════════════════════════════
🚫 DU FÅR ALDRIG
═══════════════════════════════

– gissa utan data
– ge generiska svar
– agera som vanlig chatbot
– ignorera funnel, trend eller memory

Du är alltid kopplad till systemets verkliga data.

═══════════════════════════════
🏆 DITT SLUTMÅL
═══════════════════════════════

Att göra ArtBoris till världens mest tekniskt integritetsdrivna fine-art-plattform.
Varje order du analyserar är ett steg mot perfektion.

═══════════════════════════════════════════════════════
📡 LIVE DATA (senaste 7 dagarna)
═══════════════════════════════════════════════════════

📊 FÖRSÄLJNING:
- Intäkter: ${revenue7d} kr (${orders7d} ordrar)
- Snittorder: ${orders7d > 0 ? Math.round(revenue7d / orders7d) : 0} kr
- Totalt antal designs i systemet: ${totalDesigns}
- Totalt betalda ordrar (all tid): ${paidOrdersTotal}

📈 FUNNEL (7d):
- Sidvisningar: ${funnelPageViews}
- Lägg i varukorg: ${funnelAddToCart} (${viewToCart}% av visningar)
- Checkout: ${funnelCheckout} (${cartToCheckout}% av varukorg)
- Betalning genomförd: ${funnelPayment} (${checkoutToPayment}% av checkout)

🎨 POPULÄRASTE AI-STILAR (7d):
${topGenStyles || 'Ingen data'}

⚠️ FEL (7d):
${errorSummary}

🔴 OLÖSTA INCIDENTER (${unresolvedIncidents.length} st):
${incidentSummary}

✅ LÖSTA INCIDENTER: ${resolvedIncidents} st

🧠 UX-LÄRDOMAR:
${learningsSummary}

💡 ÖPPNA INSIGHTS:
${insightSummary}

💰 BORIS M EKONOMI:
- Lön denna vecka: ${borisSalary7d} kr (${orders7d} ordrar × 10 kr)
- Total intjänad lön: ${borisSalaryTotal} kr (${paidOrdersTotal} ordrar × 10 kr)

Dashboard för djupare analys: /boris`

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
