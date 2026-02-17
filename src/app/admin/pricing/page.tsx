'use client'

import { useState, useEffect, useCallback } from 'react'

interface SizeRow { id: string; label: string; widthCm: number; heightCm: number; baseSEK: number; costSEK: number }
interface FrameRow { id: string; label: string; color: string; width: number; costSEK: number; priceSEK: number }
interface PaperRow { id: string; label: string; costSEK: number; priceSEK: number }

interface PricingConfig {
  sizes: SizeRow[]
  frames: FrameRow[]
  papers: PaperRow[]
  shippingSEK: number
  marketShippingSEK: number
  vatRate: number
  updatedAt?: string
}

function margin(price: number, cost: number): string {
  if (cost <= 0) return '—'
  const pct = ((price - cost) / price) * 100
  return `${pct.toFixed(0)}%`
}

function marginColor(price: number, cost: number): string {
  if (cost <= 0) return 'text-gray-400'
  const pct = ((price - cost) / price) * 100
  if (pct >= 50) return 'text-emerald-600'
  if (pct >= 30) return 'text-amber-600'
  return 'text-red-600'
}

export default function AdminPricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      if (data.success) setConfig(data.config)
    } catch (err) {
      console.error('Failed to fetch pricing:', err)
      setError('Kunde inte hämta priskonfiguration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sizes: config.sizes,
          frames: config.frames,
          papers: config.papers,
          shippingSEK: config.shippingSEK,
          marketShippingSEK: config.marketShippingSEK,
          vatRate: config.vatRate,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConfig(data.config)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || 'Kunde inte spara')
      }
    } catch (err) {
      setError('Nätverksfel')
    } finally {
      setSaving(false)
    }
  }

  const updateSize = (idx: number, field: keyof SizeRow, value: number | string) => {
    if (!config) return
    const sizes = [...config.sizes]
    sizes[idx] = { ...sizes[idx], [field]: value }
    setConfig({ ...config, sizes })
  }

  const updateFrame = (idx: number, field: keyof FrameRow, value: number | string) => {
    if (!config) return
    const frames = [...config.frames]
    frames[idx] = { ...frames[idx], [field]: value }
    setConfig({ ...config, frames })
  }

  const updatePaper = (idx: number, field: keyof PaperRow, value: number | string) => {
    if (!config) return
    const papers = [...config.papers]
    papers[idx] = { ...papers[idx], [field]: value }
    setConfig({ ...config, papers })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Kunde inte ladda priskonfiguration.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/orders" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Ordrar</a>
            <h1 className="text-xl font-bold text-gray-900">Priskonfiguration</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-emerald-600 font-medium">Sparat!</span>
            )}
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Crimsons kostnad</span> — fyll i efter avtal med Crimson. Marginal beräknas automatiskt.
            Priser som kunden ser uppdateras direkt efter att du sparar.
          </p>
        </div>

        {/* Sizes */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Storlekar — tryckpriser</h2>
            <p className="text-xs text-gray-500 mt-1">Baspris = vad kunden betalar för poster utan ram</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Storlek</th>
                  <th className="px-4 py-3 text-right">Crimsons kostnad</th>
                  <th className="px-4 py-3 text-right">Artboris pris</th>
                  <th className="px-4 py-3 text-right">Marginal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {config.sizes.map((size, idx) => (
                  <tr key={size.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{size.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={size.costSEK}
                          onChange={e => updateSize(idx, 'costSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={size.baseSEK}
                          onChange={e => updateSize(idx, 'baseSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${marginColor(size.baseSEK, size.costSEK)}`}>
                      {margin(size.baseSEK, size.costSEK)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Frames */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Ramar</h2>
            <p className="text-xs text-gray-500 mt-1">Pris = fast tillägg ovanpå baspriset (inte multiplikator)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Ram</th>
                  <th className="px-4 py-3 text-left">Färg</th>
                  <th className="px-4 py-3 text-right">Crimsons kostnad</th>
                  <th className="px-4 py-3 text-right">Artboris pris</th>
                  <th className="px-4 py-3 text-right">Marginal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {config.frames.map((frame, idx) => (
                  <tr key={frame.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{frame.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: frame.color }} />
                        <span className="text-xs text-gray-500 font-mono">{frame.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={frame.costSEK}
                          onChange={e => updateFrame(idx, 'costSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          disabled={frame.id === 'none'}
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={frame.priceSEK}
                          onChange={e => updateFrame(idx, 'priceSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          disabled={frame.id === 'none'}
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${frame.id === 'none' ? 'text-gray-300' : marginColor(frame.priceSEK, frame.costSEK)}`}>
                      {frame.id === 'none' ? '—' : margin(frame.priceSEK, frame.costSEK)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Papers */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Papperstyper</h2>
            <p className="text-xs text-gray-500 mt-1">Tilläggspris för premium-papper</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Papper</th>
                  <th className="px-4 py-3 text-right">Crimsons kostnad</th>
                  <th className="px-4 py-3 text-right">Artboris pris</th>
                  <th className="px-4 py-3 text-right">Marginal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {config.papers.map((paper, idx) => (
                  <tr key={paper.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{paper.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={paper.costSEK}
                          onChange={e => updatePaper(idx, 'costSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={paper.priceSEK}
                          onChange={e => updatePaper(idx, 'priceSEK', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-right text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                        <span className="text-gray-400 text-xs">kr</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${marginColor(paper.priceSEK, paper.costSEK)}`}>
                      {margin(paper.priceSEK, paper.costSEK)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Shipping + VAT */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Frakt & moms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Frakt — Wallcraft / Poster Lab</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.shippingSEK}
                  onChange={e => setConfig({ ...config, shippingSEK: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <span className="text-gray-400 text-sm">kr</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Frakt — Art Market</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.marketShippingSEK}
                  onChange={e => setConfig({ ...config, marketShippingSEK: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <span className="text-gray-400 text-sm">kr</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Moms</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={config.vatRate}
                  onChange={e => setConfig({ ...config, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <span className="text-gray-400 text-sm">({Math.round(config.vatRate * 100)}%)</span>
              </div>
            </div>
          </div>
        </section>

        {config.updatedAt && (
          <p className="text-xs text-gray-400 text-center">
            Senast uppdaterad: {new Date(config.updatedAt).toLocaleString('sv-SE')}
          </p>
        )}
      </main>
    </div>
  )
}
