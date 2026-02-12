'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoomUpload from '@/components/poster/RoomUpload'
import WallMarker from '@/components/poster/WallMarker'
import StylePicker from '@/components/poster/StylePicker'
import CreditBadge from '@/components/poster/CreditBadge'
import { StylePreset, DesignControls } from '@/types/design'

const DEMO_ROOM_IMAGE = '/assets/demo/room-sample.svg'

export default function PosterLabPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'mark-wall' | 'pick-style'>('upload')
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [wallCorners, setWallCorners] = useState<{ x: number; y: number }[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [credits] = useState(30)

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

    setStep('mark-wall')
  }

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
        }),
      })

      const data = await res.json()
      if (data.success) {
        const params = new URLSearchParams({
          designId: data.designId,
          roomImageUrl: roomImageUrl || '',
          wallCorners: JSON.stringify(wallCorners),
          style: selectedStyle,
          prompt: data.prompt,
          variants: JSON.stringify(data.variants),
        })
        router.push(`/poster-lab/result?${params.toString()}`)
      } else {
        alert(data.error || 'Generering misslyckades.')
      }
    } catch (err) {
      console.error('Generate error:', err)
      alert('Något gick fel vid generering.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Tillbaka</a>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Poster Lab
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/poster-lab/gallery" className="text-sm text-gray-600 hover:text-gray-900">Galleri</a>
            <CreditBadge balance={credits} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { key: 'upload', label: '1. Ladda upp rum' },
            { key: 'mark-wall', label: '2. Markera vägg' },
            { key: 'pick-style', label: '3. Välj stil' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-300" />}
              <div
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${step === s.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : s.key === 'upload' || (s.key === 'mark-wall' && roomImageUrl) || (s.key === 'pick-style' && wallCorners.length === 4)
                      ? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
                onClick={() => {
                  if (s.key === 'upload') setStep('upload')
                  if (s.key === 'mark-wall' && roomImageUrl) setStep('mark-wall')
                  if (s.key === 'pick-style' && wallCorners.length === 4) setStep('pick-style')
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Skapa din poster</h2>
              <p className="text-gray-600 mt-2">Börja med att ladda upp ett foto av rummet där postern ska hänga</p>
            </div>
            <RoomUpload onUpload={handleRoomUpload} />

            <div className="text-center">
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-gray-300 w-full" />
                <span className="bg-gradient-to-br from-gray-50 to-blue-50 px-4 text-sm text-gray-400 absolute">eller</span>
              </div>
              <button
                onClick={() => {
                  setRoomImageUrl(DEMO_ROOM_IMAGE)
                  setRoomId('demo-room')
                  setStep('mark-wall')
                }}
                className="px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all font-medium"
              >
                Testa med demo-rum
              </button>
              <p className="text-xs text-gray-400 mt-2">Inget eget foto? Prova med vårt exempelrum</p>
            </div>
          </div>
        )}

        {/* Step 2: Mark wall */}
        {step === 'mark-wall' && roomImageUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Markera väggen</h2>
              <p className="text-gray-600 mt-2">Klicka på bilden för att markera de 4 hörnen av väggytan</p>
            </div>
            <WallMarker
              imageUrl={roomImageUrl}
              corners={wallCorners}
              onCornersChange={setWallCorners}
            />
            <div className="flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                &larr; Byt rum
              </button>
              <button
                onClick={() => setStep('pick-style')}
                disabled={wallCorners.length < 4}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Nästa &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pick style */}
        {step === 'pick-style' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Välj stil</h2>
              <p className="text-gray-600 mt-2">Vilken känsla vill du ha?</p>
            </div>

            <StylePicker selectedStyle={selectedStyle} onSelect={setSelectedStyle} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beskriv din vision (valfritt)
              </label>
              <textarea
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                placeholder="T.ex. 'En lugn strandscen i pastellfärger' eller 'Abstrakt med guld och marinblått'..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={500}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('mark-wall')}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                &larr; Tillbaka
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedStyle || isGenerating}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-200"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Genererar 4 förslag...
                  </span>
                ) : (
                  'Generera 4 förslag (2 credits)'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
