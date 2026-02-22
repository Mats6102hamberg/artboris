'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { POSTER_SIZES } from '@/lib/image/resize'
import { FRAME_OPTIONS, calculatePrintPrice } from '@/lib/pricing/prints'
import { calculateMarketPrice, formatPriceSEK } from '@/lib/pricing/market'
import { cropToCSS } from '@/lib/image/crop'
import MockupPreview from '@/components/poster/MockupPreview'
import WallMarker from '@/components/poster/WallMarker'
import { DEMO_WALL_CORNERS } from '@/lib/demo/demoImages'
import CreativeToolsSection from '@/components/wallcraft/CreativeToolsSection'
import ProtectedImage from '@/components/ui/ProtectedImage'

interface ListingDetail {
  id: string
  title: string
  description: string
  technique: string
  category: string
  year: number | null
  previewUrl: string
  thumbnailUrl?: string
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

type Step = 'details' | 'upload-room' | 'mark-wall' | 'preview' | 'checkout'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()

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

  // Crop offset — buyer drags to reposition motif
  const [cropOffsetX, setCropOffsetX] = useState(0)
  const [cropOffsetY, setCropOffsetY] = useState(0)
  const isDraggingCrop = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const handleCropPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingCrop.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, ox: cropOffsetX, oy: cropOffsetY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [cropOffsetX, cropOffsetY])

  const handleCropPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingCrop.current || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const dx = (e.clientX - dragStart.current.x) / rect.width * -2
    const dy = (e.clientY - dragStart.current.y) / rect.height * -2
    setCropOffsetX(Math.max(-1, Math.min(1, dragStart.current.ox + dx)))
    setCropOffsetY(Math.max(-1, Math.min(1, dragStart.current.oy + dy)))
  }, [])

  const handleCropPointerUp = useCallback(() => {
    isDraggingCrop.current = false
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Checkout
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

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
          <p className="text-gray-500 text-lg">{t('market.artworkNotFound')}</p>
          <a href="/market" className="text-blue-600 hover:underline mt-4 inline-block">← {t('market.backToGallery')}</a>
        </div>
      </div>
    )
  }

  // Checkout step — shipping form + Stripe redirect
  if (step === 'checkout' && listing && pricing) {
    const isShippingValid = shippingForm.firstName && shippingForm.lastName && shippingForm.email && shippingForm.address && shippingForm.postalCode && shippingForm.city

    const handleMarketCheckout = async () => {
      if (!isShippingValid) return
      setIsProcessing(true)
      setCheckoutError(null)

      try {
        const res = await fetch('/api/market/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: listing.id,
            sizeCode: sizeId,
            frameColor: frameId === 'none' ? 'NONE' : frameId.toUpperCase(),
            cropOffsetX,
            cropOffsetY,
            shipping: shippingForm,
          }),
        })

        const data = await res.json()

        if (data.url) {
          window.location.href = data.url
        } else {
          setCheckoutError(data.error || t('market.somethingWentWrong'))
        }
      } catch {
        setCheckoutError(t('market.networkError'))
      } finally {
        setIsProcessing(false)
      }
    }

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setShippingForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setStep(roomImageUrl ? 'preview' : 'details')} className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold tracking-widest uppercase text-gray-900">Kassa</span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Säker betalning
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8 pb-28 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Shipping form */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Leveransuppgifter</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Förnamn *</label>
                    <input name="firstName" value={shippingForm.firstName} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Efternamn *</label>
                    <input name="lastName" value={shippingForm.lastName} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">E-post *</label>
                    <input name="email" value={shippingForm.email} onChange={handleShippingChange} type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefon</label>
                    <input name="phone" value={shippingForm.phone} onChange={handleShippingChange} type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Adress *</label>
                    <input name="address" value={shippingForm.address} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Postnummer *</label>
                    <input name="postalCode" value={shippingForm.postalCode} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Stad *</label>
                    <input name="city" value={shippingForm.city} onChange={handleShippingChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Betalning</h2>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Säker kortbetalning via Stripe</p>
                    <p className="text-xs text-gray-400">Du skickas till Stripe för att slutföra betalningen</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">VISA</div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Mastercard</div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Klarna</div>
                </div>

                {checkoutError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{checkoutError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-gray-200/60 lg:sticky lg:top-24">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Ordersammanfattning</h2>

                <div className="flex gap-3 mb-6">
                  <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    <img src={listing.previewUrl} alt={listing.title} className="w-full h-full" style={cropToCSS('COVER', cropOffsetX, cropOffsetY)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500">av {listing.artist.displayName}</p>
                    <p className="text-xs text-gray-500 mt-1">Storlek: {sizeId} · Ram: {frameId === 'none' ? 'Ingen' : frameId}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Konstverk</span>
                    <span className="text-gray-900">{formatPriceSEK(pricing.artistPriceSEK)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tryck + ram</span>
                    <span className="text-gray-900">{formatPriceSEK(pricing.printCostSEK)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frakt</span>
                    <span className="text-gray-900">{formatPriceSEK(pricing.shippingSEK)}</span>
                  </div>
                  <hr className="border-gray-100 !my-3" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-gray-900">Totalt</span>
                    <span className="font-bold text-gray-900">{formatPriceSEK(pricing.totalBuyerSEK)}</span>
                  </div>
                </div>

                <button
                  onClick={handleMarketCheckout}
                  disabled={!isShippingValid || isProcessing}
                  className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Bearbetar...
                    </span>
                  ) : (
                    `Slutför köp — ${formatPriceSEK(pricing.totalBuyerSEK)}`
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                  50% av konstverkspriset går direkt till konstnären.
                  <br />
                  Trycks av <span className="font-medium text-gray-500">Crimson, Stockholm</span>.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky mobile checkout bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 safe-area-bottom">
          <button
            onClick={handleMarketCheckout}
            disabled={!isShippingValid || isProcessing}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Bearbetar...
              </span>
            ) : (
              `Slutför köp — ${formatPriceSEK(pricing.totalBuyerSEK)}`
            )}
          </button>
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

        <div className="max-w-6xl mx-auto px-4 py-6 pb-28 lg:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mockup preview */}
            <div className="lg:col-span-2">
              <MockupPreview
                roomImageUrl={roomImageUrl}
                designImageUrl={listing.previewUrl}
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
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full mt-4 bg-white text-gray-900 font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
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

        {/* Sticky mobile buy bar for preview */}
        {pricing && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-4 z-40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Totalt</span>
              <span className="text-white font-semibold">{formatPriceSEK(pricing.totalBuyerSEK)}</span>
            </div>
            <button
              onClick={() => setStep('checkout')}
              className="w-full bg-white text-gray-900 font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Köp nu
            </button>
          </div>
        )}
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
              ← {t('market.back')}
            </button>
            <span className="font-medium text-gray-900">{t('market.uploadRoom')}</span>
            <div className="w-16" />
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <div>
            <h2 className="text-2xl font-light text-gray-900">{t('market.uploadRoomDesc')}</h2>
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
            {t('market.choosePhoto')}
          </button>

          <button
            onClick={() => {
              setRoomImageUrl('/assets/demo/room-sample.svg')
              setWallCorners(DEMO_WALL_CORNERS)
              setStep('preview')
            }}
            className="block mx-auto text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
          >
            {t('market.useDemoRoom')}
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
            ← {t('market.backToGallery')}
          </a>
          <a href="/" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
            Artboris
          </a>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image — drag to reposition */}
          <div className="relative">
            <div
              ref={imageContainerRef}
              className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-xl cursor-grab active:cursor-grabbing select-none touch-none"
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerCancel={handleCropPointerUp}
            >
              <img
                src={listing.previewUrl}
                alt={listing.title}
                className="w-full h-full pointer-events-none"
                style={cropToCSS('COVER', cropOffsetX, cropOffsetY)}
                draggable={false}
              />
            </div>
            {listing.isOriginal && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                Original
              </span>
            )}
            <p className="text-center text-xs text-gray-400 mt-2">Dra f&ouml;r att justera motivet</p>
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
                {t('market.tryOnWall')}
              </button>

              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 bg-white text-gray-900 text-base font-medium rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-colors"
              >
                Köp direkt
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

              <CreativeToolsSection imageUrl={listing.previewUrl} />
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
