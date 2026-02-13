'use client'

import { useState } from 'react'
import BorisArtChat from '@/components/BorisArtChat'
import MyArtworks from '@/components/MyArtworks'

const ALL_SOURCES = [
  { id: 'bukowskis', label: 'Bukowskis' },
  { id: 'barnebys', label: 'Barnebys' },
  { id: 'auctionet', label: 'Auctionet' },
  { id: 'tradera', label: 'Tradera' },
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
  const [showFilters, setShowFilters] = useState(true)
  const [showBorisChat, setShowBorisChat] = useState(false)
  const [activeTab, setActiveTab] = useState<'scanner' | 'my-artworks'>('scanner')
  const [selectedSources, setSelectedSources] = useState<string[]>(['bukowskis', 'barnebys', 'auctionet', 'tradera'])
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

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    )
  }

  const startScan = async () => {
    if (selectedSources.length === 0) {
      alert('Välj minst en källa att söka i.')
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
        throw new Error(data.error || 'Scanning failed')
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
      alert(`Scanning fel: ${error instanceof Error ? error.message : 'Okänt fel'}`)
    } finally {
      setIsScanning(false)
    }
  }

  const analyzeItem = (item: any) => {
    setSelectedItem(item)
    setShowAnalysis(true)
  }

  const investInItem = (item: any) => {
    if (item.url) {
      window.open(item.url, '_blank')
    } else {
      alert(`Ingen direktlänk tillgänglig för "${item.title}"`)
    }
    setShowAnalysis(false)
  }

  const saveToPortfolio = (item: any) => {
    if (!portfolio.find(p => p.title === item.title && p.source === item.source)) {
      setPortfolio([...portfolio, { ...item, addedDate: new Date().toISOString() }])
      alert(`"${item.title}" har sparats till din portfölj!`)
    } else {
      alert(`"${item.title}" finns redan i din portfölj!`)
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
              <p className="text-gray-600 mt-2">Hitta undervärderade konstverk med vinstpotential</p>
            </div>
            <div className="flex space-x-2">
              <a
                href="/wallcraft"
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-md hover:from-green-700 hover:to-teal-700 transition-all"
              >
                Wallcraft
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
                Portfölj ({portfolio.length})
              </button>
            </div>
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
              Art Scanner
            </button>
            <button
              onClick={() => setActiveTab('my-artworks')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'my-artworks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mina Tavlor
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'scanner' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Kontrollpanel */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Sök-inställningar</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showFilters ? 'Dölj filter' : 'Visa filter'}
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
                Målningar
              </button>
              <button
                onClick={() => setScanType('sculptures')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  scanType === 'sculptures'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Skulpturer & Annat
              </button>
            </div>

            {/* Sources */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Källor</label>
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
                <h3 className="font-semibold text-gray-900 mb-3">Filter</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Minsta vinst (kr) — KEY FILTER */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minsta vinst (kr)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={filters.minProfit}
                      onChange={(e) => setFilters({...filters, minProfit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Filtrera bort objekt med för liten vinst</p>
                  </div>

                  {/* Pris-intervall */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prisintervall (kr)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 500000})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Vinstmarginal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vinstmarginal (%)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minProfitMargin}
                        onChange={(e) => setFilters({...filters, minProfitMargin: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxProfitMargin}
                        onChange={(e) => setFilters({...filters, maxProfitMargin: parseInt(e.target.value) || 500})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Risknivå */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risknivå
                    </label>
                    <select
                      value={filters.riskLevel}
                      onChange={(e) => setFilters({...filters, riskLevel: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Alla</option>
                      <option value="low">Låg risk</option>
                      <option value="medium">Medium risk</option>
                      <option value="high">Hög risk</option>
                    </select>
                  </div>

                  {/* Rekommendation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rekommendation
                    </label>
                    <select
                      value={filters.recommendation}
                      onChange={(e) => setFilters({...filters, recommendation: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Alla</option>
                      <option value="buy">KÖP</option>
                      <option value="hold">HÅLL</option>
                      <option value="avoid">UNDVIK</option>
                    </select>
                  </div>

                  {/* Sortering */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sortera efter
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="profit">Vinst (kr) - högst först</option>
                      <option value="profitMargin">Vinstmarginal (%) - högst först</option>
                      <option value="price">Pris - lägst först</option>
                      <option value="priceDesc">Pris - högst först</option>
                      <option value="confidence">Konfidens - högst först</option>
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
                        Hög vinst (min 50k kr)
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
                        Säkert val
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
                        Återställ
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
                  Söker igenom {selectedSources.length} käll{selectedSources.length === 1 ? 'a' : 'or'}...
                </span>
              ) : (
                `Starta Skanning (${selectedSources.length} käll${selectedSources.length === 1 ? 'a' : 'or'})`
              )}
            </button>
          </div>

          {/* Scan meta info */}
          {scanMeta && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Totalt hittade: <strong>{scanMeta.totalFound}</strong></span>
                <span>Efter filter: <strong>{displayResults.length}</strong></span>
                {scanMeta.sourceResults && Object.entries(scanMeta.sourceResults).map(([source, count]) => (
                  <span key={source}>{source}: <strong>{count as number}</strong></span>
                ))}
                <span>{scanMeta.hasAIValuation ? 'AI-värderade' : 'PriceAnalyzer-värderade'}</span>
              </div>
            </div>
          )}

          {/* Resultat */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Resultat ({displayResults.length}{displayResults.length !== results.length ? ` av ${results.length}` : ''})
              </h2>

              {displayResults.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">Inga objekt matchar dina filter. Prova att sänka minsta vinst eller bredda filtren.</p>
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
                                  Visa &rarr;
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <p className="text-lg font-bold text-gray-900">{formatKr(item.price)} kr</p>
                            <p className="text-sm text-gray-500">Est. värde: {formatKr(item.estimatedValue)} kr</p>
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
                              {item.riskLevel === 'low' ? 'Låg risk' : item.riskLevel === 'medium' ? 'Medium' : 'Hög risk'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.recommendation === 'buy' ? 'bg-green-100 text-green-800' :
                              item.recommendation === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.recommendation === 'buy' ? 'KÖP' : item.recommendation === 'hold' ? 'HÅLL' : 'UNDVIK'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {Math.round(item.confidence * 100)}% konfidens
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => analyzeItem(item)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Analysera
                            </button>
                            <button
                              onClick={() => saveToPortfolio(item)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Spara
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
              <p className="text-gray-500 text-lg">Inga objekt hittades.</p>
              <p className="text-gray-400 text-sm mt-2">Prova att välja fler källor eller bredda filtren.</p>
            </div>
          )}

          {/* Analys Modal */}
          {showAnalysis && selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Detaljerad Analys</h2>
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
                      <p className="text-sm text-gray-500 mt-2">Källa: {selectedItem.source}</p>
                      {selectedItem.url && (
                        <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          Visa på {selectedItem.source} &rarr;
                        </a>
                      )}
                    </div>

                    {/* Pris-analys */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Pris-analys</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nuvarande pris:</span>
                            <span className="font-bold text-gray-900">{formatKr(selectedItem.price)} kr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimerat värde:</span>
                            <span className="font-bold text-blue-600">{formatKr(selectedItem.estimatedValue)} kr</span>
                          </div>
                          <hr />
                          <div className="flex justify-between">
                            <span className="text-gray-600">Potentiell vinst:</span>
                            <span className="font-bold text-green-600">
                              +{formatKr(selectedItem.profit ?? selectedItem.estimatedValue - selectedItem.price)} kr
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vinstmarginal:</span>
                            <span className="font-bold text-green-600">{selectedItem.profitMargin}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Marknadsdata</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risknivå:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              selectedItem.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              selectedItem.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedItem.riskLevel === 'low' ? 'Låg' :
                               selectedItem.riskLevel === 'medium' ? 'Medium' : 'Hög'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Konfidens:</span>
                            <span className="font-bold">{Math.round(selectedItem.confidence * 100)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Marknadstrend:</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              selectedItem.marketTrend === 'rising' ? 'bg-green-100 text-green-800' :
                              selectedItem.marketTrend === 'stable' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedItem.marketTrend === 'rising' ? 'Stigande' :
                               selectedItem.marketTrend === 'stable' ? 'Stabil' : 'Fallande'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-lg p-4 ${
                        selectedItem.recommendation === 'buy' ? 'bg-green-50' :
                        selectedItem.recommendation === 'hold' ? 'bg-yellow-50' : 'bg-red-50'
                      }`}>
                        <h4 className="font-semibold text-gray-900 mb-3">Rekommendation</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded font-bold ${
                            selectedItem.recommendation === 'buy' ? 'bg-green-600 text-white' :
                            selectedItem.recommendation === 'hold' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {selectedItem.recommendation === 'buy' ? 'KÖP' :
                             selectedItem.recommendation === 'hold' ? 'HÅLL' : 'UNDVIK'}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {selectedItem.recommendation === 'buy' ? 'Stark vinstpotential' :
                             selectedItem.recommendation === 'hold' ? 'Vänta på bättre läge' :
                             'Rekommenderas inte'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={() => investInItem(selectedItem)}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                    >
                      {selectedItem.url ? 'Öppna auktion' : 'Investera nu'}
                    </button>
                    <button
                      onClick={() => saveToPortfolio(selectedItem)}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Spara till portfölj
                    </button>
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Stäng
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
                    <h2 className="text-2xl font-bold text-gray-900">Min Portfölj</h2>
                    <button
                      onClick={() => setShowPortfolio(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  {portfolio.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Du har inga objekt i din portfölj än.</p>
                      <p className="text-sm text-gray-400 mt-2">Klicka &quot;Spara&quot; på skannade objekt.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Portfolio Summary */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Totalt objekt</p>
                            <p className="text-2xl font-bold text-purple-600">{portfolio.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total investering</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatKr(portfolio.reduce((sum: number, item: any) => sum + item.price, 0))} kr
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Estimerat värde</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatKr(portfolio.reduce((sum: number, item: any) => sum + item.estimatedValue, 0))} kr
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Potentiell vinst</p>
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
                                    Tillagd: {new Date(item.addedDate).toLocaleDateString('sv-SE')}
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
                                Analysera
                              </button>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 inline-block"
                                >
                                  Öppna
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  setPortfolio(portfolio.filter((_: any, i: number) => i !== index))
                                }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                Ta bort
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
                      Stäng
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
