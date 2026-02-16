'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import CreditBadge from '@/components/poster/CreditBadge'
import BorisButton from '@/components/boris/BorisButton'
import { refineArtwork } from '@/lib/mandala/refineArtwork'

// ─── Types ───
type LayoutMode = 'horizontal' | 'vertical' | 'grid' | 'centered' | 'floating'
type TextureMode = 'none' | 'subtle' | 'canvas' | 'linen' | 'grain'
type EdgeMode = 'sharp' | 'soft' | 'feathered' | 'painterly'

interface ColorField {
  id: string
  color: string
  weight: number // relative size proportion
}

const PRESET_PALETTES = [
  { name: 'Rothko Warm', colors: ['#8B0000', '#FF4500', '#FFD700', '#FFF8DC'] },
  { name: 'Rothko Cool', colors: ['#191970', '#4169E1', '#87CEEB', '#F0F8FF'] },
  { name: 'Albers', colors: ['#DAA520', '#CD853F', '#F5DEB3', '#FFFFF0'] },
  { name: 'Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD700', '#FFF5EE'] },
  { name: 'Ocean Depth', colors: ['#001F3F', '#003366', '#006994', '#40E0D0'] },
  { name: 'Earth', colors: ['#3E2723', '#795548', '#BCAAA4', '#EFEBE9'] },
  { name: 'Nordic', colors: ['#2C3E50', '#7F8C8D', '#BDC3C7', '#ECF0F1'] },
  { name: 'Sage', colors: ['#2D6A4F', '#52B788', '#95D5B2', '#D8F3DC'] },
  { name: 'Blush', colors: ['#6D2B3D', '#C77B8B', '#F2D0D9', '#FFF0F3'] },
  { name: 'Monochrome', colors: ['#1A1A1A', '#4A4A4A', '#8A8A8A', '#D0D0D0'] },
  { name: 'Dusk', colors: ['#2C1654', '#7B2D8E', '#C77DFF', '#F3D5FF'] },
  { name: 'Terracotta', colors: ['#8B4513', '#CD853F', '#DEB887', '#FAEBD7'] },
]

const BACKGROUNDS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Cream', value: '#FAFAF8' },
  { name: 'Warm Gray', value: '#E8E4DF' },
  { name: 'Cool Gray', value: '#E0E5EC' },
  { name: 'Black', value: '#111111' },
  { name: 'Navy', value: '#0A1628' },
]

let fieldIdCounter = 0
const newFieldId = () => `field-${++fieldIdCounter}-${Date.now()}`

export default function ColorFieldPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [fields, setFields] = useState<ColorField[]>([
    { id: newFieldId(), color: '#8B0000', weight: 3 },
    { id: newFieldId(), color: '#FF4500', weight: 2 },
    { id: newFieldId(), color: '#FFD700', weight: 1.5 },
    { id: newFieldId(), color: '#FFF8DC', weight: 1 },
  ])
  const [layout, setLayout] = useState<LayoutMode>('horizontal')
  const [texture, setTexture] = useState<TextureMode>('subtle')
  const [edge, setEdge] = useState<EdgeMode>('soft')
  const [bgColor, setBgColor] = useState('#FAFAF8')
  const [padding, setPadding] = useState(40)
  const [gap, setGap] = useState(4)
  const [borderRadius, setBorderRadius] = useState(0)
  const [canvasSize, setCanvasSize] = useState(600)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)

  // Refine state
  const [isRefining, setIsRefining] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [originalDataUrl, setOriginalDataUrl] = useState('')
  const [refinedDataUrl, setRefinedDataUrl] = useState('')
  const [refinedImageData, setRefinedImageData] = useState<ImageData | null>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDraggingSlider = useRef(false)

  // Responsive
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth
      if (w < 640) setCanvasSize(Math.min(w - 32, 400))
      else if (w < 1024) setCanvasSize(500)
      else setCanvasSize(600)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Render composition
  const renderComposition = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    if (fields.length === 0) return

    const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
    const pad = padding
    const g = gap
    const inner = canvasSize - pad * 2

    const drawField = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.save()

      // Edge softness
      if (edge === 'feathered' || edge === 'painterly') {
        // Draw multiple slightly offset rectangles for painterly effect
        const passes = edge === 'painterly' ? 8 : 4
        for (let i = passes; i >= 0; i--) {
          const spread = i * (edge === 'painterly' ? 3 : 2)
          ctx.globalAlpha = 1 / (passes + 1)
          ctx.fillStyle = color
          if (borderRadius > 0) {
            roundRect(ctx, x - spread, y - spread, w + spread * 2, h + spread * 2, borderRadius + spread)
          } else {
            ctx.fillRect(x - spread, y - spread, w + spread * 2, h + spread * 2)
          }
        }
        ctx.globalAlpha = 1
      }

      // Main fill
      ctx.fillStyle = color
      ctx.globalAlpha = edge === 'soft' ? 0.92 : 1
      if (borderRadius > 0) {
        roundRect(ctx, x, y, w, h, borderRadius)
      } else {
        ctx.fillRect(x, y, w, h)
      }
      ctx.globalAlpha = 1

      // Texture overlay
      if (texture !== 'none') {
        applyTexture(ctx, x, y, w, h, texture)
      }

      ctx.restore()
    }

    if (layout === 'horizontal') {
      let currentY = pad
      fields.forEach((f, i) => {
        const h = (f.weight / totalWeight) * (inner - g * (fields.length - 1))
        drawField(pad, currentY, inner, h, f.color)
        currentY += h + g
      })
    } else if (layout === 'vertical') {
      let currentX = pad
      fields.forEach((f, i) => {
        const w = (f.weight / totalWeight) * (inner - g * (fields.length - 1))
        drawField(currentX, pad, w, inner, f.color)
        currentX += w + g
      })
    } else if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(fields.length))
      const rows = Math.ceil(fields.length / cols)
      const cellW = (inner - g * (cols - 1)) / cols
      const cellH = (inner - g * (rows - 1)) / rows
      fields.forEach((f, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        drawField(pad + col * (cellW + g), pad + row * (cellH + g), cellW, cellH, f.color)
      })
    } else if (layout === 'centered') {
      // Nested rectangles, centered
      const maxSize = inner * 0.9
      fields.forEach((f, i) => {
        const ratio = 1 - (i / fields.length) * 0.7
        const w = maxSize * ratio
        const h = maxSize * ratio * 0.7
        const x = (canvasSize - w) / 2
        const y = (canvasSize - h) / 2
        drawField(x, y, w, h, f.color)
      })
    } else if (layout === 'floating') {
      // Overlapping rectangles with slight offsets
      const baseW = inner * 0.6
      const baseH = inner * 0.4
      fields.forEach((f, i) => {
        const offsetX = pad + (i * inner * 0.12)
        const offsetY = pad + (i * inner * 0.15)
        const w = baseW - i * 20
        const h = baseH + i * 10
        drawField(offsetX, offsetY, w, h, f.color)
      })
    }
  }, [fields, layout, texture, edge, bgColor, padding, gap, borderRadius, canvasSize])

  useEffect(() => {
    renderComposition()
  }, [renderComposition])

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
  }

  const applyTexture = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mode: TextureMode) => {
    const intensity = mode === 'subtle' ? 0.03 : mode === 'canvas' ? 0.06 : mode === 'linen' ? 0.05 : 0.08

    ctx.save()
    ctx.globalCompositeOperation = 'overlay'

    if (mode === 'grain') {
      // Random noise
      for (let py = y; py < y + h; py += 3) {
        for (let px = x; px < x + w; px += 3) {
          const v = Math.random() > 0.5 ? 255 : 0
          ctx.fillStyle = `rgba(${v},${v},${v},${intensity})`
          ctx.fillRect(px, py, 3, 3)
        }
      }
    } else if (mode === 'linen') {
      // Horizontal lines
      for (let py = y; py < y + h; py += 2) {
        ctx.fillStyle = `rgba(0,0,0,${intensity * (py % 4 === 0 ? 1 : 0.5)})`
        ctx.fillRect(x, py, w, 1)
      }
    } else {
      // Canvas / subtle — scattered dots
      for (let py = y; py < y + h; py += 4) {
        for (let px = x; px < x + w; px += 4) {
          if (Math.random() > 0.6) {
            const v = Math.random() > 0.5 ? 255 : 0
            ctx.fillStyle = `rgba(${v},${v},${v},${intensity})`
            ctx.fillRect(px, py, 2, 2)
          }
        }
      }
    }

    ctx.restore()
  }

  // ─── Field management ───
  const addField = () => {
    const hue = Math.floor(Math.random() * 360)
    setFields((prev) => [...prev, { id: newFieldId(), color: `hsl(${hue}, 50%, 50%)`, weight: 1 }])
  }

  const removeField = (id: string) => {
    if (fields.length <= 1) return
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedField === id) setSelectedField(null)
  }

  const updateFieldColor = (id: string, color: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, color } : f))
  }

  const updateFieldWeight = (id: string, weight: number) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, weight } : f))
  }

  const applyPreset = (presetIndex: number) => {
    const preset = PRESET_PALETTES[presetIndex]
    setFields(preset.colors.map((c, i) => ({
      id: newFieldId(),
      color: c,
      weight: preset.colors.length - i * 0.3,
    })))
  }

  const shuffleColors = () => {
    setFields((prev) => {
      const colors = prev.map((f) => f.color)
      for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colors[i], colors[j]] = [colors[j], colors[i]]
      }
      return prev.map((f, i) => ({ ...f, color: colors[i] }))
    })
  }

  // ─── Refine ───
  const imageDataToDataUrl = (imgData: ImageData): string => {
    const tmp = document.createElement('canvas')
    tmp.width = imgData.width; tmp.height = imgData.height
    const c = tmp.getContext('2d')
    if (!c) return ''
    c.putImageData(imgData, 0, 0)
    return tmp.toDataURL('image/png')
  }

  const handleRefine = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const original = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setOriginalDataUrl(imageDataToDataUrl(original))
    setIsRefining(true)
    await new Promise((r) => setTimeout(r, 50))
    const refined = refineArtwork(original, { smoothingPasses: 2, contrastAmount: 0.06, vibranceAmount: 0.06, depthGlowIntensity: 0.04 })
    setRefinedImageData(refined)
    setRefinedDataUrl(imageDataToDataUrl(refined))
    await new Promise((r) => setTimeout(r, 1200))
    setIsRefining(false)
    setSliderPosition(50)
    setShowComparison(true)
  }

  const handleUseRefined = () => {
    const canvas = canvasRef.current
    if (!canvas || !refinedImageData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(refinedImageData, 0, 0)
    setShowComparison(false)
    setRefinedImageData(null)
  }

  const handleKeepOriginal = () => {
    setShowComparison(false)
    setRefinedImageData(null)
  }

  const handleSliderDrag = (clientX: number) => {
    const container = sliderRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setSliderPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }

  // ─── Export ───
  const handleSaveAsDesign = async () => {
    setIsSaving(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('No canvas')
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      if (!blob) throw new Error('Canvas export failed')
      const formData = new FormData()
      formData.append('file', blob, 'colorfield.png')
      const uploadRes = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error('Upload failed')
      const imageUrl = uploadData.room?.imageUrl || ''
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: 'minimalist', controls: null, userDescription: 'Color field composition' }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        await fetch(`/api/designs/${data.designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, title: 'Color Field Composition' }),
        })
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert('Could not save design. Try again.')
      }
    } catch (err) {
      console.error('Save colorfield error:', err)
      alert('Could not save. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'color-field.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/wallcraft')} className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold tracking-widest uppercase text-gray-900">
              Color Field Studio
            </span>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{ width: canvasSize, height: canvasSize }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: canvasSize, height: canvasSize }}
              />
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 mt-4">
              <button onClick={shuffleColors} className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all" title="Shuffle colors">
                🔀 Shuffle
              </button>
              <button onClick={addField} className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all">
                + Add Field
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            {/* Presets */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Presets</h3>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_PALETTES.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(i)}
                    className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="flex w-full h-5 rounded overflow-hidden">
                      {p.colors.map((c, j) => (
                        <div key={j} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 group-hover:text-gray-600">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color fields */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fields</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                      selectedField === f.id ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedField(selectedField === f.id ? null : f.id)}
                  >
                    <input
                      type="color"
                      value={f.color}
                      onChange={(e) => updateFieldColor(f.id, e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={f.weight}
                        onChange={(e) => updateFieldWeight(f.id, parseFloat(e.target.value))}
                        className="w-full accent-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 w-6 text-right">{f.weight}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeField(f.id) }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      disabled={fields.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Layout</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {(['horizontal', 'vertical', 'grid', 'centered', 'floating'] as LayoutMode[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`py-2 rounded-lg text-[10px] font-medium capitalize transition-all ${
                      layout === l ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Texture */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Texture</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {(['none', 'subtle', 'canvas', 'linen', 'grain'] as TextureMode[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTexture(t)}
                    className={`py-2 rounded-lg text-[10px] font-medium capitalize transition-all ${
                      texture === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Edges</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {(['sharp', 'soft', 'feathered', 'painterly'] as EdgeMode[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEdge(e)}
                    className={`py-2 rounded-lg text-[10px] font-medium capitalize transition-all ${
                      edge === e ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing controls */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60 space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Padding: {padding}px</h3>
                <input type="range" min="0" max="100" step="5" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} className="w-full accent-gray-900" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gap: {gap}px</h3>
                <input type="range" min="0" max="30" step="1" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} className="w-full accent-gray-900" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Corners: {borderRadius}px</h3>
                <input type="range" min="0" max="40" step="2" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} className="w-full accent-gray-900" />
              </div>
            </div>

            {/* Background */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Background</h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button key={bg.value} onClick={() => setBgColor(bg.value)}
                    className={`w-9 h-9 rounded-lg border transition-all ${bgColor === bg.value ? 'ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200 hover:scale-105'}`}
                    style={{ backgroundColor: bg.value }} title={bg.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={handleRefine} disabled={isRefining}
                className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200/80 bg-gradient-to-r from-gray-50 to-white text-gray-700 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Refine
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <Button size="lg" onClick={handleSaveAsDesign} disabled={isSaving} className="w-full">
                {isSaving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>) : '🖼️ Use as Wall Art'}
              </Button>
              <Button variant="secondary" onClick={downloadPng} className="w-full">↓ Download PNG</Button>
            </div>
          </div>
        </div>
      </main>

      {/* Refining overlay */}
      {isRefining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-gray-300/40 border-t-gray-600 animate-spin" />
            <p className="text-lg font-light text-gray-700 tracking-wide">Refining...</p>
          </div>
        </div>
      )}

      {/* Before / After comparison */}
      {showComparison && originalDataUrl && refinedDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-[95vw] mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">Compare</h3>
              <p className="text-xs text-gray-400 text-center mt-1">Drag the slider to compare</p>
            </div>
            <div className="px-6">
              <div ref={sliderRef} className="relative w-full aspect-square rounded-xl overflow-hidden cursor-col-resize select-none"
                onMouseDown={() => { isDraggingSlider.current = true }}
                onMouseMove={(e) => { if (isDraggingSlider.current) handleSliderDrag(e.clientX) }}
                onMouseUp={() => { isDraggingSlider.current = false }}
                onMouseLeave={() => { isDraggingSlider.current = false }}
                onTouchStart={() => { isDraggingSlider.current = true }}
                onTouchMove={(e) => { if (isDraggingSlider.current) handleSliderDrag(e.touches[0].clientX) }}
                onTouchEnd={() => { isDraggingSlider.current = false }}>
                <img src={refinedDataUrl} alt="Refined" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                  <img src={originalDataUrl} alt="Original" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${sliderRef.current?.offsetWidth || 600}px` }} draggable={false} />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                </div>
                <span className="absolute top-3 left-3 text-[10px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">Original</span>
                <span className="absolute top-3 right-3 text-[10px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">Refined</span>
              </div>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button onClick={handleKeepOriginal} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">Keep Original</button>
              <button onClick={handleUseRefined} className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all">Use Refined</button>
            </div>
          </div>
        </div>
      )}

      {/* Boris AI Advisor */}
      <BorisButton
        action="chat"
        suggestions={[
          'Vilka färgkombinationer skapar harmoni?',
          'Hur använder jag Rothko-stil effektivt?',
          'Tips för minimalistisk färgkomposition',
        ]}
      />
    </div>
  )
}
