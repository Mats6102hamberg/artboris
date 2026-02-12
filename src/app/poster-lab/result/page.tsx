'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import VariantsGrid from '@/components/poster/VariantsGrid'
import ControlsPanel from '@/components/poster/ControlsPanel'
import CreditBadge from '@/components/poster/CreditBadge'
import { DesignControls, StylePreset } from '@/types/design'
import { STYLE_DEFINITIONS } from '@/lib/prompts/styles'

interface Variant {
  id: string
  imageUrl: string
  thumbnailUrl: string
  isSelected: boolean
  seed: number
}

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const designId = searchParams.get('designId') || ''
  const roomImageUrl = searchParams.get('roomImageUrl') || ''
  const wallCornersRaw = searchParams.get('wallCorners') || '[]'
  const style = (searchParams.get('style') || 'minimal') as StylePreset
  const prompt = searchParams.get('prompt') || ''
  const variantsRaw = searchParams.get('variants') || '[]'

  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isRefining, setIsRefining] = useState(false)


  const styleDef = STYLE_DEFINITIONS[style]

  const [controls, setControls] = useState<DesignControls>({
    colorPalette: styleDef?.defaultColors || [],
    mood: styleDef?.defaultMood || 'calm',
    contrast: 50,
    brightness: 50,
    saturation: 50,
    zoom: 100,
    textOverlay: '',
    textFont: 'sans-serif',
    textPosition: 'none',
  })

  useEffect(() => {
    try {
      const parsed = JSON.parse(variantsRaw)
      if (Array.isArray(parsed)) {
        setVariants(parsed)
      }
    } catch {
      console.error('Could not parse variants')
    }
  }, [variantsRaw])

  const handleRefine = async () => {
    if (selectedIndex === null) return
    setIsRefining(true)

    try {
      const res = await fetch('/api/designs/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          feedback: `Based on variant ${selectedIndex + 1}, refine with updated settings.`,
          controls,
        }),
      })

      const data = await res.json()
      if (data.success && data.variant) {
        setVariants(prev => [...prev, data.variant])
        setSelectedIndex(variants.length)
      }
    } catch (err) {
      console.error('Refine error:', err)
    } finally {
      setIsRefining(false)
    }
  }

  const handleContinueToEditor = async () => {
    if (selectedIndex === null) return
    const selected = variants[selectedIndex]
    if (!selected) return

    // If we have a real DB designId, save selection and go to persistent design page
    if (designId && !designId.startsWith('design_')) {
      try {
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedVariantId: selected.id,
            imageUrl: selected.imageUrl,
          }),
        })
      } catch (err) {
        console.error('Save selection error:', err)
      }
      router.push(`/poster-lab/design/${designId}`)
      return
    }

    // Fallback to old editor for non-persisted designs
    const params = new URLSearchParams({
      designId,
      variantId: selected.id,
      designImageUrl: selected.imageUrl,
      roomImageUrl,
      wallCorners: wallCornersRaw,
      style,
      prompt,
      seed: String(selected.seed || 0),
    })
    router.push(`/poster-lab/editor?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
              &larr; Tillbaka
            </button>
            <h1 className="text-xl font-bold text-gray-900">Välj favorit</h1>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Variants */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dina förslag</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Välj den variant du gillar bäst, eller förfina med kontrollerna</p>
            </div>
            <VariantsGrid
              variants={variants}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              controls={controls}
            />
          </div>

          {/* Controls sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100">
              <ControlsPanel
                controls={controls}
                onChange={setControls}
                onRefine={handleRefine}
                isRefining={isRefining}
              />
            </div>

            <button
              onClick={handleContinueToEditor}
              disabled={selectedIndex === null}
              className="hidden lg:block w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-200 text-lg"
            >
              {selectedIndex !== null ? 'Gå till editorn →' : 'Välj en variant först'}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200 lg:hidden z-20">
        <button
          onClick={handleContinueToEditor}
          disabled={selectedIndex === null}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-200 text-base"
        >
          {selectedIndex !== null ? 'Gå till editorn →' : 'Välj en variant först'}
        </button>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  )
}
