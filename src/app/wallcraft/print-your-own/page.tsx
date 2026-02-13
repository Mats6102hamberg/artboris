'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import PrintYourOwn from '@/components/poster/PrintYourOwn'
import RoomUpload from '@/components/poster/RoomUpload'
import WallMarker from '@/components/poster/WallMarker'
import CreditBadge from '@/components/poster/CreditBadge'

const DEMO_ROOM_IMAGE = '/assets/demo/room-sample.svg'

export default function PrintYourOwnPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const [step, setStep] = useState<'upload-art' | 'upload-room' | 'mark-wall'>('upload-art')
  const [artImageUrl, setArtImageUrl] = useState<string | null>(null)
  const [artWidth, setArtWidth] = useState(0)
  const [artHeight, setArtHeight] = useState(0)
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleArtReady = (url: string, w: number, h: number) => {
    setArtImageUrl(url)
    setArtWidth(w)
    setArtHeight(h)
    setStep('upload-room')
  }

  const startWithDemoRoom = () => {
    setRoomImageUrl(DEMO_ROOM_IMAGE)
    setStep('mark-wall')
  }

  const handleRoomUpload = async (localUrl: string, file: File) => {
    setRoomImageUrl(localUrl)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setRoomImageUrl(data.room.imageUrl)
      }
    } catch (err) {
      console.error('Room upload error:', err)
    }
    setStep('mark-wall')
  }

  const handleCreateDesign = async () => {
    if (!artImageUrl || !roomImageUrl) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/designs/create-from-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: artImageUrl,
          roomImageUrl,
          wallCorners: wallCorners.length === 4 ? JSON.stringify(wallCorners) : undefined,
          imageWidth: artWidth,
          imageHeight: artHeight,
        }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      console.error('Create design error:', err)
      alert('Something went wrong')
    } finally {
      setIsCreating(false)
    }
  }

  const stepLabels = ['Your Photo', 'Your Room', 'Mark Wall']
  const stepIndex = step === 'upload-art' ? 0 : step === 'upload-room' ? 1 : 2

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
              {i < 2 && <div className={`w-8 h-px ${i < stepIndex ? 'bg-gray-900' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload artwork */}
        {step === 'upload-art' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">Upload your photo</h2>
              <p className="text-gray-500 mt-2">
                Upload a photo you want to print as wall art. We&apos;ll analyze its quality for different sizes.
              </p>
            </div>
            <PrintYourOwn onImageReady={handleArtReady} />
          </div>
        )}

        {/* Step 2: Upload room */}
        {step === 'upload-room' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">Upload your room</h2>
              <p className="text-gray-500 mt-2">
                Take a photo of the wall where you want to hang your art.
              </p>
            </div>
            <RoomUpload onUpload={handleRoomUpload} />
            <div className="text-center">
              <button onClick={startWithDemoRoom} className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors">
                Use demo room instead
              </button>
            </div>
            <div className="flex justify-start">
              <Button variant="ghost" onClick={() => setStep('upload-art')}>
                ← Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Mark wall */}
        {step === 'mark-wall' && roomImageUrl && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-2xl font-light text-gray-900">Mark your wall</h2>
              <p className="text-gray-500 mt-2">
                Tap the 4 corners of the wall area.
                {wallCorners.length > 0 && wallCorners.length < 4 && (
                  <span className="ml-2 text-gray-900 font-medium">({wallCorners.length}/4 corners)</span>
                )}
                {wallCorners.length === 4 && (
                  <span className="ml-2 text-green-600 font-medium">✓ Wall marked</span>
                )}
              </p>
            </div>
            <WallMarker imageUrl={roomImageUrl} corners={wallCorners} onCornersChange={setWallCorners} />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('upload-room')}>
                ← Back
              </Button>
              <Button
                onClick={handleCreateDesign}
                disabled={wallCorners.length < 4 || isCreating}
                size="lg"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    See it on your wall
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
