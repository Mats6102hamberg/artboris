'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

const FEATURE_ICONS = [
  <svg key="0" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
  <svg key="1" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>,
  <svg key="2" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>,
  <svg key="3" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>,
  <svg key="4" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
]

const FEATURE_META = [
  { key: 'wallcraftStudio', href: '/wallcraft/studio', color: 'from-emerald-500 to-teal-600', bgLight: 'from-emerald-50 to-teal-50', borderColor: 'border-emerald-200/60' },
  { key: 'artMarket', href: '/market', color: 'from-rose-500 to-pink-600', bgLight: 'from-rose-50 to-pink-50', borderColor: 'border-rose-200/60' },
  { key: 'creativeTools', href: '/wallcraft', color: 'from-violet-500 to-purple-600', bgLight: 'from-violet-50 to-purple-50', borderColor: 'border-violet-200/60' },
  { key: 'printYourOwn', href: '/wallcraft/print-your-own', color: 'from-amber-500 to-orange-600', bgLight: 'from-amber-50 to-orange-50', borderColor: 'border-amber-200/60' },
  { key: 'gallery', href: '/wallcraft/gallery', color: 'from-blue-500 to-indigo-600', bgLight: 'from-blue-50 to-indigo-50', borderColor: 'border-blue-200/60' },
]

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation()
  const [heroVisible, setHeroVisible] = useState(false)
  const [stepsVisible, setStepsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
    setTimeout(() => setStepsVisible(true), 600)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF8]/80 backdrop-blur-xl border-b border-gray-200/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-[0.2em] uppercase text-gray-900">
              Artboris
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="/wallcraft" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Wallcraft</a>
            <a href="/market" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Art Market</a>
            <a href="/scanner" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Scanner</a>
            <LanguageSwitcher />
            <a
              href="#skapa-konto"
              className="text-sm font-medium text-white bg-gray-900 px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              {t('home.nav.createAccount')}
            </a>
          </div>
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Meny"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200/60 px-6 py-4 space-y-3">
            <a href="/wallcraft" className="block text-base font-medium text-gray-700 py-2">Wallcraft</a>
            <a href="/market" className="block text-base font-medium text-gray-700 py-2">Art Market</a>
            <a href="/scanner" className="block text-base font-medium text-gray-700 py-2">Scanner</a>
            <div className="py-2"><LanguageSwitcher /></div>
            <a href="#skapa-konto" className="block text-base font-medium text-white bg-gray-900 text-center py-3 rounded-xl mt-2">
              {t('home.nav.createAccount')}
            </a>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF8] via-[#F5F0EB] to-[#EDE8E3] opacity-60" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-rose-100/20 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className={`lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            {/* Left column — text */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-600 tracking-wide uppercase">{t('home.badge')}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 leading-[1.08]">
                {t('home.hero.title')}
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {t('home.hero.titleHighlight')}
                </span>
              </h1>

              <p className="mt-8 text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#skapa-konto"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/10"
                >
                  {t('home.hero.cta')}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="/wallcraft"
                  className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-base font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  {t('home.hero.ctaSecondary')}
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-16 flex flex-wrap items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.trust.free')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.trust.noCard')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('home.trust.printLocal')}
                </div>
              </div>
            </div>

            {/* Right column — room illustration */}
            <div className="hidden md:block mt-12 lg:mt-0">
              <div className="relative">
                {/* Room scene */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10">
                  {/* Wall */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0EB] via-[#EDE8E3] to-[#E8E2DA]" />

                  {/* Framed artworks */}
                  {/* Large center painting (portrait) */}
                  <div className="absolute top-[12%] left-1/2 -translate-x-1/2 p-1.5 bg-white rounded shadow-xl">
                    <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-sm bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600" />
                  </div>

                  {/* Small left painting (landscape) */}
                  <div className="absolute top-[18%] left-[10%] p-1.5 bg-white rounded shadow-xl">
                    <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-sm bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600" />
                  </div>

                  {/* Small right painting (square) */}
                  <div className="absolute top-[22%] right-[10%] p-1.5 bg-white rounded shadow-xl">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-sm bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600" />
                  </div>

                  {/* Floor */}
                  <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-b from-[#C9A882] to-[#B89B71]">
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_48%,rgba(0,0,0,0.08)_48%,rgba(0,0,0,0.08)_52%,transparent_52%)]" />
                  </div>

                  {/* Furniture silhouette — sideboard */}
                  <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[60%]">
                    <div className="h-10 sm:h-12 bg-[#8B7355]/70 rounded-t-lg" />
                    <div className="flex justify-between px-2">
                      <div className="w-2 h-3 bg-[#8B7355]/70" />
                      <div className="w-2 h-3 bg-[#8B7355]/70" />
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 z-10 inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-100">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-gray-700">AI-genererad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Så fungerar det ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              {t('home.steps.title')}
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              {t('home.steps.subtitle')}
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {(['s1', 's2', 's3', 's4'] as const).map((s, i) => (
              <div key={s} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-gray-200 to-gray-100" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white text-lg font-light mb-6">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t(`home.steps.${s}.title`)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`home.steps.${s}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Funktioner ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
              {t('home.features.title')}
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_META.map((f, i) => (
              <a
                key={f.key}
                href={f.href}
                className={`group relative bg-gradient-to-br ${f.bgLight} border ${f.borderColor} rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} text-white mb-6 shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform`}>
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t(`home.features.${f.key}.title`)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(`home.features.${f.key}.desc`)}</p>
                <div className="mt-6 flex items-center gap-1 text-sm font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
                  {t('home.features.explore')}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Boris AI Showcase ─── */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">{t('home.boris.badge')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-light tracking-tight leading-tight">
                {t('home.boris.title1')} <span className="text-purple-400">{t('home.boris.title2')}</span>
                <br />{t('home.boris.title3')}
              </h2>

              <p className="mt-6 text-gray-400 leading-relaxed max-w-lg">
                {t('home.boris.desc')}
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t('home.boris.artAnalysis')}</p>
                    <p className="text-sm text-gray-400">{t('home.boris.artAnalysisDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t('home.boris.wallComments')}</p>
                    <p className="text-sm text-gray-400">{t('home.boris.wallCommentsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t('home.boris.investmentAdvice')}</p>
                    <p className="text-sm text-gray-400">{t('home.boris.investmentAdviceDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boris chat mockup */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-sm font-bold">
                  B
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Boris AI</p>
                  <p className="text-xs text-gray-500">Konstexpert</p>
                </div>
                <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700/40 rounded-xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {t('home.boris.chatMockup1')}
                  </p>
                </div>
                <div className="bg-purple-600/30 rounded-xl rounded-tr-sm p-4 max-w-[75%] ml-auto">
                  <p className="text-sm text-purple-200">{t('home.boris.chatMockup2')}</p>
                </div>
                <div className="bg-gray-700/40 rounded-xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {t('home.boris.chatMockup3')}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <div className="flex-1 bg-gray-700/30 border border-gray-600/30 rounded-xl px-4 py-3 text-sm text-gray-500">
                  {t('home.boris.chatPlaceholder')}
                </div>
                <button className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Prova på vägg showcase ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Mockup illustration */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden relative">
                {/* Room mockup */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#E8E0D8] to-[#D4CBC2]" />
                {/* Wall */}
                <div className="absolute top-0 left-0 right-0 h-[70%] bg-gradient-to-b from-[#F5F0EB] to-[#EDE8E3]" />
                {/* Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-b from-[#C4B8AC] to-[#B8A99A]" />
                {/* Poster frame */}
                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[35%] aspect-[2/3] bg-white shadow-2xl rounded-sm p-2">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-400 rounded-sm" />
                </div>
                {/* Sofa hint */}
                <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-[60%] h-[15%] bg-[#8B7D6B]/30 rounded-t-[100px]" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('home.wallPreview.perfectFit')}</p>
                  <p className="text-xs text-gray-500">{t('home.wallPreview.perfectFitSize')}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 leading-tight">
                {t('home.wallPreview.title')}
                <br />
                <span className="text-gray-400">{t('home.wallPreview.titleFaded')}</span>
              </h2>

              <p className="mt-6 text-gray-500 leading-relaxed max-w-lg">
                {t('home.wallPreview.desc')}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">{t('home.wallPreview.realtime')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('home.wallPreview.realtimeDesc')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">{t('home.wallPreview.frames')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('home.wallPreview.framesDesc')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">{t('home.wallPreview.cmExact')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('home.wallPreview.cmExactDesc')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">{t('home.wallPreview.borisComment')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('home.wallPreview.borisCommentDesc')}</p>
                </div>
              </div>

              <a
                href="/wallcraft/studio"
                className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                {t('home.wallPreview.tryNow')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Konstnärer CTA ─── */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900">
            {t('home.artistCta.title')}
          </h2>
          <p className="mt-6 text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t('home.artistCta.desc')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/market/artist"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all hover:shadow-lg"
            >
              {t('home.artistCta.register')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/market"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-base font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              {t('home.artistCta.browseGallery')}
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-light text-gray-900">{t('home.artistCta.split')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('home.artistCta.splitLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-light text-gray-900">{t('home.artistCta.cost')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('home.artistCta.costLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-light text-gray-900">{t('home.artistCta.delivery')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('home.artistCta.deliveryLabel')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Skapa konto CTA ─── */}
      <section id="skapa-konto" className="py-20 sm:py-28 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
            {t('home.signup.title')}
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            {t('home.signup.desc')}
          </p>

          <div className="mt-10 max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-left">{t('home.signup.emailLabel')}</label>
                  <input
                    type="email"
                    placeholder={t('home.signup.emailPlaceholder')}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-left">{t('home.signup.passwordLabel')}</label>
                  <input
                    type="password"
                    placeholder={t('home.signup.passwordPlaceholder')}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  {t('home.signup.submit')}
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                {t('home.signup.terms')} <a href="/terms" className="text-gray-400 underline">{t('home.signup.termsLink')}</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#FAFAF8] border-t border-gray-200/60 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <span className="text-lg font-semibold tracking-[0.2em] uppercase text-gray-900">Artboris</span>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {t('home.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('home.footer.tools')}</h4>
              <div className="space-y-2">
                <a href="/wallcraft/studio" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Wallcraft Studio</a>
                <a href="/market" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Art Market</a>
                <a href="/wallcraft/print-your-own" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Print Your Own</a>
                <a href="/scanner" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Art Scanner</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('home.footer.creativeTools')}</h4>
              <div className="space-y-2">
                <a href="/wallcraft/mandala" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Mandala Maker</a>
                <a href="/wallcraft/pattern" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pattern Studio</a>
                <a href="/wallcraft/abstract" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Abstract Painter</a>
                <a href="/wallcraft/colorfield" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Color Field Studio</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('home.footer.forArtists')}</h4>
              <div className="space-y-2">
                <a href="/market/artist" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">{t('home.footer.artistPortal')}</a>
                <a href="/market" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">{t('home.footer.gallery')}</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Artboris. {t('home.footer.allRights')}</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{t('home.footer.privacy')}</a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{t('home.footer.terms')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
