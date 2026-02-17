'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import PrintYourOwn from '@/components/poster/PrintYourOwn'
import StylePicker from '@/components/poster/StylePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import { type StylePreset } from '@/types/design'

const STRENGTH_PRESETS = [
  { value: 0.35, label: 'Subtle', description: 'Keeps most of the original photo' },
  { value: 0.55, label: 'Balanced', description: 'Mix of photo and new style' },
  { value: 0.75, label: 'Creative', description: 'Strong artistic transformation' },
  { value: 0.90, label: 'Reimagine', description: 'Almost entirely new artwork' },
]

export default function PhotoTransformPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [step, setStep] = useState<'upload' | 'style'>('upload')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [promptStrength, setPromptStrength] = useState(0.55)
  const [userDescription, setUserDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePhotoReady = (url: string) => {
    setPhotoUrl(url)
    setStep('style')
  }

  const handleGenerate = async () => {
    if (!selectedStyle || !photoUrl) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: selectedStyle,
          userDescription,
          controls: null,
          inputImageUrl: photoUrl,
          promptStrength,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      console.error('Generate error:', err)
      alert('Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const activeStrengthPreset = STRENGTH_PRESETS.find(p => p.value === promptStrength)

  const stepLabels = ['Upload Photo', 'Pick Style']
  const stepIndex = step === 'upload' ? 0 : 1

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <CreditBadge />
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= stepIndex ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < 1 && <div className={`w-8 h-px ${i < stepIndex ? 'bg-gray-900' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload photo */}
        {step === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">Upload your photo</h2>
              <p className="text-gray-500 mt-2">
                Upload a photo you want to transform into a unique artwork using AI.
              </p>
            </div>
            <PrintYourOwn onImageReady={handlePhotoReady} />
          </div>
        )}

        {/* Step 2: Pick style + strength */}
        {step === 'style' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">Choose transformation</h2>
              <p className="text-gray-500 mt-2">
                Pick an art style and how much to transform your photo.
              </p>
            </div>

            {/* Photo preview thumbnail */}
            {photoUrl && (
              <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4">
                <img
                  src={photoUrl}
                  alt="Your photo"
                  className="w-20 h-20 object-cover rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Your photo</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ready for AI transformation</p>
                </div>
                <button
                  onClick={() => { setStep('upload'); setPhotoUrl(null) }}
                  className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
                >
                  Change
                </button>
              </div>
            )}

            {/* Style picker */}
            <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />

            {/* Transformation strength */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Transformation strength
                {activeStrengthPreset && (
                  <span className="ml-2 text-gray-500 font-normal">— {activeStrengthPreset.label}</span>
                )}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {STRENGTH_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setPromptStrength(preset.value)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      promptStrength === preset.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div>{preset.label}</div>
                    <div className={`text-[10px] mt-0.5 ${
                      promptStrength === preset.value ? 'text-gray-300' : 'text-gray-400'
                    }`}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={promptStrength}
                onChange={(e) => setPromptStrength(parseFloat(e.target.value))}
                className="w-full accent-gray-900"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Keep original</span>
                <span>Full reimagine</span>
              </div>
            </div>

            {/* Description */}
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="Optional: describe what you want (e.g. 'make it look like a watercolor painting with warm sunset tones')"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none bg-white"
              rows={3}
            />

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('upload')}>
                &larr; Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedStyle || isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transforming...
                  </>
                ) : (
                  <>
                    Transform photo
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
