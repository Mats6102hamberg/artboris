'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import MockupPreview from '@/components/poster/MockupPreview'
import FramePicker from '@/components/poster/FramePicker'
import SizePicker from '@/components/poster/SizePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import PublishToggle from '@/components/poster/PublishToggle'
import VariantsGrid from '@/components/poster/VariantsGrid'
import { calculatePrintPrice, formatSEK } from '@/lib/pricing/prints'

interface DesignVariantData {
  id: string
  imageUrl: string
  thumbnailUrl: string
  seed: number
  sortOrder: number
}

interface DesignData {
  id: string
  style: string
  prompt: string
  imageUrl: string
  roomImageUrl: string | null
  wallCorners: string | null
  selectedVariantId: string | null
  positionX: number
  positionY: number
  scale: number
  frameId: string
  sizeId: string
  isPublic: boolean
  variants: DesignVariantData[]
}

export default function DesignPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const [design, setDesign] = useState<DesignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editor state
  const [positionX, setPositionX] = useState(0.5)
  const [positionY, setPositionY] = useState(0.4)
  const [scale, setScale] = useState(1.0)
  const [frameId, setFrameId] = useState('black')
  const [sizeId, setSizeId] = useState('50x70')
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(0)
  const [wantPublish, setWantPublish] = useState(false)

  // Load design from DB
  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/designs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.design) {
          const d = data.design as DesignData
          setDesign(d)
          setPositionX(d.positionX)
          setPositionY(d.positionY)
          setScale(d.scale)
          setFrameId(d.frameId)
          setSizeId(d.sizeId)
          setWantPublish(d.isPublic ?? false)
          if (d.selectedVariantId && d.variants.length > 0) {
            const idx = d.variants.findIndex((v) => v.id === d.selectedVariantId)
            setSelectedVariantIndex(idx >= 0 ? idx : 0)
          }
        } else {
          setError(data.error || 'Kunde inte ladda design.')
        }
      })
      .catch(() => setError('Nätverksfel.'))
      .finally(() => setLoading(false))
  }, [id])

  // Auto-save with debounce
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const saveToDb = useCallback(
    (updates: Record<string, unknown>) => {
      if (!id) return
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(() => {
        fetch(`/api/designs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch((err) => console.error('[auto-save] Error:', err))
      }, 500)
    },
    [id]
  )

  // Save on changes
  useEffect(() => {
    if (!design) return
    saveToDb({ positionX, positionY, scale, frameId, sizeId })
  }, [positionX, positionY, scale, frameId, sizeId])

  const handleSelectVariant = (index: number) => {
    setSelectedVariantIndex(index)
    if (design && design.variants[index]) {
      const variant = design.variants[index]
      saveToDb({ selectedVariantId: variant.id, imageUrl: variant.imageUrl })
    }
  }

  const pricing = calculatePrintPrice(sizeId, frameId)

  const selectedVariant = design?.variants[selectedVariantIndex ?? 0]
  const wallCorners = design?.wallCorners ? JSON.parse(design.wallCorners) : []

  // Map variants for VariantsGrid
  const gridVariants = (design?.variants || []).map((v) => ({
    id: v.id,
    imageUrl: v.imageUrl,
    thumbnailUrl: v.thumbnailUrl || v.imageUrl,
    isSelected: false,
  }))

  const handlePublishToggle = async (publish: boolean) => {
    setWantPublish(publish)
    try {
      await fetch('/api/gallery/publish', {
        method: publish ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId: id }),
      })
    } catch (err) {
      console.error('Publish toggle failed:', err)
      setWantPublish(!publish)
    }
  }

  const handleCheckout = () => {
    if (!design || !selectedVariant) return
    const params = new URLSearchParams({
      designId: design.id,
      variantId: selectedVariant.id,
      designImageUrl: selectedVariant.imageUrl,
      roomImageUrl: design.roomImageUrl || '',
      frameId,
      sizeId,
      style: design.style,
      prompt: design.prompt,
      seed: String(selectedVariant.seed || 0),
      totalSEK: String(pricing.totalPriceSEK),
      creditsNeeded: String(pricing.creditsNeeded),
    })
    router.push(`/poster-lab/checkout?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || t('posterLab.designNotFound')}</p>
          <button
            onClick={() => router.push('/poster-lab')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t('posterLab.backToPosterLab')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => router.push('/poster-lab')} className="text-gray-400 hover:text-gray-600 text-sm">
              &larr;
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Din design</h1>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Sparad</span>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8">
          {/* Preview */}
          <div className="lg:col-span-3">
            {design.roomImageUrl && selectedVariant ? (
              <MockupPreview
                roomImageUrl={design.roomImageUrl}
                designImageUrl={selectedVariant.imageUrl}
                wallCorners={wallCorners}
                frameId={frameId}
                sizeId={sizeId}
                positionX={positionX}
                positionY={positionY}
                scale={scale}
                onPositionChange={(x, y) => { setPositionX(x); setPositionY(y) }}
                onScaleChange={setScale}
              />
            ) : selectedVariant ? (
              <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
                <img src={selectedVariant.imageUrl} alt="Design" className="w-full h-full object-cover" />
              </div>
            ) : null}

            {/* Variant picker */}
            {design.variants.length > 1 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Varianter</h3>
                <VariantsGrid
                  variants={gridVariants}
                  selectedIndex={selectedVariantIndex}
                  onSelect={handleSelectVariant}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Frame picker */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <FramePicker selectedFrameId={frameId} onSelect={setFrameId} />
            </div>

            {/* Size picker */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <SizePicker selectedSizeId={sizeId} onSelect={setSizeId} />
            </div>

            {/* Pricing summary */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Prisöversikt</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Poster ({pricing.sizeLabel})</span>
                  <span className="font-medium text-gray-900">{formatSEK(pricing.basePriceSEK)}</span>
                </div>
                {pricing.framePriceSEK > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ram</span>
                    <span className="font-medium text-gray-900">+{formatSEK(pricing.framePriceSEK)}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Totalt</span>
                  <span className="font-bold text-gray-900">{formatSEK(pricing.totalPriceSEK)}</span>
                </div>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <PublishToggle isPublished={wantPublish} onToggle={handlePublishToggle} />
            </div>

            {wantPublish && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-200/60">
                <p className="text-sm text-amber-900 font-medium">Vill du tjäna pengar på din konst?</p>
                <p className="text-xs text-amber-700 mt-1">
                  Registrera dig på Art Market för att sälja tryck av dina verk.
                </p>
                <button
                  onClick={() => router.push('/market/artist')}
                  className="mt-3 text-xs font-medium text-amber-900 underline underline-offset-4 hover:text-amber-700"
                >
                  Bli konstnär på Artboris →
                </button>
              </div>
            )}

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={!selectedVariant}
              className="hidden lg:block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg shadow-lg shadow-green-200 disabled:from-gray-300 disabled:to-gray-300"
            >
              Gå till kassan — {formatSEK(pricing.totalPriceSEK)}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200 lg:hidden z-20">
        <button
          onClick={handleCheckout}
          disabled={!selectedVariant}
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-green-200"
        >
          Gå till kassan — {formatSEK(pricing.totalPriceSEK)}
        </button>
      </div>
    </div>
  )
}
