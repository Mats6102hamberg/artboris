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
import { calculatePrintPrice, formatSEK, getFrameById as getFrame, FRAME_OPTIONS } from '@/lib/pricing/prints'
import { getSizeById } from '@/lib/image/resize'
import { useCart } from '@/lib/cart/CartContext'
import BorisVoice from '@/components/boris/BorisVoice'
import BorisButton from '@/components/boris/BorisButton'
import { getBorisComment } from '@/lib/boris/curatorVoice'

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
  const [isShuffling, setIsShuffling] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [shuffleCooldown, setShuffleCooldown] = useState(false)
  const [realisticMode, setRealisticMode] = useState<boolean | undefined>(undefined)
  const lastShuffleTime = useRef(0)

  // Boris curator voice
  const [borisMessage, setBorisMessage] = useState<string | null>(null)
  const borisTimeout = useRef<NodeJS.Timeout | null>(null)
  const hasShownPlacement = useRef(false)
  const prevFrameId = useRef(frameId)
  const prevSizeId = useRef(sizeId)
  const prevScale = useRef(scale)
  const moveDebounce = useRef<NodeJS.Timeout | null>(null)

  // Boris: show enhancement immediately, then placement
  useEffect(() => {
    if (hasShownPlacement.current) return
    hasShownPlacement.current = true
    // First: enhancement message (show immediately)
    const t1 = setTimeout(() => {
      setBorisMessage(getBorisComment({ type: 'enhancement' }))
    }, 800)
    // Then: placement message
    const t2 = setTimeout(() => {
      setBorisMessage(getBorisComment({ type: 'placement' }))
    }, 10000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Boris: react to frame changes
  useEffect(() => {
    if (prevFrameId.current === frameId) return
    prevFrameId.current = frameId
    if (!design) return
    if (borisTimeout.current) clearTimeout(borisTimeout.current)
    borisTimeout.current = setTimeout(() => {
      setBorisMessage(getBorisComment({
        type: 'style_match',
        frameId,
        style: design.style || 'default',
      }))
    }, 400)
  }, [frameId, design])

  // Boris: react to size changes
  useEffect(() => {
    if (prevSizeId.current === sizeId) return
    prevSizeId.current = sizeId
    if (borisTimeout.current) clearTimeout(borisTimeout.current)
    borisTimeout.current = setTimeout(() => {
      setBorisMessage(getBorisComment({ type: 'size_change', sizeId }))
    }, 400)
  }, [sizeId])

  // Boris: react to scale changes (resize handles)
  useEffect(() => {
    if (Math.abs(prevScale.current - scale) < 0.05) return
    const direction = scale > prevScale.current ? 'up' : 'down'
    prevScale.current = scale
    if (borisTimeout.current) clearTimeout(borisTimeout.current)
    borisTimeout.current = setTimeout(() => {
      setBorisMessage(getBorisComment({ type: 'scale', direction }))
    }, 800)
  }, [scale])

  // Fetch credit balance
  useEffect(() => {
    fetch('/api/credits/balance?userId=demo-user')
      .then(res => res.json())
      .then(data => { if (data.success) setCredits(data.balance) })
      .catch(() => setCredits(null))
  }, [])

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

  const handleShuffle = async () => {
    if (!design || isShuffling || shuffleCooldown) return

    // Client-side rate limit: 3s cooldown
    const now = Date.now()
    if (now - lastShuffleTime.current < 3000) return

    // Client-side credit check
    if (credits !== null && credits < 1) {
      setShowCreditsModal(true)
      return
    }

    // Client-side variant cap
    if (design.variants.length >= 30) {
      alert('Maximum 30 variants per design reached.')
      return
    }

    setIsShuffling(true)
    lastShuffleTime.current = now
    setShuffleCooldown(true)
    setTimeout(() => setShuffleCooldown(false), 3000)

    try {
      const res = await fetch('/api/designs/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: design.prompt,
          feedback: 'Generate a new unique variation in the same style',
          controls: null,
          designId: id,
          variantCount: design.variants.length,
        }),
      })
      const data = await res.json()

      if (data.insufficientCredits) {
        setCredits(data.balance ?? 0)
        setShowCreditsModal(true)
        return
      }

      if (data.rateLimited) return

      if (data.success && data.variant) {
        const newVariant: DesignVariantData = {
          id: data.variant.id || `var_${Date.now()}`,
          imageUrl: data.variant.imageUrl,
          thumbnailUrl: data.variant.thumbnailUrl || data.variant.imageUrl,
          seed: data.variant.seed || Math.floor(Math.random() * 999999),
          sortOrder: design.variants.length,
        }
        // Cap at 30: remove oldest if needed
        let variants = [...design.variants, newVariant]
        if (variants.length > 30) {
          variants = variants.slice(variants.length - 30)
        }
        const updatedDesign = { ...design, variants }
        setDesign(updatedDesign)
        const newIndex = variants.length - 1
        setSelectedVariantIndex(newIndex)
        saveToDb({ selectedVariantId: newVariant.id, imageUrl: newVariant.imageUrl })

        // Update credits from server response
        if (typeof data.creditsRemaining === 'number') {
          setCredits(data.creditsRemaining)
        } else if (credits !== null) {
          setCredits(credits - 1)
        }
      }
    } catch (err) {
      console.error('Shuffle error:', err)
    } finally {
      setIsShuffling(false)
    }
  }

  const handlePrevVariant = () => {
    if (!design || design.variants.length < 2) return
    const current = selectedVariantIndex ?? 0
    const prev = current > 0 ? current - 1 : design.variants.length - 1
    handleSelectVariant(prev)
  }

  const handleNextVariant = () => {
    if (!design || design.variants.length < 2) return
    const current = selectedVariantIndex ?? 0
    const next = current < design.variants.length - 1 ? current + 1 : 0
    handleSelectVariant(next)
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

  const { addItem, setIsOpen } = useCart()

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
    const sz = getSizeById(sizeId)
    const fr = FRAME_OPTIONS.find(f => f.id === frameId)
    addItem({
      designId: design.id,
      variantId: selectedVariant.id,
      imageUrl: selectedVariant.imageUrl,
      roomImageUrl: design.roomImageUrl || null,
      style: design.style,
      prompt: design.prompt,
      sizeId,
      sizeLabel: sz?.label || sizeId,
      widthCm: sz?.widthCm ?? 50,
      heightCm: sz?.heightCm ?? 70,
      frameId,
      frameLabel: fr?.label || 'Ingen ram',
      frameColor: fr?.color || 'transparent',
      basePriceSEK: pricing.basePriceSEK,
      framePriceSEK: pricing.framePriceSEK,
      totalPriceSEK: pricing.totalPriceSEK,
    })
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
          <div className="flex items-center gap-3">
            {credits !== null && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {credits} credits
              </span>
            )}
            <CreditBadge />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8">
          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="relative">
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
                  onPositionChange={(x, y) => {
                    setPositionX(x); setPositionY(y)
                    // Boris: debounced move feedback
                    if (moveDebounce.current) clearTimeout(moveDebounce.current)
                    moveDebounce.current = setTimeout(() => {
                      if (Math.random() < 0.3) { // 30% chance to comment on moves
                        setBorisMessage(getBorisComment({ type: 'move' }))
                      }
                    }, 1500)
                  }}
                  onScaleChange={setScale}
                  realisticMode={realisticMode}
                />
              ) : selectedVariant ? (
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg">
                  <img src={selectedVariant.imageUrl} alt="Design" className="w-full h-full object-cover" />
                </div>
              ) : null}

              {/* Shuffle overlay */}
              <button
                onClick={handleShuffle}
                disabled={isShuffling || shuffleCooldown}
                className={`absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg transition-all ${
                  isShuffling || shuffleCooldown ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white hover:shadow-xl'
                }`}
              >
                {isShuffling ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isShuffling ? 'Generating...' : shuffleCooldown ? 'Wait...' : 'Shuffle'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">1 cr</span>
              </button>

              {/* Prev / Next navigation */}
              {design.variants.length > 1 && (
                <>
                  <button
                    onClick={handlePrevVariant}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextVariant}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {(selectedVariantIndex ?? 0) + 1} / {design.variants.length}
                  </div>
                </>
              )}
            </div>

            {/* Boris curator voice */}
            <BorisVoice message={borisMessage} className="mt-4" />

            {/* Quality Badge */}
            <div className="mt-3 group relative inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl px-3.5 py-2 cursor-default">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">
                Bilden är AI-optimerad för <span className="font-medium text-gray-700">{pricing.sizeLabel}</span> hos Crimson
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl px-4 py-3 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-40">
                <p className="font-medium mb-1">Boris bildoptimering</p>
                <p className="text-gray-300 leading-relaxed">Bilden har automatiskt rätats upp, avbrusats och skärpeoptimerats. Färgrymd och kontrast är kalibrerade för Crimsons tryckprofil — redo för inramning.</p>
                <div className="absolute -bottom-1 left-6 w-2 h-2 bg-gray-900 transform rotate-45" />
              </div>
            </div>

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
              {(() => {
                const sz = getSizeById(sizeId)
                if (!sz) return null
                const displayW = Math.round(sz.widthCm * scale)
                const displayH = Math.round(sz.heightCm * scale)
                const isScaled = Math.abs(scale - 1.0) > 0.02
                return (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Visad storlek</span>
                      <span className="font-semibold text-gray-900">{displayW} × {displayH} cm</span>
                    </div>
                    {isScaled && (
                      <p className="text-xs text-gray-400 mt-1">Originalstorlek: {sz.widthCm} × {sz.heightCm} cm</p>
                    )}
                  </div>
                )
              })()}
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
              <PublishToggle isPublished={wantPublish} onToggle={handlePublishToggle} />
            </div>

            {wantPublish && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60">
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

            {/* Realistic Mode Toggle */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Smart Light Preview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Glass reflections &amp; room lighting</p>
                </div>
                <button
                  onClick={() => setRealisticMode(prev => prev === undefined ? false : prev === false ? true : false)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    realisticMode === false ? 'bg-gray-300' : 'bg-gray-900'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    realisticMode === false ? 'translate-x-0' : 'translate-x-5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Boris AI Advisor */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <BorisButton
                action="editor"
                variant="inline"
                label="Fråga Boris om råd"
                context={{ sizeCode: sizeId, frameId, style: design?.style }}
                suggestions={[
                  'Vilken ram passar bäst här?',
                  'Är storleken rätt för mitt rum?',
                  'Tips för placering över soffa',
                ]}
              />
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

      {/* Out of credits modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Out of credits</h3>
            <p className="text-sm text-gray-500 mt-2">Each shuffle costs 1 credit. Buy more to keep exploring designs.</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button size="lg" onClick={() => router.push('/wallcraft/checkout?buyCredits=1')}>
                {t('credits.buy')}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreditsModal(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
