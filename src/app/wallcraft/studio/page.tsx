'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import RoomUpload from '@/components/poster/RoomUpload'
import WallMarker from '@/components/poster/WallMarker'
import StylePicker from '@/components/poster/StylePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import PrintYourOwn from '@/components/poster/PrintYourOwn'
import { type StylePreset } from '@/types/design'
import { useTelemetry } from '@/hooks/useTelemetry'

import { DEMO_ROOM_IMAGE, DEMO_WALL_CORNERS } from '@/lib/demo/demoImages'

export default function StudioPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [step, setStep] = useState<'upload' | 'mark-wall' | 'pick-style'>('upload')
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<'ai' | 'upload'>('ai')
  const [uploadedArtUrl, setUploadedArtUrl] = useState<string | null>(null)
  const [isCreatingUpload, setIsCreatingUpload] = useState(false)
  const { funnel, track } = useTelemetry()

  const startWithDemo = () => {
    setRoomImageUrl(DEMO_ROOM_IMAGE)
    setRoomId('demo-room')
    setWallCorners(DEMO_WALL_CORNERS)
    setStep('pick-style')
  }

  const handleRoomUpload = async (localUrl: string, file: File) => {
    setRoomImageUrl(localUrl)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setRoomId(data.room.id)
        setRoomImageUrl(data.room.imageUrl)
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    funnel('UPLOAD_ROOM')
    setStep('mark-wall')
  }

  const handleGenerate = async () => {
    if (!selectedStyle) return
    funnel('GENERATE_ART', { style: selectedStyle })
    setIsGenerating(true)
    try {
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: selectedStyle,
          userDescription,
          controls: null,
          roomImageUrl: roomImageUrl || undefined,
          wallCorners: wallCorners.length === 4 ? JSON.stringify(wallCorners) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || t('common.error'))
      }
    } catch (err) {
      console.error('Generate error:', err)
      alert(t('common.error'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOwnArtwork = async (imageUrl: string) => {
    track('UPLOAD_OWN_ARTWORK')
    setUploadedArtUrl(imageUrl)
    setIsCreatingUpload(true)
    try {
      const res = await fetch('/api/designs/create-from-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          roomImageUrl: roomImageUrl || undefined,
          wallCorners: wallCorners.length === 4 ? JSON.stringify(wallCorners) : undefined,
          customTitle: 'My Artwork',
          customStyle: 'user-upload',
        }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || t('common.error'))
      }
    } catch (err) {
      console.error('Upload artwork error:', err)
      alert(t('common.error'))
    } finally {
      setIsCreatingUpload(false)
    }
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {['upload', 'mark-wall', 'pick-style'].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step === s ? 'bg-gray-900 text-white' : i < ['upload', 'mark-wall', 'pick-style'].indexOf(step) ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {i + 1}
          </div>
          {i < 2 && <div className={`w-8 h-px ${i < ['upload', 'mark-wall', 'pick-style'].indexOf(step) ? 'bg-gray-900' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <CreditBadge />
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {stepIndicator}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">{t('studio.upload.title')}</h2>
              <p className="text-gray-500 mt-2">{t('studio.upload.description')}</p>
            </div>
            <RoomUpload onUpload={handleRoomUpload} />
            <div className="text-center">
              <button onClick={startWithDemo} className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors">
                {t('studio.upload.useDemo')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mark wall */}
        {step === 'mark-wall' && roomImageUrl && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">{t('studio.wallMarker.title')}</h2>
              <p className="text-gray-500 mt-2">
                {t('studio.wallMarker.description')}
                {wallCorners.length > 0 && wallCorners.length < 4 && (
                  <span className="ml-2 text-gray-900 font-medium">({wallCorners.length}/4 {t('studio.wallMarker.corners')})</span>
                )}
                {wallCorners.length === 4 && (
                  <span className="ml-2 text-green-600 font-medium">{t('studio.wallMarker.done')}</span>
                )}
              </p>
            </div>
            <WallMarker imageUrl={roomImageUrl} corners={wallCorners} onCornersChange={setWallCorners} />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('upload')}>
                ← {t('common.back')}
              </Button>
              <Button
                onClick={() => setStep('pick-style')}
                disabled={wallCorners.length < 4}
              >
                {t('common.next')} →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pick style or upload own artwork */}
        {step === 'pick-style' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Mode toggle */}
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setMode('ai')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mode === 'ai'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✨ AI-generera
                </button>
                <button
                  onClick={() => setMode('upload')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mode === 'upload'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📷 Eget verk
                </button>
              </div>
            </div>

            {mode === 'ai' ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-light text-gray-900">{t('studio.style.title')}</h2>
                  <p className="text-gray-500 mt-2">{t('studio.style.description')}</p>
                </div>
                <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />
                <textarea
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder={t('studio.style.descriptionPlaceholder')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none bg-white"
                  rows={3}
                />
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep('mark-wall')}>
                    ← {t('common.back')}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedStyle || isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('studio.style.generating')}
                      </>
                    ) : (
                      <>
                        {t('studio.style.generate')}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </Button>
                </div>

                {/* AI notice for visitors (Nivå 2 + Extra) */}
                <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg px-4 py-3 mt-2 space-y-1.5">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {t('legal.studioNotice') !== 'legal.studioNotice'
                      ? t('legal.studioNotice')
                      : 'AI-generated designs are created within the ArtBoris studio and are sold as physical prints for personal use. ArtBoris may display these designs in its gallery.'}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {t('legal.studioConsent') !== 'legal.studioConsent'
                      ? t('legal.studioConsent')
                      : <>By generating a design you agree to our <a href="/terms" target="_blank" className="underline underline-offset-2 hover:text-gray-600">terms</a>.</>}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-light text-gray-900">Ladda upp ditt verk</h2>
                  <p className="text-gray-500 mt-2">
                    Ladda upp en bild på ditt konstverk, foto eller illustration. Vi visar det på din vägg.
                  </p>
                </div>
                <PrintYourOwn onImageReady={(url) => handleOwnArtwork(url)} />
                {isCreatingUpload && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Skapar design...</span>
                  </div>
                )}
                <div className="flex justify-start">
                  <Button variant="ghost" onClick={() => setStep('mark-wall')}>
                    ← {t('common.back')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
