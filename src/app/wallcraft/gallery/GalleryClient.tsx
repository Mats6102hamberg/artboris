'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import ProtectedImage from '@/components/ui/ProtectedImage'

type Section = 'ai' | 'photographers' | 'artists'

interface GalleryItem {
  id: string
  designId?: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  style?: string
  likesCount: number
  isAiGenerated?: boolean
  type: 'ai-variant' | 'design' | 'market'
  artistName?: string
  priceSEK?: number
}

const AI_STYLE_FILTERS = ['all', 'nordic', 'abstract', 'minimal', 'botanical', 'retro']

export default function GalleryPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [section, setSection] = useState<Section>('ai')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStyle, setActiveStyle] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('popular')
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchAiItems = useCallback(async (offset = 0) => {
    const params = new URLSearchParams({ sortBy, offset: String(offset), limit: '60' })
    if (activeStyle !== 'all') {
      params.set('style', activeStyle)
    }
    const res = await fetch(`/api/gallery/list?${params}`)
    const data = await res.json()
    if (data.success) {
      const mapped = (data.items || []).map((item: any) => ({
        id: item.id,
        designId: item.designId || item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl || item.imageUrl,
        style: item.style,
        likesCount: item.likesCount || 0,
        isAiGenerated: true,
        type: item.type || 'ai-variant',
      }))
      return { items: mapped, hasMore: data.hasMore || false }
    }
    return { items: [], hasMore: false }
  }, [activeStyle, sortBy])

  const fetchMarketItems = useCallback(async (category: string, excludeCategory?: string) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (excludeCategory) params.set('excludeCategory', excludeCategory)
    const res = await fetch(`/api/market/listings?${params}`)
    const data = await res.json()
    return (data.listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      imageUrl: listing.imageUrl,
      thumbnailUrl: listing.thumbnailUrl || listing.imageUrl,
      likesCount: 0,
      type: 'market' as const,
      artistName: listing.artist?.displayName || '',
      priceSEK: listing.artistPriceSEK,
    }))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        if (section === 'ai') {
          const { items: result, hasMore: more } = await fetchAiItems(0)
          if (!cancelled) { setItems(result); setHasMore(more) }
        } else if (section === 'photographers') {
          const result = await fetchMarketItems('photo')
          if (!cancelled) { setItems(result); setHasMore(false) }
        } else {
          const result = await fetchMarketItems('', 'photo')
          if (!cancelled) { setItems(result); setHasMore(false) }
        }
      } catch (err) {
        console.error('[Gallery] fetch error:', err)
        if (!cancelled) { setItems([]); setHasMore(false) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [section, activeStyle, sortBy, fetchAiItems, fetchMarketItems])

  const handleAdminDelete = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Radera "${item.title}" permanent?`)) return
    setDeletingId(item.id)
    try {
      const endpoint = item.type === 'market'
        ? '/api/admin/reviews'
        : `/api/designs/${item.designId || item.id}`
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        ...(item.type === 'market' && { body: JSON.stringify({ listingId: item.id }) }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(prev => prev.filter(i => i.id !== item.id))
      } else {
        alert(data.error || 'Kunde inte radera')
      }
    } catch {
      alert('Kunde inte radera')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { items: more, hasMore: stillMore } = await fetchAiItems(items.length)
      setItems(prev => [...prev, ...more])
      setHasMore(stillMore)
    } catch {
      console.error('[Gallery] load more failed')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleCardClick = (item: GalleryItem) => {
    if (item.type === 'market') {
      router.push(`/market/${item.id}`)
    } else {
      router.push(`/wallcraft/design/${item.designId || item.id}`)
    }
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'ai', label: t('gallery.sectionAi') },
    { key: 'photographers', label: t('gallery.sectionPhotographers') },
    { key: 'artists', label: t('gallery.sectionArtists') },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => router.push('/wallcraft/studio')}>
            {t('nav.studio')}
          </Button>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900">{t('gallery.title')}</h1>
          <p className="mt-3 text-gray-500">{t('gallery.subtitle')}</p>
        </div>

        {/* Section tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => { setSection(s.key); setActiveStyle('all') }}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all ${
                section === s.key
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sub-filters (AI section only) */}
        {section === 'ai' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {AI_STYLE_FILTERS.map(style => (
                <button
                  key={style}
                  onClick={() => setActiveStyle(style)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeStyle === style
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {style === 'all' ? 'All' : style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(['popular', 'recent'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                    sortBy === s ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {s === 'popular' ? '♥ Popular' : '↓ Recent'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('gallery.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map(item => (
              <div key={item.id} className="group cursor-pointer" onClick={() => handleCardClick(item)}>
                <ProtectedImage
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  wrapperClassName="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden"
                >
                  {item.type === 'ai-variant' && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase">
                        AI
                      </span>
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => handleAdminDelete(item, e)}
                      disabled={deletingId === item.id}
                      className="absolute top-2 right-2 z-20 w-7 h-7 bg-red-600/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                      title="Radera permanent (admin)"
                    >
                      {deletingId === item.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {item.type !== 'market' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/wallcraft/create?from=${encodeURIComponent(item.thumbnailUrl || item.imageUrl)}&style=${item.style || 'abstract'}`)
                        }}
                        className="w-full text-white text-xs font-semibold bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:from-purple-600 hover:to-fuchsia-600 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Skapa ny konst från detta
                      </button>
                    )}
                    <div className="flex items-end justify-between">
                      <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                        {item.type === 'market' ? t('gallery.viewArtwork') : t('gallery.viewDesign')}
                      </span>
                      {item.type !== 'market' && (
                        <span className="text-white text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                          ♥ {item.likesCount}
                        </span>
                      )}
                      {item.type === 'market' && item.priceSEK != null && (
                        <span className="text-white text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                          {item.priceSEK} SEK
                        </span>
                      )}
                    </div>
                  </div>
                </ProtectedImage>
                <div className="mt-2.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  {item.type === 'market' && item.artistName ? (
                    <p className="text-xs text-gray-400">{item.artistName}</p>
                  ) : item.style ? (
                    <p className="text-xs text-gray-400 capitalize">{item.style}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  Laddar...
                </span>
              ) : (
                'Visa fler'
              )}
            </button>
          </div>
        )}
      </div>

      {/* AI Art notice */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          {t('legal.galleryNotice') !== 'legal.galleryNotice'
            ? t('legal.galleryNotice')
            : <>AI-generated works created in the studio may be displayed in the ArtBoris Gallery. <a href="/terms" className="underline underline-offset-2 hover:text-gray-500">Terms</a></>}
        </p>
      </div>

      {/* Sell your art CTA */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              Want to sell your art?
            </h2>
            <p className="text-gray-500 mt-1 max-w-md">
              Register as an artist on Artboris Art Market.
              Let buyers preview your work on their wall before purchasing.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push('/market/artist')}
            className="flex-shrink-0"
          >
            Become an Artist
          </Button>
        </div>
      </div>

      <footer className="border-t border-gray-200/60 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} Wallcraft by Artboris</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  )
}
