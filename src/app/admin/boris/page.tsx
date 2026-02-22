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

export default function BorisDashboard() {
  const [tab, setTab] = useState<'daily' | 'fix' | 'funnel' | 'events' | 'insights' | 'memory' | 'trends' | 'report'>('daily')
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dailyData, setDailyData] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fixData, setFixData] = useState<any>(null)
  const [fixRunning, setFixRunning] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fixResult, setFixResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (device) params.set('device', device)
      if (locale) params.set('locale', locale)
      const res = await fetch(`/api/boris/funnel?${params}`)
      const data = await res.json()
      if (data.funnel) setFunnelData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days, device, locale])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/telemetry?days=${days}&limit=2000`)
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
  }, [days])

  const loadMemories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boris/memory?limit=50')
      const data = await res.json()
      if (data.memories) setMemories(data.memories)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const loadInsights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boris/insights?limit=50')
      const data = await res.json()
      if (data.insights) setInsights(data.insights)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const loadTrends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/trends?days=${days}`)
      const data = await res.json()
      if (data.revenue) setTrendsData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days])

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boris/report?days=${days}`)
      const data = await res.json()
      if (data.summary) setReportData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [days])

  const loadDaily = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boris/daily')
      const data = await res.json()
      if (data.date) setDailyData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const loadFix = useCallback(async () => {
    setLoading(true)
    setFixResult(null)
    try {
      const res = await fetch('/api/boris/fix/scan')
      const data = await res.json()
      if (data.issues) setFixData(data)
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  const runFix = async (action: string, entityId: string, dryRun: boolean) => {
    setFixRunning(`${action}-${entityId}-${dryRun ? 'dry' : 'live'}`)
    setFixResult(null)
    try {
      const res = await fetch('/api/boris/fix/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, entityId, dryRun }),
      })
      const data = await res.json()
      setFixResult(data)
      if (!dryRun && data.success) loadFix()
    } catch { /* silent */ }
    setFixRunning(null)
  }

  useEffect(() => {
    if (tab === 'daily') loadDaily()
    else if (tab === 'fix') loadFix()
    else if (tab === 'funnel') loadFunnel()
    else if (tab === 'events') loadEvents()
    else if (tab === 'memory') loadMemories()
    else if (tab === 'insights') loadInsights()
    else if (tab === 'trends') loadTrends()
    else if (tab === 'report') loadReport()
  }, [tab, loadDaily, loadFix, loadFunnel, loadEvents, loadMemories, loadInsights, loadTrends, loadReport])

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
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {(['daily', 'fix', 'funnel', 'events', 'trends', 'insights', 'memory', 'report'] as const).map((t) => {
            const labels: Record<string, string> = {
              daily: '🧠 Daily', fix: '🔧 Fix', funnel: '📊 Funnel', events: '📡 Events', trends: '📈 Trends',
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

        {/* FIX PANEL TAB */}
        {tab === 'fix' && !fixData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">Skannar... inga issues hittade.</p>
          </div>
        )}
        {tab === 'fix' && fixData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Issues</p>
                <p className="text-3xl font-bold text-gray-900">{fixData.issueCount}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-red-200">
                <p className="text-sm text-gray-500">High</p>
                <p className="text-3xl font-bold text-red-600">{fixData.bySeverity.high}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-amber-200">
                <p className="text-sm text-gray-500">Medium</p>
                <p className="text-3xl font-bold text-amber-600">{fixData.bySeverity.medium}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Revenue at risk</p>
                <p className="text-3xl font-bold text-red-600">{fixData.totalRevenueAtRiskSEK} kr</p>
              </div>
            </div>

            {/* Fix result */}
            {fixResult && (
              <div className={`rounded-xl border p-4 ${
                fixResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${fixResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {fixResult.success ? '✅' : '❌'} {fixResult.action} {fixResult.dryRun ? '(DRY-RUN)' : '(LIVE)'}
                  </span>
                  {fixResult.verification && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      fixResult.verification.status === 'PASS' ? 'bg-green-200 text-green-800' :
                      fixResult.verification.status === 'FAIL' ? 'bg-red-200 text-red-800' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {fixResult.verification.status === 'PASS' ? '✓ PASS' :
                       fixResult.verification.status === 'FAIL' ? '✗ FAIL' : '⏭ SKIPPED'}
                    </span>
                  )}
                </div>
                {fixResult.verification && (
                  <p className={`text-xs mb-2 ${
                    fixResult.verification.status === 'PASS' ? 'text-green-700' :
                    fixResult.verification.status === 'FAIL' ? 'text-red-700' : 'text-gray-500'
                  }`}>
                    Verification: {fixResult.verification.reason}
                  </p>
                )}
                <div className="space-y-1">
                  {fixResult.changes?.map((c: string, i: number) => (
                    <p key={i} className="text-xs text-gray-700">{c}</p>
                  ))}
                  {fixResult.error && <p className="text-xs text-red-600 font-medium">{fixResult.error}</p>}
                </div>
              </div>
            )}

            {/* Issues list */}
            <div className="space-y-3">
              {fixData.issues.map((issue: {
                id: string; type: string; severity: string; title: string; description: string;
                summary?: string; primaryId?: string; recommendedAction?: string;
                entityId: string; fixAction: string; revenueImpactSEK: number;
                evidence: Record<string, unknown>
              }) => (
                <div key={issue.id} className={`bg-white rounded-xl border overflow-hidden ${
                  issue.severity === 'high' ? 'border-red-200' :
                  issue.severity === 'medium' ? 'border-amber-200' : 'border-gray-200'
                }`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{issue.type}</span>
                        {issue.revenueImpactSEK > 0 && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                            {issue.revenueImpactSEK} kr at risk
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{issue.title}</h3>
                    {issue.summary ? (
                      <p className="text-xs text-gray-700 mt-1 font-medium">{issue.summary}</p>
                    ) : (
                      <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                    )}
                    {issue.recommendedAction && (
                      <p className="text-[11px] text-blue-600 mt-1">→ {issue.recommendedAction}</p>
                    )}

                    {/* Evidence */}
                    <details className="mt-2">
                      <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">Visa detaljer</summary>
                      <p className="text-[10px] text-gray-500 mt-1">{issue.description}</p>
                      {issue.primaryId && <p className="text-[10px] text-gray-400 mt-0.5">ID: {issue.primaryId}</p>}
                      <pre className="text-[10px] text-gray-500 mt-1 bg-gray-50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(issue.evidence, null, 2)}
                      </pre>
                    </details>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => runFix(issue.fixAction, issue.entityId, true)}
                        disabled={fixRunning !== null}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      >
                        {fixRunning === `${issue.fixAction}-${issue.entityId}-dry` ? '⏳ Kör...' : '🔍 Dry Run'}
                      </button>
                      {issue.severity !== 'high' ? (
                        <button
                          onClick={() => runFix(issue.fixAction, issue.entityId, false)}
                          disabled={fixRunning !== null}
                          className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          {fixRunning === `${issue.fixAction}-${issue.entityId}-live` ? '⏳ Kör...' : '⚡ Kör Fix'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`⚠️ HIGH SEVERITY: Kör ${issue.fixAction} på ${issue.entityId.slice(-8)}?`)) {
                              runFix(issue.fixAction, issue.entityId, false)
                            }
                          }}
                          disabled={fixRunning !== null}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          {fixRunning === `${issue.fixAction}-${issue.entityId}-live` ? '⏳ Kör...' : '⚠️ Kör Fix (High)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {fixData.issueCount === 0 && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
                <p className="text-lg font-semibold text-green-800">✅ Inga issues hittade</p>
                <p className="text-sm text-green-600 mt-1">Allt ser bra ut just nu</p>
              </div>
            )}
          </div>
        )}

        {/* DAILY MACHINE REPORT TAB */}
        {tab === 'daily' && !dailyData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">Ingen daglig data ännu.</p>
          </div>
        )}
        {tab === 'daily' && dailyData && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🧠</span>
                <div>
                  <h2 className="text-lg font-bold">BORIS DAILY MACHINE REPORT</h2>
                  <p className="text-sm text-gray-400">{dailyData.date}</p>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-300 mb-1">Revenue yesterday</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold">{Math.round(dailyData.revenue.yesterdaySEK).toLocaleString('sv-SE')} kr</p>
                  {dailyData.revenue.changePercent !== 0 && (
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      dailyData.revenue.changePercent > 0
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {dailyData.revenue.changePercent > 0 ? '+' : ''}{dailyData.revenue.changePercent}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{dailyData.revenue.orderCount} ordrar · {dailyData.sessions} sessioner</p>
              </div>

              {/* Biggest drop */}
              {dailyData.biggestDrop.dropPercent > 0 && (
                <div className="bg-red-500/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-200 mb-1">Biggest drop</p>
                  <p className="text-lg font-bold text-red-100">
                    {dailyData.biggestDrop.from} → {dailyData.biggestDrop.to}
                  </p>
                  <p className="text-sm text-red-300">-{dailyData.biggestDrop.dropPercent}% tappar här</p>
                </div>
              )}
            </div>

            {/* Top blockers */}
            {dailyData.blockers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">🚫 Top Blockers</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {dailyData.blockers.map((b: { label: string; severity: string }, i: number) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-900">{b.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.severity === 'high' ? 'bg-red-100 text-red-700' :
                        b.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {b.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h2 className="font-semibold text-amber-900 mb-3">⚡ Actions</h2>
              <ol className="space-y-2">
                {dailyData.actions.map((action: string, i: number) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-3">
                    <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sales Readiness */}
            {dailyData.salesReadiness && dailyData.salesReadiness.artists.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">🎯 Sales Readiness</h2>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    dailyData.salesReadiness.avgPercent >= 80 ? 'bg-green-100 text-green-700' :
                    dailyData.salesReadiness.avgPercent >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Snitt: {dailyData.salesReadiness.avgPercent}%
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {dailyData.salesReadiness.artists.map((a: { id: string; name: string; readyPercent: number; missing: string[] }) => (
                    <div key={a.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{a.name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.readyPercent >= 80 ? 'bg-green-100 text-green-700' :
                          a.readyPercent >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {a.readyPercent}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            a.readyPercent >= 80 ? 'bg-green-400' :
                            a.readyPercent >= 50 ? 'bg-amber-400' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${a.readyPercent}%` }}
                        />
                      </div>
                      {a.missing.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Saknas: <span className="text-red-600 font-medium">{a.missing.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini funnel */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">📊 Funnel igår</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {dailyData.funnel.map((step: { step: string; sessions: number }, i: number) => {
                  const maxSessions = dailyData.funnel[0]?.sessions || 1
                  const barWidth = maxSessions > 0 ? (step.sessions / maxSessions) * 100 : 0
                  return (
                    <div key={step.step} className="px-5 py-2.5 flex items-center gap-4">
                      <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{step.step}</span>
                          <span className="text-xs text-gray-500">{step.sessions}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-400" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
