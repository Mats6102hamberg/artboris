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
  { id: '4', title: 'Dark Mood', image: '/assets/demo/dark-moody-1.svg', style: 'Modern', price: 549 },
  { id: '5', title: 'Retro Vibes', image: '/assets/demo/retro-1.svg', style: 'Retro', price: 449 },
  { id: '6', title: 'Art Deco', image: '/assets/demo/art-deco-1.svg', style: 'Art Deco', price: 349 },
]

export default function WallcraftLanding() {
  const { t } = useTranslation()
  const router = useRouter()
  const [heroVisible, setHeroVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          <a href="/market" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            Art Market
          </a>
          <a href="/wallcraft/gallery" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            {t('nav.gallery')}
          </a>
          <div className="relative group hidden sm:block">
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
              Tools
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200/60 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-40">
              <a href="/wallcraft/mandala" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">Mandala Maker</a>
              <a href="/wallcraft/pattern" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">Pattern Studio</a>
              <a href="/wallcraft/abstract" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">Abstract Painter</a>
              <a href="/wallcraft/colorfield" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">Color Field Studio</a>
              <hr className="my-1 border-gray-100" />
              <a href="/wallcraft/print-your-own" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">Print Your Own</a>
            </div>
          </div>
          <a href="/wallcraft/studio" className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all hidden sm:block">
            {t('nav.studio')}
          </a>
          <LanguageSwitcher />
          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1.5 p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200/60 px-6 py-4 space-y-3 animate-in slide-in-from-top-2">
          <a href="/market" className="block text-base font-medium text-gray-700 py-2">Art Market</a>
          <a href="/wallcraft/gallery" className="block text-base font-medium text-gray-700 py-2">{t('nav.gallery')}</a>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Creative Tools</p>
          <a href="/wallcraft/mandala" className="block text-base font-medium text-gray-700 py-2">Mandala Maker</a>
          <a href="/wallcraft/pattern" className="block text-base font-medium text-gray-700 py-2">Pattern Studio</a>
          <a href="/wallcraft/abstract" className="block text-base font-medium text-gray-700 py-2">Abstract Painter</a>
          <a href="/wallcraft/colorfield" className="block text-base font-medium text-gray-700 py-2">Color Field Studio</a>
          <a href="/wallcraft/print-your-own" className="block text-base font-medium text-gray-700 py-2">Print Your Own</a>
          <a href="/wallcraft/studio" className="block text-base font-medium text-white bg-gray-900 text-center py-3 rounded-lg mt-2">{t('nav.studio')}</a>
        </div>
      )}

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

      {/* ─── Creative Tools ─── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 text-center">Creative Tools</h2>
          <p className="mt-3 text-gray-500 text-center">Design your own art with our interactive tools</p>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {/* Mandala Maker */}
            <div onClick={() => router.push('/wallcraft/mandala')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2 w-px bg-gray-400" style={{ height: '45%', transformOrigin: '0 0', transform: `rotate(${i * 30}deg)` }} />
                  ))}
                </div>
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500">🔮</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">Mandala Maker</h3>
                <p className="text-sm text-gray-500 mt-1">Draw symmetric mandala patterns with radial symmetry. Choose colors, brush sizes, and export as wall art.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 group-hover:gap-2 transition-all">Start creating <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </div>
            </div>

            {/* Pattern Studio */}
            <div onClick={() => router.push('/wallcraft/pattern')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 via-emerald-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px', color: '#666' }} />
                </div>
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500">�</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">Pattern Studio</h3>
                <p className="text-sm text-gray-500 mt-1">Create seamless repeating patterns. Draw a tile and watch it repeat in grid, brick, mirror, or diagonal modes.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 group-hover:gap-2 transition-all">Start creating <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </div>
            </div>

            {/* Abstract Painter */}
            <div onClick={() => router.push('/wallcraft/abstract')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 via-rose-50 to-violet-50 flex items-center justify-center">
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500">🌊</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">Abstract Painter</h3>
                <p className="text-sm text-gray-500 mt-1">Generate unique abstract art with flow fields and particles. Control style, speed, color palette, and complexity.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 group-hover:gap-2 transition-all">Start creating <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </div>
            </div>

            {/* Color Field Studio */}
            <div onClick={() => router.push('/wallcraft/colorfield')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[16/9] bg-gradient-to-br from-red-100 via-amber-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-red-800/20" />
                  <div className="flex-1 bg-orange-600/20" />
                  <div className="flex-1 bg-amber-400/20" />
                  <div className="flex-1 bg-yellow-200/20" />
                </div>
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500 relative z-10">🎨</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">Color Field Studio</h3>
                <p className="text-sm text-gray-500 mt-1">Compose minimalist color field art inspired by Rothko and Albers. Choose palettes, layouts, textures, and edges.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 group-hover:gap-2 transition-all">Start creating <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </div>
            </div>

            {/* Design Studio */}
            <div onClick={() => router.push('/wallcraft/studio')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-200/60 hover:shadow-xl transition-all duration-300 sm:col-span-2">
              <div className="aspect-[32/9] bg-gradient-to-br from-blue-100 via-cyan-50 to-emerald-50 flex items-center justify-center">
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500">✨</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">Design Studio</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a photo of your room, pick a style, and generate unique art that fits your space perfectly.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 group-hover:gap-2 transition-all">{t('landing.hero.cta')} <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </div>
            </div>
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
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap"
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
