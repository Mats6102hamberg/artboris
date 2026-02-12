'use client'

import { useState, useEffect, useCallback } from 'react'
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
  roomType?: string
  colorMood?: string
  likesCount: number
  createdAt: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStyle, setFilterStyle] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [credits] = useState(30)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

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

  const handleLike = useCallback(async (itemId: string) => {
    // Optimistic update
    const wasLiked = likedIds.has(itemId)
    const delta = wasLiked ? -1 : 1

    setLikedIds(prev => {
      const next = new Set(prev)
      if (wasLiked) next.delete(itemId)
      else next.add(itemId)
      return next
    })
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, likesCount: Math.max(0, item.likesCount + delta) }
          : item
      )
    )

    try {
      const res = await fetch('/api/gallery/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId: itemId }),
      })
      const data = await res.json()
      if (data.success) {
        // Synka med serverns faktiska värde
        setItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, likesCount: data.likesCount }
              : item
          )
        )
        setLikedIds(prev => {
          const next = new Set(prev)
          if (data.liked) next.add(itemId)
          else next.delete(itemId)
          return next
        })
      }
    } catch (err) {
      // Rollback optimistic update
      setLikedIds(prev => {
        const next = new Set(prev)
        if (wasLiked) next.add(itemId)
        else next.delete(itemId)
        return next
      })
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, likesCount: Math.max(0, item.likesCount - delta) }
            : item
        )
      )
      console.error('Like error:', err)
    }
  }, [likedIds])

  const handleCreateSimilar = useCallback((item: GalleryItem) => {
    const params = new URLSearchParams()
    if (item.style) params.set('style', item.style)
    if (item.roomType) params.set('roomType', item.roomType)
    if (item.colorMood) params.set('colorMood', item.colorMood)
    params.set('from', 'gallery')
    router.push(`/poster-lab?${params.toString()}`)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/poster-lab" className="text-gray-400 hover:text-gray-600 text-sm">&larr;</a>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Galleri</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/poster-lab')}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-purple-700 hover:to-blue-700"
            >
              Skapa egen
            </button>
            <CreditBadge balance={credits} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={() => setFilterStyle('')}
                className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  !filterStyle ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Alla
              </button>
              {styles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setFilterStyle(s.id)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    filterStyle === s.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
            className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white"
          >
            <option value="recent">Senaste</option>
            <option value="popular">Populärast</option>
          </select>
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map(item => {
              const isLiked = likedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="aspect-[2/3] overflow-hidden relative">
                    <img
                      src={item.mockupUrl || item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover overlay med "Skapa liknande" */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleCreateSimilar(item)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg text-xs sm:text-sm font-medium hover:bg-white transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
                      >
                        Skapa liknande ✨
                      </button>
                    </div>
                  </div>
                  <div className="p-2 sm:p-3">
                    <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate mt-0.5 hidden sm:block">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                      <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">{item.style}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(item.id) }}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <svg
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isLiked ? 'scale-110' : ''}`}
                          fill={isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {item.likesCount}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
