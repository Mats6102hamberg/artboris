'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

interface GalleryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  style: string
  likesCount: number
}

const STYLE_FILTERS = ['all', 'nordic', 'abstract', 'minimal', 'botanical', 'retro']

export default function GalleryPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStyle, setActiveStyle] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('popular')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ sortBy })
    if (activeStyle !== 'all') params.set('style', activeStyle)
    fetch(`/api/gallery/list?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.items || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeStyle, sortBy])

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

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {STYLE_FILTERS.map(style => (
              <button
                key={style}
                onClick={() => setActiveStyle(style)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
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

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No designs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map(item => (
              <div key={item.id} className="group cursor-pointer" onClick={() => router.push('/wallcraft/studio')}>
                <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                      {t('gallery.viewDesign')}
                    </span>
                    <span className="text-white text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                      ♥ {item.likesCount}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.style}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
