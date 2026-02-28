'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import BorisArtChat from '@/components/BorisArtChat'
import MyArtworks from '@/components/MyArtworks'

const ALL_SOURCES = [
  { id: 'bukowskis', label: 'Bukowskis' },
  { id: 'barnebys', label: 'Barnebys' },
  { id: 'auctionet', label: 'Auctionet' },
  { id: 'tradera', label: 'Tradera' },
  { id: 'lauritz', label: 'Lauritz' },
  { id: 'stockholms', label: 'Stockholms Aukt.' },
  { id: 'catawiki', label: 'Catawiki' },
]

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState<'paintings' | 'sculptures'>('paintings')
  const [results, setResults] = useState<any[]>([])
  const [scanMeta, setScanMeta] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [portfolioLoading, setPortfolioLoading] = useState(true)

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/scanner/portfolio')
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data.items || [])
      }
    } catch { /* silent */ } finally {
      setPortfolioLoading(false)
    }
  }, [])

  useEffect(() => { loadPortfolio() }, [loadPortfolio])
  const [showFilters, setShowFilters] = useState(true)
  const [showBorisChat, setShowBorisChat] = useState(false)
  const [borisAnalysis, setBorisAnalysis] = useState<string | null>(null)
  const [loadingBoris, setLoadingBoris] = useState(false)
  const [activeTab, setActiveTab] = useState<'scanner' | 'my-artworks'>('scanner')
  const [selectedSources, setSelectedSources] = useState<string[]>(['bukowskis', 'barnebys', 'auctionet', 'tradera', 'lauritz', 'stockholms', 'catawiki'])
  const [sortBy, setSortBy] = useState('profit')
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500000,
    minProfit: 25000,
    minProfitMargin: 20,
    maxProfitMargin: 500,
    riskLevel: 'all' as 'all' | 'low' | 'medium' | 'high',
    recommendation: 'all' as 'all' | 'buy' | 'hold' | 'avoid',
  })

  const { t } = useTranslation()

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    )
  }

  const startScan = async () => {
    if (selectedSources.length === 0) {
      alert(t('scanner.selectSourceFirst'))
      return
    }

    setIsScanning(true)
    setResults([])
    setScanMeta(null)
    setSelectedItem(null)
    setShowAnalysis(false)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: scanType,
          sources: selectedSources,
          sortBy,
          filters,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('scanner.scanError'))
      }

      setResults(data.results || [])
      setScanMeta({
        totalFound: data.totalFound,
        totalFiltered: data.totalFiltered,
        sourceResults: data.sourceResults,
        hasAIValuation: data.hasAIValuation,
        timestamp: data.timestamp,
      })

    } catch (error) {
      console.error('Scan error:', error)
      alert(`${t('scanner.scanError')}: ${error instanceof Error ? error.message : t('scanner.unknownError')}`)
    } finally {
      setIsScanning(false)
    }
  }

  const analyzeItem = async (item: any) => {
    setSelectedItem(item)
    setShowAnalysis(true)
    setBorisAnalysis(null)
    setLoadingBoris(true)

    try {
      const res = await fetch('/api/boris-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-my-artwork',
          data: { artwork: item },
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setBorisAnalysis(json.response)
      } else {
        setBorisAnalysis(`${t('scanner.couldNotFetchAnalysis')}: ${json.error || t('scanner.unknownError')}`)
      }
    } catch (err) {
      setBorisAnalysis(`${t('scanner.couldNotReachBoris')}: ${err instanceof Error ? err.message : t('scanner.networkErrorSaving')}`)
    } finally {
      setLoadingBoris(false)
    }
  }

  const investInItem = (item: any) => {
    if (item.url) {
      window.open(item.url, '_blank')
    } else {
      alert(`${t('scanner.noDirectLink')} "${item.title}"`)
    }
    setShowAnalysis(false)
  }

  const saveToPortfolio = async (item: any) => {
    try {
      const res = await fetch('/api/scanner/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(prev => {
          const exists = prev.find(p => p.title === item.title && p.source === item.source)
          if (exists) return prev.map(p => (p.title === item.title && p.source === item.source) ? data.item : p)
          return [data.item, ...prev]
        })
        alert(`"${item.title}" ${t('scanner.savedToPortfolio')}`)
      } else {
        alert(t('scanner.couldNotSavePortfolio'))
      }
    } catch {
      alert(t('scanner.networkErrorSaving'))
    }
    setShowAnalysis(false)
  }

  // Client-side re-filtering for instant updates without re-scanning
  const filterResults = (items: any[]) => {
    return items.filter(item => {
      if (item.price < filters.minPrice || item.price > filters.maxPrice) return false
      if ((item.profit ?? item.estimatedValue - item.price) < filters.minProfit) return false
      if (item.profitMargin < filters.minProfitMargin || item.profitMargin > filters.maxProfitMargin) return false
      if (filters.riskLevel !== 'all' && item.riskLevel !== filters.riskLevel) return false
      if (filters.recommendation !== 'all' && item.recommendation !== filters.recommendation) return false
      return true
    })
  }

  const sortResults = (items: any[]) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'profit': return (b.profit ?? b.estimatedValue - b.price) - (a.profit ?? a.estimatedValue - a.price)
        case 'profitMargin': return b.profitMargin - a.profitMargin
        case 'price': return a.price - b.price
        case 'priceDesc': return b.price - a.price
        case 'confidence': return b.confidence - a.confidence
        default: return 0
      }
    })
  }

  const displayResults = sortResults(filterResults(results))

  const formatKr = (n: number) => n.toLocaleString('sv-SE')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Art Scanner</h1>
              <p className="text-gray-600 mt-2">{t('scanner.subtitle')}</p>
            </div>
            <div className="flex space-x-2">
              <a
                href="/wallcraft"
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-md hover:from-green-700 hover:to-teal-700 transition-all"
              >
                Wallcraft
              </a>
              <a
                href="/market"
                className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-4 py-2 rounded-md hover:from-rose-700 hover:to-pink-700 transition-all"
              >
                Art Market
              </a>
              <button
                onClick={() => setShowBorisChat(!showBorisChat)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                BorisArt AI
              </button>
              <button
                onClick={() => setShowPortfolio(!showPortfolio)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                {t('scanner.portfolio')} ({portfolio.length})
              </button>
            </div>
          </div>

          {/* Beskrivningar under knapparna */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <a href="/wallcraft" className="group block bg-gradient-to-br from-green-50 to-teal-50 border border-green-200/60 rounded-xl p-4 hover:shadow-md hover:border-green-300 transition-all">
              <h3 className="text-sm font-semibold text-green-800 group-hover:text-green-900">Wallcraft</h3>
              <p className="text-xs text-green-700/70 mt-1 leading-relaxed">
                {t('scanner.wallcraftDesc')}
              </p>
            </a>
            <a href="/market" className="group block bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60 rounded-xl p-4 hover:shadow-md hover:border-rose-300 transition-all">
              <h3 className="text-sm font-semibold text-rose-800 group-hover:text-rose-900">Art Market</h3>
              <p className="text-xs text-rose-700/70 mt-1 leading-relaxed">
                {t('scanner.artMarketDesc')}
              </p>
            </a>
            <a href="/wallcraft/print-your-own" className="group block bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4 hover:shadow-md hover:border-amber-300 transition-all">
              <h3 className="text-sm font-semibold text-amber-800 group-hover:text-amber-900">Print Your Own</h3>
              <p className="text-xs text-amber-700/70 mt-1 leading-relaxed">
                {t('scanner.printYourOwnDesc')}
              </p>
            </a>
            <button onClick={() => setShowBorisChat(!showBorisChat)} className="group text-left bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/60 rounded-xl p-4 hover:shadow-md hover:border-purple-300 transition-all">
              <h3 className="text-sm font-semibold text-purple-800 group-hover:text-purple-900">BorisArt AI</h3>
              <p className="text-xs text-purple-700/70 mt-1 leading-relaxed">
                {t('scanner.borisDesc')}
              </p>
            </button>
            <button onClick={() => setShowPortfolio(!showPortfolio)} className="group text-left bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-purple-200/60 rounded-xl p-4 hover:shadow-md hover:border-purple-300 transition-all">
              <h3 className="text-sm font-semibold text-purple-800 group-hover:text-purple-900">{t('scanner.portfolio')} ({portfolio.length})</h3>
              <p className="text-xs text-purple-700/70 mt-1 leading-relaxed">
                {t('scanner.portfolioDesc')}
              </p>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'scanner'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('scanner.scannerTab')}
            </button>
            <button
              onClick={() => setActiveTab('my-artworks')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'my-artworks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('scanner.myArtworksTab')}
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'scanner' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Kontrollpanel */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('scanner.searchSettings')}</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showFilters ? t('scanner.hideFilters') : t('scanner.showFilters')}
              </button>
            </div>

            {/* Scan Type */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setScanType('paintings')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  scanType === 'paintings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('scanner.paintings')}
              </button>
              <button
                onClick={() => setScanType('sculptures')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  scanType === 'sculptures'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('scanner.sculpturesOther')}
              </button>
            </div>

            {/* Sources */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('scanner.sources')}</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SOURCES.map(source => (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedSources.includes(source.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('scanner.filter')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Minsta vinst (kr) — KEY FILTER */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.minProfit')}
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={filters.minProfit}
                      onChange={(e) => setFilters({...filters, minProfit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('scanner.minProfitDesc')}</p>
                  </div>

                  {/* Pris-intervall */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.priceRange')}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 500000})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Vinstmarginal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.profitMargin')}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minProfitMargin}
                        onChange={(e) => setFilters({...filters, minProfitMargin: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxProfitMargin}
                        onChange={(e) => setFilters({...filters, maxProfitMargin: parseInt(e.target.value) || 500})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Risknivå */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.riskLevel')}
                    </label>
                    <select
                      value={filters.riskLevel}
                      onChange={(e) => setFilters({...filters, riskLevel: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">{t('scanner.all')}</option>
                      <option value="low">{t('scanner.lowRisk')}</option>
                      <option value="medium">{t('scanner.mediumRisk')}</option>
                      <option value="high">{t('scanner.highRisk')}</option>
                    </select>
                  </div>

                  {/* Rekommendation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.recommendation')}
                    </label>
                    <select
                      value={filters.recommendation}
                      onChange={(e) => setFilters({...filters, recommendation: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">{t('scanner.all')}</option>
                      <option value="buy">{t('scanner.buy')}</option>
                      <option value="hold">{t('scanner.hold')}</option>
                      <option value="avoid">{t('scanner.avoid')}</option>
                    </select>
                  </div>

                  {/* Sortering */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('scanner.sortBy')}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="profit">{t('scanner.sortProfit')}</option>
                      <option value="profitMargin">{t('scanner.sortProfitMargin')}</option>
                      <option value="price">{t('scanner.sortPriceAsc')}</option>
                      <option value="priceDesc">{t('scanner.sortPriceDesc')}</option>
                      <option value="confidence">{t('scanner.sortConfidence')}</option>
                    </select>
                  </div>

                  {/* Snabb-filter knappar */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setFilters({
                            minPrice: 0,
                            maxPrice: 500000,
                            minProfit: 50000,
                            minProfitMargin: 40,
                            maxProfitMargin: 500,
                            riskLevel: 'all',
                            recommendation: 'all',
                          })
                          setSortBy('profit')
                        }}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                      >
                        {t('scanner.highProfitBtn')}
                      </button>
                      <button
                        onClick={() => {
                          setFilters({
                            minPrice: 0,
                            maxPrice: 100000,
                            minProfit: 25000,
                            minProfitMargin: 30,
                            maxProfitMargin: 200,
                            riskLevel: 'low',
                            recommendation: 'buy',
                          })
                          setSortBy('confidence')
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                      >
                        {t('scanner.safeChoice')}
                      </button>
                      <button
                        onClick={() => {
                          setFilters({
                            minPrice: 0,
                            maxPrice: 500000,
                            minProfit: 0,
                            minProfitMargin: 0,
                            maxProfitMargin: 500,
                            riskLevel: 'all',
                            recommendation: 'all',
                          })
                          setSortBy('profit')
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
                      >
                        {t('scanner.reset')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={startScan}
              disabled={isScanning || selectedSources.length === 0}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('scanner.scanning')} {selectedSources.length} {selectedSources.length === 1 ? t('scanner.sourceSingle') : t('scanner.sourcePlural')}...
                </span>
              ) : (
                `${t('scanner.startScan')} (${selectedSources.length} ${selectedSources.length === 1 ? t('scanner.sourceSingle') : t('scanner.sourcePlural')})`
              )}
            </button>
          </div>

          {/* Scan meta info */}
          {scanMeta && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>{t('scanner.totalFound')}: <strong>{scanMeta.totalFound}</strong></span>
                <span>{t('scanner.afterFilter')}: <strong>{displayResults.length}</strong></span>
                {scanMeta.sourceResults && Object.entries(scanMeta.sourceResults).map(([source, count]) => (
                  <span key={source}>{source}: <strong>{count as number}</strong></span>
                ))}
                <span>{scanMeta.hasAIValuation ? t('scanner.aiValued') : t('scanner.priceAnalyzerValued')}</span>
              </div>
            </div>
          )}

          {/* Resultat */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('scanner.results')} ({displayResults.length}{displayResults.length !== results.length ? ` ${t('scanner.of')} ${results.length}` : ''})
              </h2>

              {displayResults.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">{t('scanner.noMatchFilter')}</p>
              ) : (
                <div className="space-y-4">
                  {displayResults.map((item, index) => {
                    const profit = item.profit ?? (item.estimatedValue - item.price)
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                            <p className="text-gray-600">{item.artist}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">{item.source}</span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  {t('scanner.viewLink')} &rarr;
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <p className="text-lg font-bold text-gray-900">{formatKr(item.price)} kr</p>
                            <p className="text-sm text-gray-500">{t('scanner.estValue')}: {formatKr(item.estimatedValue)} kr</p>
                            <p className={`text-sm font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit > 0 ? '+' : ''}{formatKr(profit)} kr ({item.profitMargin}%)
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.riskLevel === 'low' ? t('scanner.lowRisk') : item.riskLevel === 'medium' ? t('scanner.mediumRisk') : t('scanner.highRisk')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.recommendation === 'buy' ? 'bg-green-100 text-green-800' :
                              item.recommendation === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.recommendation === 'buy' ? t('scanner.buy') : item.recommendation === 'hold' ? t('scanner.hold') : t('scanner.avoid')}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {Math.round(item.confidence * 100)}% {t('scanner.confidence')}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => analyzeItem(item)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              {t('scanner.analyze')}
                            </button>
                            <button
                              onClick={() => saveToPortfolio(item)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              {t('scanner.save')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* No results message */}
          {!isScanning && results.length === 0 && scanMeta && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-500 text-lg">{t('scanner.noItemsFound')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('scanner.tryMoreSources')}</p>
            </div>
          )}

          {/* Analys Modal */}
          {showAnalysis && selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{t('scanner.detailedAnalysis')}</h2>
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bild och grundinfo */}
                    <div>
                      {selectedItem.imageUrl && (
                        <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
                          <img
                            src={selectedItem.imageUrl}
                            alt={selectedItem.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600">{selectedItem.artist}</p>
                      <p className="text-sm text-gray-500">{selectedItem.description}</p>
                      <p className="text-sm text-gray-500 mt-2">{t('scanner.sourceLabel')}: {selectedItem.source}</p>
                      {selectedItem.url && (
                        <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          {t('scanner.viewOnSource')} {selectedItem.source} &rarr;
                        </a>
                      )}
                    </div>

                    {/* Pris-analys */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">{t('scanner.priceAnalysis')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.currentPrice')}:</span>
                            <span className="font-bold text-gray-900">{formatKr(selectedItem.price)} kr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.estimatedValue')}:</span>
                            <span className="font-bold text-blue-600">{formatKr(selectedItem.estimatedValue)} kr</span>
                          </div>
                          <hr />
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.potentialProfit')}:</span>
                            <span className="font-bold text-green-600">
                              +{formatKr(selectedItem.profit ?? selectedItem.estimatedValue - selectedItem.price)} kr
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.profitMarginLabel')}:</span>
                            <span className="font-bold text-green-600">{selectedItem.profitMargin}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">{t('scanner.marketData')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.riskLevelLabel')}:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              selectedItem.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              selectedItem.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedItem.riskLevel === 'low' ? t('scanner.low') :
                               selectedItem.riskLevel === 'medium' ? t('scanner.medium') : t('scanner.high')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.confidenceLabel')}:</span>
                            <span className="font-bold">{Math.round(selectedItem.confidence * 100)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{t('scanner.marketTrend')}:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              selectedItem.marketTrend === 'rising' ? 'bg-green-100 text-green-800' :
                              selectedItem.marketTrend === 'stable' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedItem.marketTrend === 'rising' ? t('scanner.rising') :
                               selectedItem.marketTrend === 'stable' ? t('scanner.stable') : t('scanner.falling')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 ${
                        selectedItem.recommendation === 'buy' ? 'bg-green-50' :
                        selectedItem.recommendation === 'hold' ? 'bg-yellow-50' : 'bg-red-50'
                      }`}>
                        <h4 className="font-semibold text-gray-900 mb-3">{t('scanner.recommendation')}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded font-bold ${
                            selectedItem.recommendation === 'buy' ? 'bg-green-600 text-white' :
                            selectedItem.recommendation === 'hold' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {selectedItem.recommendation === 'buy' ? t('scanner.buy') :
                             selectedItem.recommendation === 'hold' ? t('scanner.hold') : t('scanner.avoid')}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {selectedItem.recommendation === 'buy' ? t('scanner.strongPotential') :
                             selectedItem.recommendation === 'hold' ? t('scanner.waitBetter') :
                             t('scanner.notRecommended')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boris AI-analys */}
                  <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🎨</span>
                      <h4 className="font-semibold text-purple-900">{t('scanner.borisAIAnalysis')}</h4>
                    </div>
                    {loadingBoris ? (
                      <div className="flex items-center gap-3 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-purple-700 text-sm">{t('scanner.borisAnalyzing')}</span>
                      </div>
                    ) : borisAnalysis ? (
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{borisAnalysis}</p>
                    ) : null}
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={() => investInItem(selectedItem)}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                    >
                      {selectedItem.url ? t('scanner.openAuction') : t('scanner.investNow')}
                    </button>
                    <button
                      onClick={() => saveToPortfolio(selectedItem)}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t('scanner.saveToPortfolio')}
                    </button>
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('scanner.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Modal */}
          {showPortfolio && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{t('scanner.myPortfolio')}</h2>
                    <button
                      onClick={() => setShowPortfolio(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  {portfolio.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">{t('scanner.noPortfolioItems')}</p>
                      <p className="text-sm text-gray-400 mt-2">{t('scanner.clickSaveOnScanned')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Portfolio Summary */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">{t('scanner.totalItems')}</p>
                            <p className="text-2xl font-bold text-purple-600">{portfolio.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">{t('scanner.totalInvestment')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatKr(portfolio.reduce((sum: number, item: any) => sum + item.price, 0))} kr
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">{t('scanner.totalEstimatedValue')}</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatKr(portfolio.reduce((sum: number, item: any) => sum + item.estimatedValue, 0))} kr
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">{t('scanner.totalPotentialProfit')}</p>
                            <p className="text-2xl font-bold text-green-600">
                              +{formatKr(portfolio.reduce((sum: number, item: any) => sum + (item.profit ?? item.estimatedValue - item.price), 0))} kr
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Items */}
                      <div className="space-y-3">
                        {portfolio.map((item: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-gray-600">{item.artist}</p>
                                <p className="text-sm text-gray-500">{item.source}</p>
                                {item.addedDate && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {t('scanner.added')}: {new Date(item.addedDate).toLocaleDateString('sv-SE')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{formatKr(item.price)} kr</p>
                                <p className="text-sm text-gray-500">&rarr; {formatKr(item.estimatedValue)} kr</p>
                                <p className="text-sm font-bold text-green-600">
                                  +{formatKr(item.profit ?? item.estimatedValue - item.price)} kr
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex space-x-2">
                              <button
                                onClick={() => analyzeItem(item)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                {t('scanner.analyze')}
                              </button>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 inline-block"
                                >
                                  {t('scanner.open')}
                                </a>
                              )}
                              <button
                                onClick={async () => {
                                  const res = await fetch('/api/scanner/portfolio', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: item.id }),
                                  })
                                  if (res.ok) {
                                    setPortfolio(prev => prev.filter((p: any) => p.id !== item.id))
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                {t('scanner.remove')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowPortfolio(false)}
                      className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      {t('scanner.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Tab Content: Mina Tavlor */}
      {activeTab === 'my-artworks' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MyArtworks />
        </div>
      )}

      {/* BorisArt AI Chat */}
      {showBorisChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">BorisArt AI</h2>
                <button
                  onClick={() => setShowBorisChat(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <BorisArtChat
                artworks={portfolio}
                selectedArtwork={selectedItem}
                scannedItems={results}
                portfolio={portfolio}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
