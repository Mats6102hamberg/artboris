'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CreditBadge from '@/components/poster/CreditBadge'
import { StylePreset } from '@/types/design'
import { getAllStyles } from '@/lib/prompts/styles'

interface GalleryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  mockupUrl: string
  style: string
  likes: number
  createdAt: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStyle, setFilterStyle] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [credits] = useState(30)

  const styles = getAllStyles()

  useEffect(() => {
    fetchGallery()
  }, [filterStyle, sortBy])

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sortBy })
      if (filterStyle) params.set('style', filterStyle)

      const res = await fetch(`/api/gallery/list?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items || [])
      }
    } catch (err) {
      console.error('Gallery fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (itemId: string) => {
    try {
      const res = await fetch('/api/gallery/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryItemId: itemId }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, likes: data.likes } : item
          )
        )
      }
    } catch (err) {
      console.error('Like error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/poster-lab" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Poster Lab</a>
            <h1 className="text-xl font-bold text-gray-900">Inspirationsgalleri</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/poster-lab')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700"
            >
              Skapa egen
            </button>
            <CreditBadge balance={credits} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => setFilterStyle('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !filterStyle ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Alla
          </button>
          {styles.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterStyle(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStyle === s.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}

          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="recent">Senaste</option>
              <option value="popular">Populärast</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Galleriet är tomt</h3>
            <p className="text-gray-500 mb-6">Bli den första att dela en design!</p>
            <button
              onClick={() => router.push('/poster-lab')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              Skapa din första poster
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={item.mockupUrl || item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.style}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(item.id) }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {item.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
