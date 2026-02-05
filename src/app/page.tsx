'use client'

import { useState } from 'react'

export default function Home() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState<'paintings' | 'sculptures'>('paintings')
  const [results, setResults] = useState<any[]>([])

  const startScan = async () => {
    setIsScanning(true)
    setResults([])
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: scanType })
      })
      
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Art Scanner</h1>
          <p className="text-gray-600 mt-2">Hitta undervärderade konstverk med vinstpotential</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kontrollpanel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sök-inställningar</h2>
          
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hittade objekt ({results.length})
            </h2>
            
            <div className="space-y-4">
              {results.map((item, index) => (
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
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
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
      </main>
    </div>
  )
}
