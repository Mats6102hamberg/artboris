'use client'

import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function GalleryPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <div className="flex items-center gap-4">
          <a href="/wallcraft/studio" className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all">
            {t('nav.studio')}
          </a>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-light text-gray-900">{t('gallery.title')}</h1>
        <p className="mt-4 text-gray-500">{t('gallery.subtitle')}</p>
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-400">Gallery coming soon</p>
      </div>
    </div>
  )
}
