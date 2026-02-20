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
  const [tab, setTab] = useState<'funnel' | 'events' | 'insights' | 'memory'>('funnel')
  const [days, setDays] = useState(7)
  const [device, setDevice] = useState('')
  const [locale, setLocale] = useState('')

  // Data
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [eventSummary, setEventSummary] = useState<EventSummary[]>([])
  const [memories, setMemories] = useState<BorisMemory[]>([])
  const [insights, setInsights] = useState<BorisInsight[]>([])
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

  useEffect(() => {
    if (!authenticated) return
    if (tab === 'funnel') loadFunnel()
    else if (tab === 'events') loadEvents()
    else if (tab === 'memory') loadMemories()
    else if (tab === 'insights') loadInsights()
  }, [tab, authenticated, loadFunnel, loadEvents, loadMemories, loadInsights])

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
    <div className="min-h-screen bg-gray-50">
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
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value={1}>1 dag</option>
              <option value={7}>7 dagar</option>
              <option value={14}>14 dagar</option>
              <option value={30}>30 dagar</option>
            </select>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
          {(['funnel', 'events', 'insights', 'memory'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'funnel' ? '📊 Funnel' : t === 'events' ? '📡 Events' : t === 'insights' ? '💡 Insights' : '🧠 Memory'}
            </button>
          ))}
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
      </div>
    </div>
  )
}
