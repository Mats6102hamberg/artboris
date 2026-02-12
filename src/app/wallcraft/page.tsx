'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

const FEATURED_DESIGNS = [
  { id: '1', title: 'Nordic Calm', image: '/assets/demo/botanical-1.svg', style: 'Scandinavian', price: 349 },
  { id: '2', title: 'Abstract Flow', image: '/assets/demo/abstract-1.svg', style: 'Abstract', price: 449 },
  { id: '3', title: 'Minimal Lines', image: '/assets/demo/minimal-1.svg', style: 'Minimal', price: 349 },
  { id: '4', title: 'Ocean Drift', image: '/assets/demo/ocean-1.svg', style: 'Modern', price: 549 },
  { id: '5', title: 'Forest Light', image: '/assets/demo/forest-1.svg', style: 'Photography', price: 449 },
  { id: '6', title: 'Stone Texture', image: '/assets/demo/texture-1.svg', style: 'Abstract', price: 349 },
]

export default function WallcraftLanding() {
  const { t } = useTranslation()
  const router = useRouter()
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900">
      {/* ─── Nav ─── */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-widest uppercase text-gray-900">
            {t('brand.name')}
          </span>
          <span className="text-[10px] tracking-wider text-gray-400 uppercase hidden sm:block">
            by Artboris
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/wallcraft/gallery" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            {t('nav.gallery')}
          </a>
          <a href="/wallcraft/studio" className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all hidden sm:block">
            {t('nav.studio')}
          </a>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-32">
          <div className={`max-w-3xl transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 leading-[1.1]">
              {t('landing.hero.title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/wallcraft/studio')}
              >
                {t('landing.hero.cta')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/wallcraft/gallery')}
              >
                {t('landing.hero.ctaSecondary')}
              </Button>
            </div>
          </div>
        </div>

        {/* Hero room mockup */}
        <div className={`max-w-7xl mx-auto px-6 pb-16 transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 aspect-[16/9] bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80"
              alt="Scandinavian living room"
              className="w-full h-full object-cover"
            />
            {/* Poster overlay */}
            <div className="absolute top-[12%] left-[32%] w-[18%]" style={{ perspective: '800px' }}>
              <div
                className="absolute inset-0 rounded-sm"
                style={{
                  transform: 'translateX(6px) translateY(8px)',
                  background: 'rgba(0,0,0,0.18)',
                  filter: 'blur(12px)',
                }}
              />
              <div
                className="relative bg-white p-[3px] rounded-[2px]"
                style={{
                  transform: 'rotateY(-1.5deg) rotateX(0.5deg)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div className="aspect-[2/3] bg-gray-100 rounded-[1px] overflow-hidden relative">
                  <img src="/assets/demo/botanical-1.svg" alt="Artwork" className="w-full h-full object-cover" />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.04) 100%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip ─── */}
      <section className="border-y border-gray-200/60 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              t('landing.trust.printedLocal'),
              t('landing.trust.fineArt'),
              t('landing.trust.delivery'),
              t('landing.trust.guarantee'),
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-sm font-medium text-gray-500">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 text-center">
            {t('landing.steps.title')}
          </h2>
          <div className="mt-16 grid sm:grid-cols-3 gap-12">
            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-lg font-semibold mx-auto">
                  {i + 1}
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  {t(`landing.steps.${step}.title`)}
                </h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {t(`landing.steps.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured designs ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 text-center">
            {t('landing.featured.title')}
          </h2>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {FEATURED_DESIGNS.map((design) => (
              <div key={design.id} className="group">
                <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden relative">
                  <img
                    src={design.image}
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-5 py-2 rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap"
                    onClick={() => router.push('/wallcraft/studio')}
                  >
                    {t('landing.featured.viewOnWall')} →
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900">{design.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{design.style}</span>
                    <span className="text-sm font-semibold text-gray-900">{design.price} kr</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA bottom ─── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900">
            {t('landing.hero.title')}
          </h2>
          <p className="mt-4 text-gray-500">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => router.push('/wallcraft/studio')}>
              {t('landing.hero.cta')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-200/60 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} Wallcraft by Artboris</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  )
}
