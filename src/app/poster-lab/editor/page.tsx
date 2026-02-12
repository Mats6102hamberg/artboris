'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import MockupPreview from '@/components/poster/MockupPreview'
import FramePicker from '@/components/poster/FramePicker'
import SizePicker from '@/components/poster/SizePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import PublishToggle from '@/components/poster/PublishToggle'
import { calculatePrintPrice, formatSEK } from '@/lib/pricing/prints'

export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const designId = searchParams.get('designId') || ''
  const variantId = searchParams.get('variantId') || ''
  const designImageUrl = searchParams.get('designImageUrl') || ''
  const roomImageUrl = searchParams.get('roomImageUrl') || ''
  const wallCornersRaw = searchParams.get('wallCorners') || '[]'
  const style = searchParams.get('style') || 'minimal'
  const prompt = searchParams.get('prompt') || ''
  const seed = parseInt(searchParams.get('seed') || '0')

  let wallCorners: { x: number; y: number }[] = []
  try {
    wallCorners = JSON.parse(wallCornersRaw)
  } catch {}

  const [frameId, setFrameId] = useState('black')
  const [sizeId, setSizeId] = useState('50x70')
  const [positionX, setPositionX] = useState(0.5)
  const [positionY, setPositionY] = useState(0.4)
  const [scale, setScale] = useState(1.0)
  const [wantPublish, setWantPublish] = useState(false)


  const pricing = calculatePrintPrice(sizeId, frameId)

  const handleCheckout = () => {
    const params = new URLSearchParams({
      designId,
      variantId,
      designImageUrl,
      roomImageUrl,
      frameId,
      sizeId,
      style,
      prompt,
      seed: String(seed),
      publish: wantPublish ? '1' : '0',
      totalSEK: String(pricing.totalPriceSEK),
      creditsNeeded: String(pricing.creditsNeeded),
    })
    router.push(`/poster-lab/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
              &larr;
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Redigera & Placera</h1>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8">
          {/* Preview — large */}
          <div className="lg:col-span-3">
            {roomImageUrl && designImageUrl ? (
              <MockupPreview
                roomImageUrl={roomImageUrl}
                designImageUrl={designImageUrl}
                wallCorners={wallCorners}
                frameId={frameId}
                sizeId={sizeId}
                positionX={positionX}
                positionY={positionY}
                scale={scale}
                onPositionChange={(x, y) => { setPositionX(x); setPositionY(y) }}
                onScaleChange={setScale}
              />
            ) : (
              <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400">Ingen förhandsvisning tillgänglig</p>
              </div>
            )}

            {/* Position controls */}
            <div className="mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Placering på väggen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Horisontell</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={positionX * 100}
                    onChange={(e) => setPositionX(parseInt(e.target.value) / 100)}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vertikal</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={positionY * 100}
                    onChange={(e) => setPositionY(parseInt(e.target.value) / 100)}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Storlek: {Math.round(scale * 100)}%</label>
                  <input
                    type="range"
                    min={30}
                    max={200}
                    value={scale * 100}
                    onChange={(e) => setScale(parseInt(e.target.value) / 100)}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
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
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Credits för slutrender</span>
                  <span>{pricing.creditsNeeded} credits</span>
                </div>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <PublishToggle isPublished={wantPublish} onToggle={setWantPublish} />
            </div>

            {/* Checkout button — desktop */}
            <button
              onClick={handleCheckout}
              className="hidden lg:block w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg shadow-lg shadow-green-200"
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
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-green-200"
        >
          Gå till kassan — {formatSEK(pricing.totalPriceSEK)}
        </button>
      </div>
    </div>
  )
}
