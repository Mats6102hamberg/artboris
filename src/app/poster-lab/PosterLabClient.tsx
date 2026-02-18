'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import RoomUpload from '@/components/poster/RoomUpload'
import WallMarker from '@/components/poster/WallMarker'
import StylePicker from '@/components/poster/StylePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import { StylePreset } from '@/types/design'

import { DEMO_ROOM_IMAGE, DEMO_WALL_CORNERS } from '@/lib/demo/demoImages'
import { CREDIT_COSTS } from '@/lib/pricing/credits'

export default function PosterLabPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'landing' | 'create'>('landing')
  const [step, setStep] = useState<'upload' | 'mark-wall' | 'pick-style'>('upload')
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const [borisGenerating, setBorisGenerating] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
  }, [])

  const BORIS_STYLES: StylePreset[] = [
    'nordic', 'abstract', 'minimal', 'botanical', 'watercolor',
    'japanese', 'art-deco', 'surreal', 'pastel', 'dark-moody',
  ]

  const handleBorisGenerate = async () => {
    setBorisGenerating(true)
    try {
      const style = BORIS_STYLES[Math.floor(Math.random() * BORIS_STYLES.length)]
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, controls: null }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || 'Boris kunde inte skapa just nu. Försök igen!')
        setBorisGenerating(false)
      }
    } catch {
      alert('Något gick fel. Försök igen!')
      setBorisGenerating(false)
    }
  }

  const startCreate = (useDemo = false) => {
    if (useDemo) {
      setRoomImageUrl(DEMO_ROOM_IMAGE)
      setRoomId('demo-room')
      setWallCorners(DEMO_WALL_CORNERS)
      setStep('pick-style')
    }
    setMode('create')
  }

  const handleRoomUpload = async (localUrl: string, file: File) => {
    setRoomImageUrl(localUrl)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setRoomId(data.room.id)
        setRoomImageUrl(data.room.imageUrl)
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    setStep('mark-wall')
  }

  const handleGenerate = async () => {
    if (!selectedStyle) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: selectedStyle,
          userDescription,
          controls: null,
          roomImageUrl: roomImageUrl || undefined,
          wallCorners: wallCorners.length === 4 ? JSON.stringify(wallCorners) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const params = new URLSearchParams({
          designId: data.designId,
          roomImageUrl: roomImageUrl || '',
          wallCorners: JSON.stringify(wallCorners),
          style: selectedStyle,
          prompt: data.prompt,
          variants: JSON.stringify(data.variants),
        })
        router.push(`/poster-lab/result?${params.toString()}`)
      } else {
        alert(data.error || 'Generering misslyckades.')
      }
    } catch (err) {
      console.error('Generate error:', err)
      alert('Något gick fel vid generering.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ─── LANDING PAGE ───────────────────────────────────────
  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        {/* Nav */}
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <span className="text-xl font-semibold tracking-widest uppercase text-gray-900">
            Artboris
          </span>
          <div className="flex items-center gap-6">
            <a href="/poster-lab/gallery" className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all">Kollektion</a>
            <CreditBadge />
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Left: Copy */}
              <div className="max-w-lg">
                <p className="text-sm font-medium text-gray-400 tracking-wide uppercase mb-4">
                  Personlig konst, tryckt i Stockholm
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-gray-900">
                  Se din n&auml;sta tavla p&aring; din v&auml;gg
                  <span className="text-gray-300">.</span>
                </h1>
                <p className="text-lg text-gray-500 mt-6 leading-relaxed">
                  V&auml;lj bland v&aring;ra motiv eller skapa ett helt eget. Se hur det ser ut hemma hos dig innan du best&auml;ller &mdash; enkelt, tryggt och utan risk.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4 mt-10">
                  <button
                    onClick={() => startCreate(false)}
                    className="group px-10 py-5 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-900 transition-all duration-200 shadow-xl shadow-black/20"
                  >
                    <span className="flex items-center gap-2">
                      Se den p&aring; min v&auml;gg
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('featured-posters')
                      el?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="px-8 py-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    Utforska kollektionen
                  </button>
                </div>

                {/* Boris AI — Quick Generate */}
                <div className="mt-6">
                  <button
                    onClick={borisGenerating ? undefined : handleBorisGenerate}
                    disabled={borisGenerating}
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl font-semibold text-base hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-80 disabled:cursor-wait"
                  >
                    <span className="flex items-center justify-center gap-2.5">
                      {borisGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Boris skapar...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                          </svg>
                          L&aring;t Boris skapa &aring;t dig
                        </>
                      )}
                    </span>
                  </button>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {CREDIT_COSTS.aiGenerate} credits per motiv
                    </span>
                    <span className="text-xs text-purple-500 font-medium">
                      Skapa konto &mdash; f&aring; 20 gratis credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Hero image — room with poster */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/60">
                  {/* Scandinavian room photo placeholder */}
                  <div className="aspect-[4/3] bg-[#f5f0eb] relative">
                    <img
                      src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format"
                      alt="Skandinaviskt vardagsrum med tavla"
                      className="w-full h-full object-cover"
                    />
                    {/* Poster overlay on wall — realistic shadow + perspective */}
                    <div className="absolute top-[12%] left-[32%] w-[22%]" style={{ perspective: '800px' }}>
                      {/* Wall shadow (soft, offset, simulates depth) */}
                      <div
                        className="absolute inset-0 rounded-sm"
                        style={{
                          transform: 'translateX(6px) translateY(8px)',
                          background: 'rgba(0,0,0,0.18)',
                          filter: 'blur(12px)',
                          borderRadius: '2px',
                        }}
                      />
                      {/* Frame */}
                      <div
                        className="relative bg-white p-[3px] rounded-[2px]"
                        style={{
                          transform: 'rotateY(-1.5deg) rotateX(0.5deg)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="aspect-[2/3] bg-gray-100 rounded-[1px] overflow-hidden relative">
                          <img src="/assets/demo/botanical-1.svg" alt="Poster" className="w-full h-full object-cover" />
                          {/* Glass reflection highlight */}
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
                {/* Subtle accent */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-50 rounded-full -z-10" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gray-50 rounded-full -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="border-y border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { icon: '\u2713', text: 'Trycks i Stockholm' },
                { icon: '\u2713', text: 'Fine art-papper' },
                { icon: '\u2713', text: 'Leverans 3\u20135 dagar' },
                { icon: '\u2713', text: 'N\u00f6jd-kund-garanti' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-600 font-bold text-sm">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Posters */}
        <section id="featured-posters" className="bg-gray-50 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Utvalda posters</h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto">
                Handplockade motiv i premium fine art-kvalitet. Alla kan visas p&aring; din v&auml;gg innan du k&ouml;per.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { title: 'Nordisk Skog', image: '/assets/demo/nordic-1.svg', price: 349, sizes: '30x40 / 50x70' },
                { title: 'Abstrakt Harmoni', image: '/assets/demo/abstract-1.svg', price: 349, sizes: '30x40 / 50x70' },
                { title: 'Botanisk Dr&ouml;m', image: '/assets/demo/botanical-1.svg', price: 299, sizes: '30x40 / 50x70' },
                { title: 'Art Deco Guld', image: '/assets/demo/art-deco-1.svg', price: 399, sizes: '30x40 / 50x70' },
                { title: 'Minimalistisk Linje', image: '/assets/demo/minimal-1.svg', price: 299, sizes: '30x40 / 50x70' },
                { title: 'Pastelldr&ouml;m', image: '/assets/demo/pastel-1.svg', price: 349, sizes: '30x40 / 50x70' },
                { title: 'Retro Solnedg&aring;ng', image: '/assets/demo/retro-1.svg', price: 349, sizes: '30x40 / 50x70' },
                { title: 'M&ouml;rk Elegans', image: '/assets/demo/dark-moody-1.svg', price: 399, sizes: '30x40 / 50x70' },
              ].map((poster, i) => (
                <div key={i} className="group cursor-pointer" onClick={() => startCreate(true)}>
                  <div className="relative rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-lg transition-shadow duration-300">
                    <div className="aspect-[2/3] bg-gray-100">
                      <img src={poster.image} alt={poster.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900">{poster.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{poster.sizes}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-gray-900">{poster.price} kr</span>
                      <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                        Visa p&aring; min v&auml;gg &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => startCreate(false)}
                className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
              >
                Skapa ett eget motiv
              </button>
            </div>
          </div>
        </section>

        {/* How it works — rewritten for experience, not tech */}
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">S&aring; enkelt fungerar det</h2>
              <p className="text-gray-500 mt-3">Fr&aring;n id&eacute; till f&auml;rdig tavla p&aring; v&auml;ggen</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              {[
                {
                  num: '1',
                  title: 'Fotografera din v\u00e4gg',
                  desc: 'Ta en bild av rummet d\u00e4r tavlan ska h\u00e4nga. Det tar bara n\u00e5gra sekunder.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  num: '2',
                  title: 'V\u00e4lj eller skapa motiv',
                  desc: 'Bläddra bland v\u00e5ra motiv eller beskriv din drömbild. Du f\u00e5r flera f\u00f6rslag att v\u00e4lja bland.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  num: '3',
                  title: 'Se den hemma & best\u00e4ll',
                  desc: 'Se exakt hur tavlan ser ut p\u00e5 din v\u00e4gg. N\u00f6jd? Best\u00e4ll med ett klick.',
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div key={item.num} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-5">
                    {item.icon}
                  </div>
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-2">Steg {item.num}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { icon: '\u2713', text: 'Trycks i Stockholm' },
                { icon: '\u2713', text: 'Fine art-kvalitet' },
                { icon: '\u2713', text: 'Snabb leverans' },
                { icon: '\u2713', text: 'Enkel & s\u00e4ker betalning' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm font-bold">{item.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hitta din n&auml;sta tavla
            </h2>
            <p className="text-gray-500 mb-10 text-lg">
              Se hur den ser ut hemma hos dig &mdash; helt gratis, utan f&ouml;rpliktelser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => startCreate(false)}
                className="group px-10 py-4 bg-gray-900 text-white rounded-xl font-medium text-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
              >
                <span className="flex items-center gap-2">
                  Kom ig&aring;ng
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => startCreate(true)}
                className="px-8 py-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:border-gray-300 hover:text-gray-900 transition-all"
              >
                Prova med demo-rum
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Artboris. Alla r&auml;ttigheter f&ouml;rbeh&aring;llna.</span>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <span>Tryckt i Stockholm</span>
              <span>&middot;</span>
              <span>Fine art-papper</span>
              <span>&middot;</span>
              <span>S&auml;ker betalning via Stripe</span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // ─── CREATE FLOW ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('landing')} className="text-gray-400 hover:text-gray-600 text-sm">&larr; {t('posterLab.back')}</button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Poster Lab
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/poster-lab/gallery" className="text-sm text-gray-600 hover:text-gray-900">{t('posterLab.gallery')}</a>
            <CreditBadge />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { key: 'upload', label: '1. Rum', icon: '📷' },
            { key: 'mark-wall', label: '2. Vägg', icon: '📐' },
            { key: 'pick-style', label: '3. Stil', icon: '🎨' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-12 h-0.5 transition-all duration-500 ${
                  (i === 1 && roomImageUrl) || (i === 2 && wallCorners.length === 4)
                    ? 'bg-blue-400'
                    : 'bg-gray-200'
                }`} />
              )}
              <div
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
                  ${step === s.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                    : s.key === 'upload' || (s.key === 'mark-wall' && roomImageUrl) || (s.key === 'pick-style' && wallCorners.length === 4)
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
                onClick={() => {
                  if (s.key === 'upload') setStep('upload')
                  if (s.key === 'mark-wall' && roomImageUrl) setStep('mark-wall')
                  if (s.key === 'pick-style' && wallCorners.length === 4) setStep('pick-style')
                }}
              >
                <span>{s.icon}</span>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step content with fade transition */}
        <div className="transition-all duration-500 ease-out">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Skapa din poster</h2>
                <p className="text-gray-600 mt-2">Börja med att ladda upp ett foto av rummet där postern ska hänga</p>
              </div>
              <RoomUpload onUpload={handleRoomUpload} />
              <div className="text-center">
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-300 w-full" />
                  <span className="bg-gradient-to-br from-gray-50 to-blue-50 px-4 text-sm text-gray-400 absolute">eller</span>
                </div>
                <button
                  onClick={() => {
                    setRoomImageUrl(DEMO_ROOM_IMAGE)
                    setRoomId('demo-room')
                    setWallCorners(DEMO_WALL_CORNERS)
                    setStep('pick-style')
                  }}
                  className="px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all font-medium"
                >
                  Testa med demo-rum
                </button>
                <p className="text-xs text-gray-400 mt-2">Inget eget foto? Prova med vårt exempelrum</p>
              </div>
            </div>
          )}

          {/* Step 2: Mark wall */}
          {step === 'mark-wall' && roomImageUrl && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Markera väggen</h2>
                <p className="text-gray-600 mt-2">
                  Klicka på bilden för att markera de 4 hörnen av väggytan
                  {wallCorners.length > 0 && wallCorners.length < 4 && (
                    <span className="ml-2 text-blue-600 font-medium">({wallCorners.length}/4 hörn)</span>
                  )}
                  {wallCorners.length === 4 && (
                    <span className="ml-2 text-green-600 font-medium">Klart!</span>
                  )}
                </p>
              </div>
              <WallMarker imageUrl={roomImageUrl} corners={wallCorners} onCornersChange={setWallCorners} />
              <div className="flex justify-between">
                <button onClick={() => setStep('upload')} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors">
                  &larr; Byt rum
                </button>
                <button
                  onClick={() => setStep('pick-style')}
                  disabled={wallCorners.length < 4}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-200 disabled:shadow-none"
                >
                  Nästa &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pick style */}
          {step === 'pick-style' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Välj stil</h2>
                <p className="text-gray-600 mt-2">Vilken känsla vill du ha?</p>
              </div>
              <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beskriv din vision (valfritt)</label>
                <textarea
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder="T.ex. 'En lugn strandscen i pastellfärger' eller 'Abstrakt med guld och marinblått'..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder:text-gray-400 bg-white"
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep('mark-wall')} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors">
                  &larr; Tillbaka
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedStyle || isGenerating}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-200"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Genererar 4 förslag...
                    </span>
                  ) : (
                    'Generera 4 förslag'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
