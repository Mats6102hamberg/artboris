'use client'

import { useState } from 'react'
import BorisArtChat from '@/components/BorisArtChat'
import MyArtworks from '@/components/MyArtworks'

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState<'paintings' | 'sculptures'>('paintings')
  const [results, setResults] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showBorisChat, setShowBorisChat] = useState(false)
  const [activeTab, setActiveTab] = useState<'scanner' | 'my-artworks'>('scanner')
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    minProfitMargin: 20,
    maxProfitMargin: 200,
    riskLevel: 'all' as 'all' | 'low' | 'medium' | 'high',
    recommendation: 'all' as 'all' | 'buy' | 'hold' | 'avoid'
  })

  const startScan = async () => {
    setIsScanning(true)
    setResults([])
    setSelectedItem(null)
    setShowAnalysis(false)
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: scanType })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Scanning failed')
      }
      
      setResults(data.results || [])
      
      // Visa info om scraping-metod
      if (data.scrapingMethod) {
        console.log(`Scraping method: ${data.scrapingMethod}`)
        console.log(`Data quality: ${data.dataQuality || 'unknown'}`)
      }
      
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
    // IRL: Integration med betalningsystem
    alert(`🚀 Investering i "${item.title}" för ${item.price} kr har initierad!`)
    setShowAnalysis(false)
  }

  const saveToPortfolio = (item: any) => {
    if (!portfolio.find(p => p.title === item.title)) {
      setPortfolio([...portfolio, { ...item, addedDate: new Date().toISOString() }])
      alert(`✅ "${item.title}" har sparats till din portfölj!`)
    } else {
      alert(`⚠️ "${item.title}" finns redan i din portfölj!`)
    }
    setShowAnalysis(false)
  }

  const filterResults = (items: any[]) => {
    return items.filter(item => {
      // Pris-filter
      if (item.price < filters.minPrice || item.price > filters.maxPrice) return false
      
      // Vinstmarginal-filter
      if (item.profitMargin < filters.minProfitMargin || item.profitMargin > filters.maxProfitMargin) return false
      
      // Risk-filter
      if (filters.riskLevel !== 'all' && item.riskLevel !== filters.riskLevel) return false
      
      // Rekommendation-filter
      if (filters.recommendation !== 'all' && item.recommendation !== filters.recommendation) return false
      
      return true
    })
  }

  const filteredResults = filterResults(results)

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
              <button
                onClick={() => setShowBorisChat(!showBorisChat)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                🤖 BorisArt AI
              </button>
              <button
                onClick={() => setShowPortfolio(!showPortfolio)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                📊 Portfölj ({portfolio.length})
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'scanner'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Art Scanner
            </button>
            <button
              onClick={() => setActiveTab('my-artworks')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'my-artworks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎨 Mina Tavlor
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kontrollpanel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Sök-inställningar</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showFilters ? 'Dölj filter' : 'Visa filter'} ⚙️
            </button>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">🔍 Avancerade Filter</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 100000})}
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
                      onChange={(e) => setFilters({...filters, maxProfitMargin: parseInt(e.target.value) || 200})}
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

                {/* Snabb-filter knappar */}
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters({
                        minPrice: 0,
                        maxPrice: 30000,
                        minProfitMargin: 50,
                        maxProfitMargin: 200,
                        riskLevel: 'all',
                        recommendation: 'all'
                      })}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                    >
                      💰 Låg pris, hög vinst
                    </button>
                    <button
                      onClick={() => setFilters({
                        minPrice: 0,
                        maxPrice: 50000,
                        minProfitMargin: 30,
                        maxProfitMargin: 100,
                        riskLevel: 'low',
                        recommendation: 'buy'
                      })}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                    >
                      🛡️ Säkert val
                    </button>
                    <button
                      onClick={() => setFilters({
                        minPrice: 0,
                        maxPrice: 100000,
                        minProfitMargin: 0,
                        maxProfitMargin: 200,
                        riskLevel: 'all',
                        recommendation: 'all'
                      })}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
                    >
                      🔄 Återställ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setScanType('paintings')}
              className={`px-4 py-2 rounded-md transition-colors ${
                scanType === 'paintings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🖼️ Oljemålningar
            </button>
            <button
              onClick={() => setScanType('sculptures')}
              className={`px-4 py-2 rounded-md transition-colors ${
                scanType === 'sculptures'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🗿 Skulpturer & Annan Konst
            </button>
          </div>

          <button
            onClick={startScan}
            disabled={isScanning}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Söker igenom konstmarknader...
              </span>
            ) : (
              '🚀 Starta Skanning'
            )}
          </button>
        </div>

        {/* Resultat */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Hittade objekt ({filteredResults.length} av {results.length})
              </h2>
              {filteredResults.length !== results.length && (
                <span className="text-sm text-gray-500">
                  {results.length - filteredResults.length} objekt filtrerade
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              {filteredResults.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">{item.artist}</p>
                      <p className="text-sm text-gray-500">{item.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{item.price} kr</p>
                      <p className="text-sm text-gray-500">Estimerat värde: {item.estimatedValue} kr</p>
                      <p className="text-sm font-medium text-blue-600">
                        Vinstpotential: {item.profitMargin}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button 
                      onClick={() => analyzeItem(item)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      📊 Analysera
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      💰 Investera
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analys Modal */}
        {showAnalysis && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">📊 Detaljerad Analys</h2>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bild och grundinfo */}
                  <div>
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                    <p className="text-gray-600">{selectedItem.artist}</p>
                    <p className="text-sm text-gray-500">{selectedItem.description}</p>
                    <p className="text-sm text-gray-500 mt-2">Källa: {selectedItem.source}</p>
                  </div>

                  {/* Pris-analys */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">💰 Pris-analys</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nuvarande pris:</span>
                          <span className="font-bold text-green-600">{selectedItem.price} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimerat värde:</span>
                          <span className="font-bold text-blue-600">{selectedItem.estimatedValue} kr</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potentiell vinst:</span>
                          <span className="font-bold text-purple-600">
                            {selectedItem.estimatedValue - selectedItem.price} kr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vinstmarginal:</span>
                          <span className="font-bold text-orange-600">{selectedItem.profitMargin}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">📈 Marknadsdata</h4>
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
                          <span className="font-bold">{selectedItem.confidence * 100}%</span>
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

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">🎯 Rekommendation</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded font-bold ${
                          selectedItem.recommendation === 'buy' ? 'bg-green-600 text-white' :
                          selectedItem.recommendation === 'hold' ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {selectedItem.recommendation === 'buy' ? 'KÖP' :
                           selectedItem.recommendation === 'hold' ? 'HÅLL' : 'UNDVIK'}
                        </span>
                        <span className="text-gray-700">
                          {selectedItem.recommendation === 'buy' ? 'Stark vinstpotential med låg risk' :
                           selectedItem.recommendation === 'hold' ? 'Måttlig potential, vänta på bättre läge' :
                           'Hög risk, rekommenderas inte'}
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
                    💰 Investera nu
                  </button>
                  <button 
                    onClick={() => saveToPortfolio(selectedItem)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    📊 Spara till portfölj
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
                  <h2 className="text-2xl font-bold text-gray-900">📊 Min Portfölj</h2>
                  <button
                    onClick={() => setShowPortfolio(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {portfolio.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Du har inga objekt i din portfölj än.</p>
                    <p className="text-sm text-gray-400 mt-2">Klicka "Spara till portfölj" på skannade objekt.</p>
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
                          <p className="text-2xl font-bold text-green-600">
                            {portfolio.reduce((sum, item) => sum + item.price, 0).toLocaleString()} kr
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Estimerat värde</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {portfolio.reduce((sum, item) => sum + item.estimatedValue, 0).toLocaleString()} kr
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Potentiell vinst</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {portfolio.reduce((sum, item) => sum + (item.estimatedValue - item.price), 0).toLocaleString()} kr
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Items */}
                    <div className="space-y-3">
                      {portfolio.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <p className="text-gray-600">{item.artist}</p>
                              <p className="text-sm text-gray-500">{item.source}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Tillagd: {new Date(item.addedDate).toLocaleDateString('sv-SE')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{item.price} kr</p>
                              <p className="text-sm text-gray-500">→ {item.estimatedValue} kr</p>
                              <p className="text-sm font-medium text-blue-600">
                                +{item.profitMargin}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button 
                              onClick={() => analyzeItem(item)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              📊 Analysera
                            </button>
                            <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                              💰 Investera
                            </button>
                            <button 
                              onClick={() => {
                                setPortfolio(portfolio.filter((_, i) => i !== index))
                                alert(`🗑️ "${item.title}" har tagits bort från portföljen!`)
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              🗑️ Ta bort
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

      {/* Tab Content */}
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
                <h2 className="text-xl font-bold text-gray-900">🤖 BorisArt AI</h2>
                <button
                  onClick={() => setShowBorisChat(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
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
