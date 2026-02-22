'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MARKET_CATEGORIES } from '@/lib/pricing/market'
import ProtectedImage from '@/components/ui/ProtectedImage'

interface Listing {
  id: string
  title: string
  description: string
  technique: string
  category: string
  year: number | null
  thumbnailUrl: string
  artistPriceSEK: number
  isOriginal: boolean
  views: number
  tryOnWallCount: number
  artist: {
    id: string
    displayName: string
    avatarUrl: string
  }
}

export default function MarketPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' })
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/market/listings?${params}`)
      const data = await res.json()
      setListings(data.listings || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const formatPrice = (n: number) => n.toLocaleString('sv-SE')

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
            Artboris
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/market/artist"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              För konstnärer
            </a>
            <a
              href="/wallcraft"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Wallcraft
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight">
            Art Market
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Upptäck unik konst från lokala konstnärer och fotografer.
            Prova verket på din egen vägg innan du köper.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCategory('all'); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Alla
          </button>
          {MARKET_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setPage(1) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">{total} konstverk</p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Inga konstverk hittades.</p>
            <p className="text-gray-400 text-sm mt-2">Bli den första att ladda upp!</p>
            <a
              href="/market/artist"
              className="inline-block mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Registrera dig som konstnär
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/market/${listing.id}`)}
              >
                <ProtectedImage
                  src={listing.thumbnailUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  wrapperClassName="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100"
                >
                  {listing.isOriginal && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                      Original
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="w-full bg-white text-gray-900 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      Prova på min vägg →
                    </button>
                  </div>
                </ProtectedImage>
                <div className="mt-3 px-1">
                  <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
                  <p className="text-sm text-gray-500">{listing.artist.displayName}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(listing.artistPriceSEK)} kr
                    </p>
                    {listing.technique && (
                      <p className="text-xs text-gray-400">{listing.technique}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
