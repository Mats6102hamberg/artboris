'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import StylePicker from '@/components/poster/StylePicker'
import { type StylePreset } from '@/types/design'

function CreateFromMotifContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const sourceImageUrl = searchParams.get('from') || ''
  const sourceStyle = (searchParams.get('style') || 'abstract') as StylePreset

  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(sourceStyle)
  const [userDescription, setUserDescription] = useState('')
  const [promptStrength, setPromptStrength] = useState(0.65)
  const [isGenerating, setIsGenerating] = useState(false)

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
          inputImageUrl: sourceImageUrl || undefined,
          promptStrength,
        }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || 'Kunde inte skapa konst just nu. Försök igen!')
        setIsGenerating(false)
      }
    } catch {
      alert('Något gick fel. Försök igen!')
      setIsGenerating(false)
    }
  }

  const handleQuickGenerate = async () => {
    setIsGenerating(true)
    const STYLES: StylePreset[] = [
      'nordic', 'abstract', 'minimal', 'botanical', 'watercolor',
      'japanese', 'art-deco', 'surreal', 'pastel', 'dark-moody',
    ]
    const style = STYLES[Math.floor(Math.random() * STYLES.length)]
    try {
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, controls: null }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || 'Kunde inte skapa konst just nu.')
        setIsGenerating(false)
      }
    } catch {
      alert('Något gick fel.')
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          ← Tillbaka
        </Button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Mode: with source image (img2img) */}
        {sourceImageUrl ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900">Skapa ny konst från motiv</h1>
              <p className="text-gray-500 mt-2">Använd motivet nedan som grund och skapa något nytt</p>
            </div>

            {/* Source preview */}
            <div className="flex justify-center">
              <div className="relative w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-gray-200/60">
                <img src={sourceImageUrl} alt="Originalmotiv" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Original
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt strength slider */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/60">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Hur mycket ska ändras?</h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-16">Lite</span>
                <input
                  type="range"
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  value={promptStrength}
                  onChange={(e) => setPromptStrength(parseFloat(e.target.value))}
                  className="flex-1 accent-purple-600"
                />
                <span className="text-xs text-gray-500 w-16 text-right">Mycket</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {promptStrength < 0.5 ? 'Nära originalet' : promptStrength < 0.7 ? 'Balanserad mix' : 'Mer kreativ frihet'}
              </p>
            </div>

            {/* Style picker */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Välj ny stil</h3>
              <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />
            </div>

            {/* Description */}
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="Beskriv vad du vill ändra (valfritt)..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none bg-white"
              rows={3}
            />

            {/* Generate button */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedStyle || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Skapar ny konst...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Skapa ny konst
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Mode: no source image — quick AI generate with style choice */
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900">Skapa AI-konst</h1>
              <p className="text-gray-500 mt-2">Välj en stil eller låt Boris välja åt dig</p>
            </div>

            {/* Quick generate */}
            <button
              onClick={isGenerating ? undefined : handleQuickGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-left border border-gray-700/40 hover:shadow-2xl hover:shadow-purple-500/10 transition-all relative overflow-hidden group disabled:opacity-70"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/15 via-transparent to-transparent rounded-full blur-3xl" />
              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform flex-shrink-0">
                  {isGenerating ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Boris skapar åt dig</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {isGenerating ? 'Skapar fyra unika motiv...' : 'Klicka — Boris väljer stil och skapar fyra unika AI-motiv'}
                  </p>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">eller välj stil själv</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Style picker */}
            <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />

            {/* Description */}
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="Beskriv vad du vill se (valfritt)..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none bg-white"
              rows={3}
            />

            {/* Generate with chosen style */}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedStyle || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Skapar...
                </>
              ) : (
                <>
                  Skapa med {selectedStyle || '...'}-stil
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <CreateFromMotifContent />
    </Suspense>
  )
}
