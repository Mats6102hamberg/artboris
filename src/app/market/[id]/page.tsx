'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { POSTER_SIZES } from '@/lib/image/resize'
import { FRAME_OPTIONS, calculatePrintPrice } from '@/lib/pricing/prints'
import { calculateMarketPrice, formatPriceSEK } from '@/lib/pricing/market'
import MockupPreview from '@/components/poster/MockupPreview'
import WallMarker from '@/components/poster/WallMarker'

interface ListingDetail {
  id: string
  title: string
  description: string
  technique: string
  category: string
  year: number | null
  imageUrl: string
  widthCm: number | null
  heightCm: number | null
  artistPriceSEK: number
  isOriginal: boolean
  views: number
  tryOnWallCount: number
  artist: {
    id: string
    displayName: string
    bio: string
    avatarUrl: string
    website: string
    instagram: string
  }
}

type Step = 'details' | 'upload-room' | 'mark-wall' | 'preview'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('details')

  // Room + wall
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])

  // Poster config
  const [sizeId, setSizeId] = useState('50x70')
  const [frameId, setFrameId] = useState('none')
  const [positionX, setPositionX] = useState(0.5)
  const [positionY, setPositionY] = useState(0.4)
  const [scale, setScale] = useState(1.0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/market/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        setListing(data.listing || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const pricing = listing
    ? calculateMarketPrice(listing.artistPriceSEK, sizeId, frameId)
    : null

  const handleRoomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setRoomImageUrl(localUrl)

    // Upload to Blob
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setRoomImageUrl(data.room?.imageUrl || localUrl)
      }
    } catch (err) {
      console.error('Room upload error:', err)
    }

    setStep('mark-wall')
  }

  const handleTryOnWall = () => {
    // Track try-on-wall
    fetch(`/api/market/listings/${id}/try-wall`, { method: 'POST' }).catch(() => {})
    setStep('upload-room')
  }

  const handleStartPreview = () => {
    setStep('preview')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Konstverk hittades inte.</p>
          <a href="/market" className="text-blue-600 hover:underline mt-4 inline-block">← Tillbaka till galleriet</a>
        </div>
      </div>
    )
  }

  // Preview mode — show artwork on wall
  if (step === 'preview' && roomImageUrl) {
    return (
      <div className="min-h-screen bg-gray-900">
        <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setStep('details')} className="text-white/70 hover:text-white text-sm">
              ← Tillbaka
            </button>
            <span className="text-white font-medium">{listing.title}</span>
            <div className="w-20" />
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mockup preview */}
            <div className="lg:col-span-2">
              <MockupPreview
                roomImageUrl={roomImageUrl}
                designImageUrl={listing.imageUrl}
                wallCorners={wallCorners}
                frameId={frameId}
                sizeId={sizeId}
                positionX={positionX}
                positionY={positionY}
                scale={scale}
                onPositionChange={(x, y) => { setPositionX(x); setPositionY(y) }}
                onScaleChange={setScale}
              />
              <p className="text-white/50 text-xs text-center mt-3">
                Dra för att flytta • Scrolla för att ändra storlek
              </p>
            </div>

            {/* Controls sidebar */}
            <div className="space-y-4">
              {/* Size selector */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Storlek</h3>
                <div className="grid grid-cols-2 gap-2">
                  {POSTER_SIZES.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSizeId(size.id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        sizeId === size.id
                          ? 'bg-white text-gray-900 font-medium'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame selector */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Ram</h3>
                <div className="flex flex-wrap gap-2">
                  {FRAME_OPTIONS.map(frame => (
                    <button
                      key={frame.id}
                      onClick={() => setFrameId(frame.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        frameId === frame.id
                          ? 'bg-white text-gray-900 font-medium'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {frame.id !== 'none' && (
                        <div
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: frame.color }}
                        />
                      )}
                      {frame.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              {pricing && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3">Pris</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Konstverk</span>
                      <span>{formatPriceSEK(pricing.artistPriceSEK)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Tryck + ram</span>
                      <span>{formatPriceSEK(pricing.printCostSEK)}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Frakt</span>
                      <span>{formatPriceSEK(pricing.shippingSEK)}</span>
                    </div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between text-white font-semibold text-base">
                      <span>Totalt</span>
                      <span>{formatPriceSEK(pricing.totalBuyerSEK)}</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-white text-gray-900 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors">
                    Köp nu
                  </button>
                  <p className="text-white/40 text-xs text-center mt-2">
                    50% av konstverkspriset går direkt till konstnären
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mark wall step
  if (step === 'mark-wall' && roomImageUrl) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('upload-room')} className="text-gray-500 hover:text-gray-900 text-sm">
              ← Tillbaka
            </button>
            <span className="font-medium text-gray-900">Markera väggen</span>
            <div className="w-16" />
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-light text-gray-900">Markera din vägg</h2>
            <p className="text-gray-500 mt-2">
              Tryck på de 4 hörnen av väggområdet där du vill hänga tavlan.
              {wallCorners.length > 0 && wallCorners.length < 4 && (
                <span className="ml-2 text-gray-900 font-medium">({wallCorners.length}/4 hörn)</span>
              )}
              {wallCorners.length === 4 && (
                <span className="ml-2 text-green-600 font-medium">✓ Vägg markerad</span>
              )}
            </p>
          </div>
          <WallMarker imageUrl={roomImageUrl} corners={wallCorners} onCornersChange={setWallCorners} />
          <div className="flex justify-between">
            <button
              onClick={() => setStep('upload-room')}
              className="text-gray-500 hover:text-gray-900 text-sm"
            >
              ← Byt rum
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleStartPreview}
                className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4"
              >
                Hoppa över — placera fritt
              </button>
              <button
                onClick={handleStartPreview}
                disabled={wallCorners.length < 4}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Se på väggen →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Upload room step
  if (step === 'upload-room') {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('details')} className="text-gray-500 hover:text-gray-900 text-sm">
              ← Tillbaka
            </button>
            <span className="font-medium text-gray-900">Ladda upp ditt rum</span>
            <div className="w-16" />
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <div>
            <h2 className="text-2xl font-light text-gray-900">Ladda upp ett foto av ditt rum</h2>
            <p className="text-gray-500 mt-2">
              Ta ett foto av väggen där du vill hänga &quot;{listing.title}&quot;
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleRoomUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Välj foto
          </button>

          <button
            onClick={() => {
              setRoomImageUrl('/assets/demo/room-sample.svg')
              setStep('mark-wall')
            }}
            className="block mx-auto text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
          >
            Använd demo-rum istället
          </button>
        </div>
      </div>
    )
  }

  // Details page (default)
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/market" className="text-gray-500 hover:text-gray-900 text-sm">
            ← Tillbaka till galleriet
          </a>
          <a href="/" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
            Artboris
          </a>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            {listing.isOriginal && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                Original
              </span>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-light text-gray-900">{listing.title}</h1>
              <p className="text-lg text-gray-500 mt-1">av {listing.artist.displayName}</p>
            </div>

            <div className="text-3xl font-semibold text-gray-900">
              {formatPriceSEK(listing.artistPriceSEK)}
              <span className="text-sm font-normal text-gray-400 ml-2">+ tryck & ram</span>
            </div>

            {listing.description && (
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {listing.technique && (
                <div>
                  <span className="text-gray-400">Teknik</span>
                  <p className="text-gray-900 font-medium">{listing.technique}</p>
                </div>
              )}
              {listing.year && (
                <div>
                  <span className="text-gray-400">År</span>
                  <p className="text-gray-900 font-medium">{listing.year}</p>
                </div>
              )}
              {listing.widthCm && listing.heightCm && (
                <div>
                  <span className="text-gray-400">Originalmått</span>
                  <p className="text-gray-900 font-medium">{listing.widthCm} × {listing.heightCm} cm</p>
                </div>
              )}
              <div>
                <span className="text-gray-400">Typ</span>
                <p className="text-gray-900 font-medium">{listing.isOriginal ? 'Original (1 st)' : 'Print / Reproduktion'}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleTryOnWall}
                className="w-full py-4 bg-gray-900 text-white text-lg font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                </svg>
                Prova på min vägg
              </button>

              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                <p className="font-medium text-gray-700 mb-2">Så fungerar det:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ladda upp ett foto av ditt rum</li>
                  <li>Markera väggytan</li>
                  <li>Se konstverket live på din vägg</li>
                  <li>Välj storlek och ram — köp direkt</li>
                </ol>
              </div>
            </div>

            {/* Artist info */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-4">
                {listing.artist.avatarUrl ? (
                  <img src={listing.artist.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-lg">
                    {listing.artist.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{listing.artist.displayName}</p>
                  {listing.artist.bio && (
                    <p className="text-sm text-gray-500 line-clamp-2">{listing.artist.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                {listing.artist.website && (
                  <a href={listing.artist.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Hemsida
                  </a>
                )}
                {listing.artist.instagram && (
                  <a href={`https://instagram.com/${listing.artist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    Instagram
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm text-gray-400">
              <span>{listing.views} visningar</span>
              <span>{listing.tryOnWallCount} har provat på sin vägg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
