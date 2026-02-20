'use client'

import { useState, useEffect, useCallback } from 'react'

interface FunnelStep {
  step: string
  index: number
  sessions: number
  rawEvents: number
  dropOffPercent: number
  conversionFromPrev: number
}

interface FunnelData {
  period: { days: number; since: string; device: string | null; locale: string | null }
  funnel: FunnelStep[]
  overallConversion: number
  worstDropOff: FunnelStep | null
  totalSessions: number
}

interface BorisMemory {
  id: string
  type: string
  title: string
  description: string
  tags: string[]
  confidence: number
  resolved: boolean
  createdAt: string
}

interface BorisInsight {
  id: string
  category: string
  title: string
  problem: string
  segment: string | null
  hypothesis: string | null
  recommendation: string | null
  riskLevel: string
  status: string
  createdAt: string
}

interface EventSummary {
  event: string
  count: number
}

const ADMIN_KEY = typeof window !== 'undefined'
  ? localStorage.getItem('admin_secret') || ''
  : ''

function headers() {
  return { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' }
}

export default function BorisDashboard() {
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<'funnel' | 'events' | 'insights' | 'memory' | 'trends' | 'report'>('funnel')
  const [days, setDays] = useState(7)
  const [device, setDevice] = useState('')
  const [locale, setLocale] = useState('')

  // Data
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [eventSummary, setEventSummary] = useState<EventSummary[]>([])
  const [memories, setMemories] = useState<BorisMemory[]>([])
  const [insights, setInsights] = useState<BorisInsight[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendsData, setTrendsData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_secret')
    if (stored) {
      setAdminKey(stored)
      setAuthenticated(true)
    }
  }, [])

  const authHeaders = useCallback(() => ({
    'x-admin-key': adminKey,
    'Content-Type': 'application/json',
  }), [adminKey])

  const handleLogin = () => {
    localStorage.setItem('admin_secret', adminKey)
    setAuthenticated(true)
  }

  const loadFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (device) params.set('device', device)
      if (locale) params.set('locale', locale)
      const res = await fetch(`/api/boris/funnel?${params}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.funnel) setFunnelData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days, device, locale, authHeaders])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/telemetry?days=${days}&limit=2000`, { headers: authHeaders() })
      const data = await res.json()
      if (data.events) {
        const counts: Record<string, number> = {}
        data.events.forEach((e: { event: string }) => {
          counts[e.event] = (counts[e.event] || 0) + 1
        })
        const summary = Object.entries(counts)
          .map(([event, count]) => ({ event, count }))
          .sort((a, b) => b.count - a.count)
        setEventSummary(summary)
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [days, authHeaders])

  const loadMemories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boris/memory?limit=50', { headers: authHeaders() })
      const data = await res.json()
      if (data.memories) setMemories(data.memories)
    } catch { /* silent */ }
    setLoading(false)
  }, [authHeaders])

  const loadInsights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boris/insights?limit=50', { headers: authHeaders() })
      const data = await res.json()
      if (data.insights) setInsights(data.insights)
    } catch { /* silent */ }
    setLoading(false)
  }, [authHeaders])

  const loadTrends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/trends?days=${days}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.revenue) setTrendsData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days, authHeaders])

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/report?days=${days}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.summary) setReportData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days, authHeaders])

  useEffect(() => {
    if (!authenticated) return
    if (tab === 'funnel') loadFunnel()
    else if (tab === 'events') loadEvents()
    else if (tab === 'memory') loadMemories()
    else if (tab === 'insights') loadInsights()
    else if (tab === 'trends') loadTrends()
    else if (tab === 'report') loadReport()
  }, [tab, authenticated, loadFunnel, loadEvents, loadMemories, loadInsights, loadTrends, loadReport])

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-1">🔧 Boris M</h1>
          <p className="text-sm text-gray-500 mb-6">Maskinist & Omvärldsbevakare</p>
          <input
            type="password"
            placeholder="Admin Secret"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm mb-3"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Logga in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ color: '#111827' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🔧 Boris M — Dashboard</h1>
            <p className="text-sm text-gray-500">Flow Doctor · Trend Intelligence · Memory</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value={1}>1 dag</option>
              <option value={7}>7 dagar</option>
              <option value={14}>14 dagar</option>
              <option value={30}>30 dagar</option>
            </select>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">Alla enheter</option>
              <option value="mobile">Mobil</option>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['funnel', 'events', 'trends', 'insights', 'memory', 'report'] as const).map((t) => {
            const labels: Record<string, string> = {
              funnel: '📊 Funnel', events: '📡 Events', trends: '📈 Trends',
              insights: '💡 Insights', memory: '🧠 Memory', report: '📋 Rapport',
            }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            Laddar...
          </div>
        )}

        {/* FUNNEL TAB */}
        {tab === 'funnel' && !funnelData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">Ingen funnel-data ännu. Data samlas in när besökare använder sidan.</p>
          </div>
        )}
        {tab === 'funnel' && funnelData && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Totala sessioner</p>
                <p className="text-3xl font-bold text-gray-900">{funnelData.totalSessions}</p>
                <p className="text-xs text-gray-400 mt-1">Senaste {funnelData.period.days} dagar</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total konvertering</p>
                <p className="text-3xl font-bold text-green-600">{funnelData.overallConversion}%</p>
                <p className="text-xs text-gray-400 mt-1">Sidvisning → Betalning</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Värsta drop-off</p>
                {funnelData.worstDropOff ? (
                  <>
                    <p className="text-3xl font-bold text-red-600">{funnelData.worstDropOff.dropOffPercent}%</p>
                    <p className="text-xs text-gray-400 mt-1">{funnelData.worstDropOff.step}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">Ingen data</p>
                )}
              </div>
            </div>

            {/* Funnel visualization */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Konverteringstratt</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {funnelData.funnel.map((step, i) => {
                  const maxSessions = funnelData.funnel[0]?.sessions || 1
                  const barWidth = maxSessions > 0 ? (step.sessions / maxSessions) * 100 : 0
                  const isDropOff = step.dropOffPercent > 30

                  return (
                    <div key={step.step} className="px-5 py-3 flex items-center gap-4">
                      <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{step.step}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{step.sessions} sessioner</span>
                            {i > 0 && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isDropOff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {step.dropOffPercent > 0 ? `-${step.dropOffPercent}%` : '0%'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isDropOff ? 'bg-red-400' : 'bg-blue-400'}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {tab === 'events' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Event-fördelning ({days} dagar)</h2>
            </div>
            {eventSummary.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Inga events registrerade ännu.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {eventSummary.map((e) => (
                  <div key={e.event} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{e.event}</span>
                    <span className="text-sm text-gray-500 tabular-nums">{e.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {tab === 'insights' && (
          <div className="space-y-3">
            {insights.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
                <p className="text-sm text-gray-400">Inga insights ännu. Boris genererar insights baserat på telemetridata.</p>
              </div>
            ) : (
              insights.map((ins) => (
                <div key={ins.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                        ins.category === 'flow_doctor' ? 'bg-blue-100 text-blue-700' :
                        ins.category === 'trend' ? 'bg-purple-100 text-purple-700' :
                        ins.category === 'bug' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ins.category}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ins.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        ins.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {ins.riskLevel} risk
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      ins.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                      ins.status === 'testing' ? 'bg-blue-100 text-blue-700' :
                      ins.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ins.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{ins.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{ins.problem}</p>
                  {ins.hypothesis && <p className="text-sm text-gray-500 mt-2 italic">Hypotes: {ins.hypothesis}</p>}
                  {ins.recommendation && <p className="text-sm text-blue-600 mt-1">→ {ins.recommendation}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* MEMORY TAB */}
        {tab === 'memory' && (
          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
                <p className="text-sm text-gray-400">Inget i Boris minne ännu. Minnen skapas automatiskt vid incidenter och UX-lärdomar.</p>
              </div>
            ) : (
              memories.map((mem) => (
                <div key={mem.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      mem.type === 'INCIDENT' ? 'bg-red-100 text-red-700' :
                      mem.type === 'UX_LEARNING' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {mem.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Confidence: {Math.round(mem.confidence * 100)}%</span>
                      {mem.resolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Löst</span>}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{mem.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{mem.description}</p>
                  {mem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mem.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TRENDS TAB */}
        {tab === 'trends' && !trendsData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">Ingen trend-data ännu. Data samlas in från ordrar och genereringar.</p>
          </div>
        )}
        {tab === 'trends' && trendsData && (
          <div className="space-y-6">
            {/* Revenue KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Intäkter</p>
                <p className="text-2xl font-bold text-gray-900">{trendsData.revenue.totalSEK} kr</p>
                <p className="text-xs text-gray-400">{trendsData.revenue.totalOrders} ordrar</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Snittorder</p>
                <p className="text-2xl font-bold text-gray-900">{trendsData.revenue.avgOrderSEK} kr</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">AI-genererade</p>
                <p className="text-2xl font-bold text-purple-600">{trendsData.revenue.aiGenerated}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Uppladdade</p>
                <p className="text-2xl font-bold text-blue-600">{trendsData.revenue.uploaded}</p>
              </div>
            </div>

            {/* Top styles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Bästsäljande stilar</h2>
                </div>
                {trendsData.topStyles.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 text-center">Ingen försäljningsdata ännu</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {trendsData.topStyles.map((s: { style: string; count: number; revenueSEK: number }) => (
                      <div key={s.style} className="px-5 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{s.style}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">{s.count} st</span>
                          <span className="text-xs text-gray-400 ml-2">{s.revenueSEK} kr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Populäraste storlekar</h2>
                </div>
                {trendsData.topSizes.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400 text-center">Ingen data</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {trendsData.topSizes.map((s: { size: string; count: number; revenueSEK: number }) => (
                      <div key={s.size} className="px-5 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{s.size}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">{s.count} st</span>
                          <span className="text-xs text-gray-400 ml-2">{s.revenueSEK} kr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Popular generations */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Mest genererade stilar (AI)</h2>
              </div>
              {trendsData.popularGenerations.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Inga genereringar registrerade</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {trendsData.popularGenerations.map((g: { style: string; generations: number }) => (
                    <div key={g.style} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{g.style}</span>
                      <span className="text-sm text-gray-500">{g.generations} genereringar</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversion */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Konverteringsmetrik</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sidvisningar</p>
                  <p className="text-lg font-bold">{trendsData.conversion.pageViews}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lägg i varukorg</p>
                  <p className="text-lg font-bold">{trendsData.conversion.addToCart}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vy → Varukorg</p>
                  <p className="text-lg font-bold text-blue-600">{trendsData.conversion.viewToCartRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Varukorg → Checkout</p>
                  <p className="text-lg font-bold text-green-600">{trendsData.conversion.cartToCheckoutRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {tab === 'report' && !reportData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">Ingen rapport-data ännu. Rapporten genereras från telemetri och ordrar.</p>
          </div>
        )}
        {tab === 'report' && reportData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">📋 Boris Veckorapport ({reportData.period.days} dagar)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Sessioner</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalSessions}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ordrar</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Intäkter</p>
                  <p className="text-2xl font-bold text-green-600">{reportData.summary.revenueSEK} kr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Konvertering</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.summary.overallConversion}%</p>
                </div>
              </div>

              {/* Worst drop-off */}
              {reportData.worstDropOff.dropPercent > 0 && (
                <div className="bg-red-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-800">
                    ⚠️ Största drop-off: {reportData.worstDropOff.dropPercent}% mellan {reportData.worstDropOff.from} → {reportData.worstDropOff.to}
                  </p>
                </div>
              )}

              {/* Device split */}
              {reportData.deviceSplit.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Enhetsfördelning</p>
                  <div className="flex gap-3">
                    {reportData.deviceSplit.map((d: { device: string; count: number }) => (
                      <span key={d.device} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                        {d.device}: {d.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">Öppna insights: <strong>{reportData.openInsights}</strong></span>
                <span className="text-gray-500">Olösta incidenter: <strong>{reportData.unresolvedIncidents}</strong></span>
                <span className="text-gray-500">Långsamma åtgärder: <strong>{reportData.slowActions}</strong></span>
              </div>
            </div>

            {/* Top errors */}
            {reportData.topErrors.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Vanligaste felen</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {reportData.topErrors.map((e: { error: string; count: number }) => (
                    <div key={e.error} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700">{e.error}</span>
                      <span className="text-sm text-gray-500">{e.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h2 className="font-semibold text-amber-900 mb-3">🔧 Boris rekommendationer</h2>
              <ul className="space-y-2">
                {reportData.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="mt-0.5">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top styles */}
            {reportData.topStyles.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Populäraste stilar</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {reportData.topStyles.map((s: { style: string; count: number }) => (
                    <div key={s.style} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{s.style}</span>
                      <span className="text-sm text-gray-500">{s.count} genereringar</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
