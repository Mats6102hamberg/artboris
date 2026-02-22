'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1920&q=80&auto=format&fit=crop'

// ─── Types ───
interface Listing {
  id: string
  title: string
  thumbnailUrl: string
  imageUrl?: string
  artist: { displayName: string }
}

// ─── Fade-in on scroll hook ───
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

// ─── Hero ───
function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  const [heroImg, setHeroImg] = useState<string>(FALLBACK_HERO)
  const [heroArtist, setHeroArtist] = useState<string>('')

  useEffect(() => {
    fetch('/api/market/listings?featured=1&limit=1')
      .then(r => r.json())
      .then(data => {
        const listing = data.listings?.[0]
        if (listing) {
          setHeroImg(listing.thumbnailUrl || listing.imageUrl || FALLBACK_HERO)
          if (listing.artist?.displayName) setHeroArtist(listing.artist.displayName)
        }
      })
      .catch(() => {})
    setTimeout(() => setLoaded(true), 80)
  }, [])

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1200px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={heroImg}
          alt="Utvald konst från ArtBoris"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized={heroImg.includes('unsplash')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center px-6 max-w-3xl transition-all duration-1000 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          Gör ditt hem
          <br />
          till ett galleri
        </h1>
        <p className="mt-6 text-base sm:text-lg text-white/70 max-w-lg mx-auto leading-relaxed">
          Handplockade prints — AI-konst, fotografi och klassiska verk.
          Tryckt i museumkvalitet, levererat hem till dig.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/market"
            className="inline-flex items-center gap-2.5 bg-white text-gray-900 px-8 py-4 rounded-full text-sm font-medium tracking-wide hover:bg-gray-100 transition-all shadow-lg shadow-black/10"
          >
            Utforska galleriet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Link
            href="/wallcraft/studio"
            className="inline-flex items-center gap-2 text-white/90 border border-white/30 backdrop-blur-sm px-8 py-4 rounded-full text-sm font-medium tracking-wide hover:bg-white/10 hover:border-white/50 transition-all"
          >
            Skapa din egen konst
          </Link>
        </div>
      </div>

      {/* Artist credit */}
      {heroArtist && (
        <div className={`absolute bottom-20 sm:bottom-8 right-6 transition-opacity duration-1000 delay-700 ${loaded ? 'opacity-50' : 'opacity-0'}`}>
          <p className="text-[11px] text-white/60 tracking-wide">Verk av {heroArtist}</p>
        </div>
      )}

      {/* Scroll indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-1000 delay-1000 ${loaded ? 'opacity-50' : 'opacity-0'}`}>
        <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-0.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

// ─── Trust Bar ───
function TrustBar() {
  const { ref, visible } = useFadeIn()
  const items = [
    { icon: 'print', label: 'Museumkvalitet — Giclée fine art' },
    { icon: 'eu', label: 'Tryckt i Europa' },
    { icon: 'artist', label: 'Konstnärer & fotografer' },
    { icon: 'frame', label: 'Ramad, klar att hänga' },
  ]

  return (
    <div ref={ref} className={`bg-white border-b border-gray-100 transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                {item.icon === 'print' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                )}
                {item.icon === 'eu' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                )}
                {item.icon === 'artist' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                )}
                {item.icon === 'frame' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                )}
              </div>
              <span className="text-sm text-gray-600 leading-snug">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Curated Gallery ───
function CuratedGallery() {
  const { ref, visible } = useFadeIn()
  const [listings, setListings] = useState<Listing[]>([])

  useEffect(() => {
    fetch('/api/market/listings?featured=1&limit=6')
      .then(r => r.json())
      .then(data => {
        if (data.listings) setListings(data.listings.slice(0, 6))
      })
      .catch(() => {})
  }, [])

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-white">
      <div className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-14">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">Kurerat urval</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Utvald konst för ditt hem
          </h2>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/market/${listing.id}`}
                className="group block"
              >
                <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden relative">
                  <Image
                    src={listing.thumbnailUrl}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-white text-sm font-medium">{listing.title}</p>
                    <p className="text-white/60 text-xs mt-1">{listing.artist?.displayName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        <div className="text-center mt-14">
          <Link
            href="/market"
            className="inline-flex items-center gap-2.5 text-gray-900 border border-gray-200 px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:border-gray-400 hover:shadow-sm transition-all"
          >
            Visa hela samlingen
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Wallcraft Experience Block ───
function WallcraftBlock() {
  const { ref, visible } = useFadeIn()

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-[#FAFAF8]">
      <div className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Mockup image */}
          <div className="relative">
            <div className="aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden relative">
              <Image
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=960&q=80&auto=format&fit=crop"
                alt="Konst på vägg i modern interiör"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                unoptimized
              />
            </div>
          </div>

          {/* Right: Text */}
          <div className="max-w-lg">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">Visualisera</p>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Se konsten på
              <br />din egen vägg
            </h2>
            <p className="mt-6 text-gray-500 leading-relaxed">
              Ladda upp ett foto av ditt rum. Välj verk, ram och storlek — och se exakt hur det kommer se ut innan du beställer.
            </p>
            <Link
              href="/wallcraft/studio"
              className="mt-8 inline-flex items-center gap-2.5 bg-gray-900 text-white px-7 py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-gray-800 transition-all"
            >
              Prova på din vägg
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Artist Block ───
function ArtistBlock() {
  const { ref, visible } = useFadeIn()

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-white">
      <div className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">För konstnärer</p>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Visa din konst för hela Norden
          </h2>
          <p className="mt-6 text-gray-500 leading-relaxed max-w-lg mx-auto">
            Vi hanterar tryck, frakt och betalning. Du laddar upp — vi gör resten.
            Ingen startavgift, ingen bindningstid.
          </p>
          <Link
            href="/market/artist"
            className="mt-8 inline-flex items-center gap-2.5 bg-gray-900 text-white px-7 py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-gray-800 transition-all"
          >
            Ansök som konstnär
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Boris Curation Signature ───
function BorisCuration() {
  const { ref, visible } = useFadeIn()

  return (
    <section ref={ref} className="py-14 sm:py-20 bg-[#FAFAF8] border-t border-gray-100">
      <div className={`max-w-6xl mx-auto px-6 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-lg sm:text-xl text-gray-900 font-light tracking-tight italic" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          &ldquo;Varje verk i galleriet är handplockat och kvalitetsgranskat.&rdquo;
        </p>
        <p className="mt-4 text-xs tracking-[0.15em] uppercase text-gray-400">
          — Boris, curator
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-base font-semibold tracking-[0.15em] uppercase text-gray-900">Artboris</span>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-xs">
              Handplockade prints för moderna hem.
              Konst, fotografi och AI-genererade verk.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Utforska</h4>
            <div className="space-y-2.5">
              <a href="/market" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Galleri</a>
              <a href="/wallcraft/studio" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Wallcraft Studio</a>
              <a href="/wallcraft/gallery" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Community</a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Skapa</h4>
            <div className="space-y-2.5">
              <a href="/wallcraft/mandala" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Mandala Maker</a>
              <a href="/wallcraft/pattern" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Pattern Studio</a>
              <a href="/wallcraft/abstract" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Abstract Painter</a>
              <a href="/wallcraft/colorfield" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Color Field Studio</a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Konstnärer</h4>
            <div className="space-y-2.5">
              <a href="/market/artist" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Konstnärsportal</a>
              <a href="/wallcraft/print-your-own" className="block text-sm text-gray-400 hover:text-gray-700 transition-colors">Print Your Own</a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-300">&copy; {new Date().getFullYear()} Artboris. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">Villkor</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ───
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeroSection />
      <TrustBar />
      <CuratedGallery />
      <WallcraftBlock />
      <ArtistBlock />
      <BorisCuration />
      <Footer />
    </div>
  )
}
