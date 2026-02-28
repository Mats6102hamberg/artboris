'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'

interface Artwork {
  id: string
  title: string
  artist: string
  description: string
  price: number
  imageUrl: string
  category: string
  year: number
  status: string
  bids: any[]
  views: number
  createdAt?: string
}

export default function MyArtworks() {
  const { t } = useTranslation()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    artist: 'Mats Hamberg',
    description: '',
    price: '',
    category: 'målning',
    year: new Date().getFullYear().toString(),
    imageUrl: ''
  })

  useEffect(() => {
    fetchArtworks()
  }, [])

  const fetchArtworks = async () => {
    try {
      const response = await fetch('/api/my-artworks')
      const data = await response.json()
      if (data.success) {
        setArtworks(data.artworks)
      }
    } catch (error) {
      console.error('Error fetching artworks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/my-artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          year: parseInt(formData.year)
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setArtworks([...artworks, data.artwork])
        setShowAddForm(false)
        setFormData({
          title: '',
          artist: 'Mats Hamberg',
          description: '',
          price: '',
          category: 'målning',
          year: new Date().getFullYear().toString(),
          imageUrl: ''
        })
      }
    } catch (error) {
      console.error('Error creating artwork:', error)
    }
  }

  const handleAIAnalysis = async (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    setLoadingAnalysis(true)
    setAiAnalysis(null)
    
    try {
      const response = await fetch('/api/boris-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-my-artwork',
          data: { artwork }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setAiAnalysis(result.response.message)
      }
    } catch (error) {
      console.error('Error getting AI analysis:', error)
      setAiAnalysis(t('myArtworks.analysisError'))
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('myArtworks.confirmDelete'))) return
    
    try {
      const response = await fetch('/api/my-artworks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      
      const data = await response.json()
      if (data.success) {
        setArtworks(artworks.filter(art => art.id !== id))
      }
    } catch (error) {
      console.error('Error deleting artwork:', error)
    }
  }

  const totalValue = artworks.reduce((sum, art) => sum + art.price, 0)
  const averagePrice = artworks.length > 0 ? totalValue / artworks.length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('myArtworks.title')}</h2>
          <p className="text-gray-600 mt-1">{t('myArtworks.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('myArtworks.addArtwork')}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">{t('myArtworks.totalCount')}</h3>
          <p className="text-2xl font-bold text-gray-900">{artworks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">{t('myArtworks.totalValue')}</h3>
          <p className="text-2xl font-bold text-green-600">{totalValue.toLocaleString()} kr</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">{t('myArtworks.averagePrice')}</h3>
          <p className="text-2xl font-bold text-blue-600">{averagePrice.toLocaleString()} kr</p>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('myArtworks.addNewTitle')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.titleLabel')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.artistLabel')}</label>
                <input
                  type="text"
                  required
                  value={formData.artist}
                  onChange={(e) => setFormData({...formData, artist: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.priceLabel')}</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.yearLabel')}</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.categoryLabel')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="målning">{t('myArtworks.painting')}</option>
                  <option value="skulptur">{t('myArtworks.sculpture')}</option>
                  <option value="foto">{t('myArtworks.photography')}</option>
                  <option value="digital">{t('myArtworks.digitalArt')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.imageUrl')}</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('myArtworks.descriptionLabel')}</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
{t('myArtworks.saveArtwork')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
{t('myArtworks.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <div key={artwork.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="aspect-w-4 aspect-h-3 bg-gray-200">
              {artwork.imageUrl ? (
                <img 
                  src={artwork.imageUrl} 
                  alt={artwork.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">{t('myArtworks.noImage')}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900">{artwork.title}</h3>
              <p className="text-gray-600">{artwork.artist}</p>
              <p className="text-sm text-gray-500 mt-1">{artwork.category} • {artwork.year}</p>
              <p className="text-gray-700 mt-2 text-sm line-clamp-2">{artwork.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">{artwork.price.toLocaleString()} kr</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  artwork.status === 'tillgänglig' || artwork.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {artwork.status === 'available' ? t('myArtworks.available') : artwork.status}
                </span>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleAIAnalysis(artwork)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                >
{t('myArtworks.aiAnalysis')}
                </button>
                <button
                  onClick={() => handleDelete(artwork.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {artworks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myArtworks.noArtworksYet')}</h3>
          <p className="text-gray-600 mb-4">{t('myArtworks.noArtworksDesc')}</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('myArtworks.addArtwork')}
          </button>
        </div>
      )}

      {/* AI Analysis Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('myArtworks.aiAnalysis')}</h2>
                <button
                  onClick={() => setSelectedArtwork(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedArtwork.title}</h3>
                  <p className="text-gray-600">{selectedArtwork.artist} • {selectedArtwork.year}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  {loadingAnalysis ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-gray-700 italic">{t('myArtworks.borisAnalyzing')}</p>
                    </div>
                  ) : aiAnalysis ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{aiAnalysis}</p>
                  ) : (
                    <p className="text-gray-700 italic">
                      {t('myArtworks.borisAnalysisPlaceholder')}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900">{t('myArtworks.priceEstimate')}</h4>
                    <p className="text-blue-700">{selectedArtwork.price.toLocaleString()} kr</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900">{t('myArtworks.marketValue')}</h4>
                    <p className="text-green-700">{t('myArtworks.calculatingByAI')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
