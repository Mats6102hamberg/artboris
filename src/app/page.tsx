'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    title: 'Wallcraft Studio',
    description: 'Skapa AI-genererad väggkonst. Ladda upp ditt rum, välj stil och se tavlan på din vägg i realtid.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    href: '/wallcraft/studio',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200/60',
  },
  {
    title: 'Art Market',
    description: 'Upptäck unik konst från lokala konstnärer och fotografer. Prova verket på din vägg innan du köper.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    href: '/market',
    color: 'from-rose-500 to-pink-600',
    bgLight: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200/60',
  },
  {
    title: 'Kreativa verktyg',
    description: 'Mandala Maker, Pattern Studio, Abstract Painter och Color Field Studio — skapa din egen konst.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
      </svg>
    ),
    href: '/wallcraft',
    color: 'from-violet-500 to-purple-600',
    bgLight: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-200/60',
  },
  {
    title: 'Print Your Own',
    description: 'Ladda upp ditt eget foto och se hur det tar sig på din vägg. Beställ som poster med ram.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    href: '/wallcraft/print-your-own',
    color: 'from-amber-500 to-orange-600',
    bgLight: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200/60',
  },
  {
    title: 'Art Scanner',
    description: 'Hitta undervärderade konstverk på auktioner. AI-driven analys med vinstpotential och risknivå.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    href: '/scanner',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200/60',
  },
  {
    title: 'Boris AI — Konstexpert',
    description: 'Din personliga konstexpert. Analyserar verk, kommenterar placeringar och ger investeringsråd.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    href: '/scanner',
    color: 'from-fuchsia-500 to-purple-600',
    bgLight: 'from-fuchsia-50 to-purple-50',
    borderColor: 'border-fuchsia-200/60',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Skapa konto',
    description: 'Registrera dig gratis och få tillgång till alla verktyg.',
  },
  {
    step: '02',
    title: 'Utforska & skapa',
    description: 'Generera AI-konst, bläddra i galleriet eller ladda upp eget.',
  },
  {
    step: '03',
    title: 'Prova på din vägg',
    description: 'Ladda upp ett foto av ditt rum och se tavlan live på väggen.',
  },
  {
    step: '04',
    title: 'Beställ & njut',
    description: 'Välj ram och storlek. Vi trycker och levererar hem till dig.',
  },
]

export default function Home() {
  const router = useRouter()
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
            <a
              href="#skapa-konto"
              className="text-sm font-medium text-white bg-gray-900 px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Skapa konto
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
            <a href="#skapa-konto" className="block text-base font-medium text-white bg-gray-900 text-center py-3 rounded-xl mt-2">
              Skapa konto
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
                <span className="text-xs font-medium text-gray-600 tracking-wide uppercase">Nu i beta — prova gratis</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 leading-[1.08]">
                Konst som passar
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  just din vägg
                </span>
              </h1>

              <p className="mt-8 text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
                Skapa AI-genererad konst, upptäck lokala konstnärer eller ladda upp ditt eget foto.
                Se hur det ser ut på din vägg — innan du beställer.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#skapa-konto"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/10"
                >
                  Kom igång gratis
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="/wallcraft"
                  className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-base font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  Se hur det fungerar
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-16 flex flex-wrap items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Gratis att testa
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Inget kort krävs
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tryck & leverans i Sverige
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
              Så fungerar det
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Från idé till tavla på väggen — på bara några minuter.
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-gray-200 to-gray-100" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white text-lg font-light mb-6">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
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
              Allt du behöver för väggkonst
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Sex kraftfulla verktyg — från AI-generering till konstanalys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <a
                key={i}
                href={feature.href}
                className={`group relative bg-gradient-to-br ${feature.bgLight} border ${feature.borderColor} rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="mt-6 flex items-center gap-1 text-sm font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
                  Utforska
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
                <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">AI-driven</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-light tracking-tight leading-tight">
                Möt <span className="text-purple-400">Boris</span> — din
                <br />personliga konstexpert
              </h2>

              <p className="mt-6 text-gray-400 leading-relaxed max-w-lg">
                Boris analyserar konstverk, kommenterar hur en tavla passar på din vägg,
                ger investeringsråd och hjälper dig hitta rätt stil. Allt drivet av AI.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Konstanalys</p>
                    <p className="text-sm text-gray-400">Analyserar stil, teknik, marknadsvärde och potential.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Väggkommentarer</p>
                    <p className="text-sm text-gray-400">Kommenterar hur tavlan passar i ditt rum — färger, proportioner, stil.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Investeringsråd</p>
                    <p className="text-sm text-gray-400">Hjälper dig hitta undervärderade verk med vinstpotential.</p>
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
                    Det här verket har en stark komposition med djupa blåtoner som skulle passa utmärkt mot din ljusa vägg. Jag rekommenderar storlek 50×70 cm med en vit ram för bästa effekt.
                  </p>
                </div>
                <div className="bg-purple-600/30 rounded-xl rounded-tr-sm p-4 max-w-[75%] ml-auto">
                  <p className="text-sm text-purple-200">Vad tror du om den som investering?</p>
                </div>
                <div className="bg-gray-700/40 rounded-xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Konstnären har en stigande trend. Liknande verk såldes för 40% mer förra året. Jag bedömer risken som låg med god potential.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <div className="flex-1 bg-gray-700/30 border border-gray-600/30 rounded-xl px-4 py-3 text-sm text-gray-500">
                  Fråga Boris om konst...
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
                  <p className="text-sm font-medium text-gray-900">Perfekt passform!</p>
                  <p className="text-xs text-gray-500">50×70 cm — vit ram</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 leading-tight">
                Se tavlan på din vägg
                <br />
                <span className="text-gray-400">innan du köper</span>
              </h2>

              <p className="mt-6 text-gray-500 leading-relaxed max-w-lg">
                Ladda upp ett foto av ditt rum, markera väggen och se direkt hur konstverket
                tar sig. Dra, zooma och byt ram i realtid. Boris ger dig dessutom sin
                expertkommentar om hur tavlan passar i rummet.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">Realtid</p>
                  <p className="text-sm text-gray-500 mt-1">Dra & zooma live</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">5+</p>
                  <p className="text-sm text-gray-500 mt-1">Ramval att välja</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">cm-exakt</p>
                  <p className="text-sm text-gray-500 mt-1">Verklig storlek</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4">
                  <p className="text-2xl font-light text-gray-900">Boris</p>
                  <p className="text-sm text-gray-500 mt-1">AI-kommentar</p>
                </div>
              </div>

              <a
                href="/wallcraft/studio"
                className="mt-8 inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Prova nu
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
            Är du konstnär eller fotograf?
          </h2>
          <p className="mt-6 text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Ladda upp dina verk till Art Market och nå nya köpare. Vi hanterar tryck, ram och leverans.
            Du sätter priset — vi delar vinsten 50/50.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/market/artist"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all hover:shadow-lg"
            >
              Registrera dig som konstnär
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/market"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl text-base font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              Bläddra i galleriet
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-light text-gray-900">50/50</p>
              <p className="text-sm text-gray-500 mt-1">Vinstdelning</p>
            </div>
            <div>
              <p className="text-3xl font-light text-gray-900">0 kr</p>
              <p className="text-sm text-gray-500 mt-1">Att komma igång</p>
            </div>
            <div>
              <p className="text-3xl font-light text-gray-900">Hela Sverige</p>
              <p className="text-sm text-gray-500 mt-1">Leverans & tryck</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Skapa konto CTA ─── */}
      <section id="skapa-konto" className="py-20 sm:py-28 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
            Redo att börja?
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Skapa ett gratis konto och få tillgång till alla verktyg. Ingen bindningstid, inget kort.
          </p>

          <div className="mt-10 max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-left">E-post</label>
                  <input
                    type="email"
                    placeholder="din@email.se"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 text-left">Lösenord</label>
                  <input
                    type="password"
                    placeholder="Minst 8 tecken"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Skapa konto
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                Genom att registrera dig godkänner du våra <a href="#" className="text-gray-400 underline">villkor</a>.
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
                Din kreativa plattform för väggkonst. Skapa, upptäck och beställ.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Verktyg</h4>
              <div className="space-y-2">
                <a href="/wallcraft/studio" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Wallcraft Studio</a>
                <a href="/market" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Art Market</a>
                <a href="/wallcraft/print-your-own" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Print Your Own</a>
                <a href="/scanner" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Art Scanner</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Kreativa verktyg</h4>
              <div className="space-y-2">
                <a href="/wallcraft/mandala" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Mandala Maker</a>
                <a href="/wallcraft/pattern" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pattern Studio</a>
                <a href="/wallcraft/abstract" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Abstract Painter</a>
                <a href="/wallcraft/colorfield" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Color Field Studio</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">För konstnärer</h4>
              <div className="space-y-2">
                <a href="/market/artist" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Konstnärsportal</a>
                <a href="/market" className="block text-sm text-gray-500 hover:text-gray-900 transition-colors">Galleri</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Artboris. Alla rättigheter förbehållna.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Integritetspolicy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Villkor</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
