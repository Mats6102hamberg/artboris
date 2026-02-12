'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoomUpload from '@/components/poster/RoomUpload'
import WallMarker from '@/components/poster/WallMarker'
import StylePicker from '@/components/poster/StylePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import { StylePreset } from '@/types/design'

const DEMO_ROOM_IMAGE = '/assets/demo/room-sample.svg'

const SHOWCASE_ITEMS = [
  { style: 'Nordic', image: '/assets/demo/nordic-1.svg', color: 'from-blue-400 to-cyan-300' },
  { style: 'Abstract', image: '/assets/demo/abstract-1.svg', color: 'from-purple-500 to-pink-400' },
  { style: 'Art Deco', image: '/assets/demo/art-deco-1.svg', color: 'from-yellow-500 to-amber-400' },
  { style: 'Minimal', image: '/assets/demo/minimal-1.svg', color: 'from-gray-400 to-gray-300' },
  { style: 'Graffiti', image: '/assets/demo/graffiti-1.svg', color: 'from-red-500 to-cyan-400' },
  { style: 'Botanical', image: '/assets/demo/botanical-1.svg', color: 'from-green-400 to-emerald-300' },
  { style: 'Surreal', image: '/assets/demo/surreal-1.svg', color: 'from-violet-400 to-rose-300' },
  { style: 'Retro', image: '/assets/demo/retro-1.svg', color: 'from-orange-400 to-yellow-300' },
  { style: 'Pastell', image: '/assets/demo/pastel-1.svg', color: 'from-pink-300 to-blue-200' },
  { style: 'Dark & Moody', image: '/assets/demo/dark-moody-1.svg', color: 'from-gray-700 to-purple-900' },
  { style: 'Mid-Century', image: '/assets/demo/mid-century-1.svg', color: 'from-orange-400 to-teal-400' },
  { style: 'Nordic II', image: '/assets/demo/nordic-2.svg', color: 'from-emerald-400 to-gray-300' },
]

export default function PosterLabPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'landing' | 'create'>('landing')
  const [step, setStep] = useState<'upload' | 'mark-wall' | 'pick-style'>('upload')
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [credits] = useState(30)
  const [heroVisible, setHeroVisible] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
    setTimeout(() => setStatsVisible(true), 600)
  }, [])

  const startCreate = (useDemo = false) => {
    if (useDemo) {
      setRoomImageUrl(DEMO_ROOM_IMAGE)
      setRoomId('demo-room')
      setStep('mark-wall')
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
        body: JSON.stringify({ style: selectedStyle, userDescription, controls: null }),
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
      <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Nav */}
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">&larr; Art Scanner</a>
            <div className="w-px h-5 bg-white/20" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Poster Lab
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/poster-lab/gallery" className="text-white/60 hover:text-white text-sm transition-colors">Galleri</a>
            <CreditBadge balance={credits} />
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20">
          <div className={`transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-purple-300 mb-6 backdrop-blur-sm border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                AI-driven konstgenerering
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                Skapa unik konst
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  för din vägg
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/60 mt-6 max-w-xl mx-auto leading-relaxed">
                Ladda upp ditt rum, välj stil, och låt AI skapa 4 unika konstverk.
                Se dem direkt på din vägg innan du beställer.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => startCreate(false)}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-semibold text-lg shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Skapa din poster
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={() => startCreate(true)}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl font-medium text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300"
                >
                  Prova med demo-rum
                </button>
              </div>
            </div>
          </div>

          {/* Floating showcase */}
          <div className={`mt-16 transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative">
              {/* Room mockup with poster */}
              <div className="relative max-w-2xl mx-auto">
                <div className="relative bg-gradient-to-b from-white/5 to-white/0 rounded-3xl p-1 border border-white/10">
                  <div className="relative rounded-2xl overflow-hidden bg-[#1a1a2e]">
                    <img src={DEMO_ROOM_IMAGE} alt="Demo rum" className="w-full opacity-60" />
                    {/* Floating poster on wall */}
                    <div className="absolute top-[18%] left-[35%] w-[30%] animate-float">
                      <div className="bg-white p-1.5 rounded shadow-2xl shadow-black/50 transform rotate-0">
                        <img src="/assets/demo/nordic-1.svg" alt="Poster" className="w-full rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-transparent to-blue-600/20 rounded-3xl blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Tre steg till din
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> drömkonst</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Ladda upp ditt rum',
                desc: 'Ta ett foto av väggen där postern ska hänga och markera ytan.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                gradient: 'from-purple-500/20 to-purple-600/5',
                border: 'border-purple-500/30',
              },
              {
                num: '02',
                title: 'Välj stil & generera',
                desc: '12 stilar att välja bland. AI skapar 4 unika varianter åt dig.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                gradient: 'from-blue-500/20 to-blue-600/5',
                border: 'border-blue-500/30',
              },
              {
                num: '03',
                title: 'Se & beställ',
                desc: 'Se postern på din vägg i realtid. Välj ram, storlek och beställ tryck.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                gradient: 'from-emerald-500/20 to-emerald-600/5',
                border: 'border-emerald-500/30',
              },
            ].map((item, i) => (
              <div
                key={item.num}
                className={`group relative bg-gradient-to-b ${item.gradient} rounded-2xl p-6 border ${item.border} hover:scale-105 transition-all duration-500`}
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="text-5xl font-black text-white/5 absolute top-4 right-5">{item.num}</div>
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white/80 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Style showcase */}
        <section className="relative z-10 py-20 overflow-hidden">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            12 unika stilar
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-md mx-auto">
            Från nordisk minimalism till retro synthwave — hitta din stil
          </p>

          {/* Scrolling gallery */}
          <div className="relative">
            <div className="flex gap-5 animate-scroll px-6">
              {[...SHOWCASE_ITEMS, ...SHOWCASE_ITEMS].map((item, i) => (
                <div
                  key={`${item.style}-${i}`}
                  className="flex-shrink-0 w-56 group cursor-pointer"
                  onClick={() => startCreate(true)}
                >
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                    <div className={`absolute inset-0 bg-gradient-to-b ${item.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <img src={item.image} alt={item.style} className="w-full aspect-[2/3] object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <span className="text-sm font-medium">{item.style}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a1a] to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a1a] to-transparent pointer-events-none" />
          </div>
        </section>

        {/* Stats */}
        <section className={`relative z-10 max-w-4xl mx-auto px-6 py-16 transition-all duration-1000 ${statsVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '18', label: 'Konststilar' },
              { value: '4', label: 'AI-varianter per generering' },
              { value: '8', label: 'Storlekar' },
              { value: '6', label: 'Ramalternativ' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-white/40 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Redo att skapa?
          </h2>
          <p className="text-white/50 mb-8">Det tar mindre än en minut att få ditt första förslag</p>
          <button
            onClick={() => startCreate(true)}
            className="group px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl font-semibold text-xl shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300 animate-glow"
          >
            <span className="flex items-center gap-3">
              Starta Poster Lab
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </section>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.3); }
            50% { box-shadow: 0 0 40px rgba(147, 51, 234, 0.5), 0 0 60px rgba(59, 130, 246, 0.2); }
          }
          .animate-glow {
            animation: glow 3s ease-in-out infinite;
          }
        `}</style>
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
            <button onClick={() => setMode('landing')} className="text-gray-400 hover:text-gray-600 text-sm">&larr; Tillbaka</button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Poster Lab
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/poster-lab/gallery" className="text-sm text-gray-600 hover:text-gray-900">Galleri</a>
            <CreditBadge balance={credits} />
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
                    setStep('mark-wall')
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
                    'Generera 4 förslag (2 credits)'
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
