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
import Button from '@/components/ui/Button'
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
  variants: DesignVariantData[]
}

export default function WallcraftDesignPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const [design, setDesign] = useState<DesignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [positionX, setPositionX] = useState(0.5)
  const [positionY, setPositionY] = useState(0.4)
  const [scale, setScale] = useState(1.0)
  const [frameId, setFrameId] = useState('black')
  const [sizeId, setSizeId] = useState('50x70')
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(0)
  const [wantPublish, setWantPublish] = useState(false)

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
          if (d.selectedVariantId && d.variants.length > 0) {
            const idx = d.variants.findIndex((v) => v.id === d.selectedVariantId)
            setSelectedVariantIndex(idx >= 0 ? idx : 0)
          }
        } else {
          setError(data.error || t('common.error'))
        }
      })
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false))
  }, [id])

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

  const gridVariants = (design?.variants || []).map((v) => ({
    id: v.id,
    imageUrl: v.imageUrl,
    thumbnailUrl: v.thumbnailUrl || v.imageUrl,
    isSelected: false,
  }))

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
      publish: wantPublish ? '1' : '0',
      totalSEK: String(pricing.totalPriceSEK),
      creditsNeeded: String(pricing.creditsNeeded),
    })
    router.push(`/wallcraft/checkout?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-500 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || t('common.error')}</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.push('/wallcraft/studio')}>
            ← {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/wallcraft')} className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold tracking-widest uppercase text-gray-900">
              {t('brand.name')}
            </span>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">✓</span>
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
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg">
                <img src={selectedVariant.imageUrl} alt="Design" className="w-full h-full object-cover" />
              </div>
            ) : null}

            {design.variants.length > 1 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('studio.editor.variants')}</h3>
                <VariantsGrid
                  variants={gridVariants}
                  selectedIndex={selectedVariantIndex}
                  onSelect={handleSelectVariant}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <FramePicker selectedFrameId={frameId} onSelect={setFrameId} />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <SizePicker selectedSizeId={sizeId} onSelect={setSizeId} />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t('studio.editor.price')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Poster ({pricing.sizeLabel})</span>
                  <span className="font-medium text-gray-900">{formatSEK(pricing.basePriceSEK)}</span>
                </div>
                {pricing.framePriceSEK > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('studio.editor.frame')}</span>
                    <span className="font-medium text-gray-900">+{formatSEK(pricing.framePriceSEK)}</span>
                  </div>
                )}
                <hr className="border-gray-100 my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatSEK(pricing.totalPriceSEK)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <PublishToggle isPublished={wantPublish} onToggle={setWantPublish} />
            </div>

            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!selectedVariant}
              className="hidden lg:flex w-full"
            >
              {t('studio.editor.addToCart')} — {formatSEK(pricing.totalPriceSEK)}
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200/60 lg:hidden z-20">
        <Button
          size="lg"
          onClick={handleCheckout}
          disabled={!selectedVariant}
          className="w-full"
        >
          {t('studio.editor.addToCart')} — {formatSEK(pricing.totalPriceSEK)}
        </Button>
      </div>
    </div>
  )
}
