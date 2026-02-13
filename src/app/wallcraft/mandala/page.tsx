'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import CreditBadge from '@/components/poster/CreditBadge'

// ─── Types ───
type Tool = 'brush' | 'eraser'
type SymmetryMode = 4 | 6 | 8 | 12 | 16

interface HistoryEntry {
  imageData: ImageData
}

const COLOR_PALETTES = [
  { name: 'Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD700', '#FF4500', '#DC143C', '#FF69B4'] },
  { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#023E8A', '#48CAE4', '#CAF0F8'] },
  { name: 'Forest', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'] },
  { name: 'Cosmic', colors: ['#7B2CBF', '#9D4EDD', '#C77DFF', '#E0AAFF', '#3C096C', '#5A189A'] },
  { name: 'Earth', colors: ['#6B4226', '#A0522D', '#CD853F', '#DEB887', '#D2691E', '#8B4513'] },
  { name: 'Monochrome', colors: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'] },
  { name: 'Gold', colors: ['#FFD700', '#DAA520', '#B8860B', '#F0E68C', '#EEE8AA', '#BDB76B'] },
  { name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#39FF14', '#FF6EC7', '#FFFF00', '#FF3F00'] },
]

const BACKGROUNDS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Cream', value: '#FAFAF8' },
  { name: 'Black', value: '#111111' },
  { name: 'Navy', value: '#0A1628' },
  { name: 'Warm Gray', value: '#E8E4DF' },
  { name: 'Sage', value: '#D4DBC8' },
]

const BRUSH_SIZES = [2, 4, 8, 14, 22, 36]

export default function MandalaPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#FF6B6B')
  const [brushSize, setBrushSize] = useState(4)
  const [symmetry, setSymmetry] = useState<SymmetryMode>(8)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [activePalette, setActivePalette] = useState(0)
  const [showGuides, setShowGuides] = useState(true)
  const [opacity, setOpacity] = useState(1)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [canvasSize, setCanvasSize] = useState(600)

  // Responsive canvas size
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

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasSize, canvasSize)
    saveHistory()
  }, [canvasSize])

  // Draw guide lines on overlay
  useEffect(() => {
    const overlay = overlayCanvasRef.current
    if (!overlay) return
    overlay.width = canvasSize
    overlay.height = canvasSize
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    if (!showGuides) return

    const cx = canvasSize / 2
    const cy = canvasSize / 2
    const r = canvasSize / 2 - 4

    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1

    // Radial lines
    for (let i = 0; i < symmetry; i++) {
      const angle = (i * 2 * Math.PI) / symmetry
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      ctx.stroke()
    }

    // Concentric circles
    const circles = [0.15, 0.3, 0.5, 0.7, 0.9]
    circles.forEach((ratio) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Center dot
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [symmetry, showGuides, canvasSize])

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ imageData })
      if (newHistory.length > 50) newHistory.shift()
      return newHistory
    })
    setHistoryIndex((prev) => Math.min(prev + 1, 49))
  }, [historyIndex])

  const undo = () => {
    if (historyIndex <= 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newIndex = historyIndex - 1
    ctx.putImageData(history[newIndex].imageData, 0, 0)
    setHistoryIndex(newIndex)
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newIndex = historyIndex + 1
    ctx.putImageData(history[newIndex].imageData, 0, 0)
    setHistoryIndex(newIndex)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveHistory()
  }

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const drawSymmetric = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    for (let i = 0; i < symmetry; i++) {
      const angle = (i * 2 * Math.PI) / symmetry

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)

      // Draw original stroke
      drawLine(ctx, x1 - cx, y1 - cy, x2 - cx, y2 - cy)

      // Mirror stroke for each segment
      ctx.scale(1, -1)
      drawLine(ctx, x1 - cx, y1 - cy, x2 - cx, y2 - cy)

      ctx.restore()
    }
  }

  const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = tool === 'eraser' ? bgColor : color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = tool === 'eraser' ? 1 : opacity
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = true
    const point = getCanvasPoint(e)
    if (point) lastPoint.current = point
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPoint.current) return
    const point = getCanvasPoint(e)
    if (!point) return

    drawSymmetric(lastPoint.current.x, lastPoint.current.y, point.x, point.y)
    lastPoint.current = point
  }

  const handleEnd = () => {
    if (isDrawing.current) {
      isDrawing.current = false
      lastPoint.current = null
      saveHistory()
    }
  }

  const changeBg = (newBg: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get current drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Parse old and new bg colors
    const oldRgb = hexToRgb(bgColor)
    const newRgb = hexToRgb(newBg)
    if (!oldRgb || !newRgb) return

    // Replace old bg pixels with new bg
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - oldRgb.r) < 10 &&
        Math.abs(data[i + 1] - oldRgb.g) < 10 &&
        Math.abs(data[i + 2] - oldRgb.b) < 10
      ) {
        data[i] = newRgb.r
        data[i + 1] = newRgb.g
        data[i + 2] = newRgb.b
      }
    }

    ctx.putImageData(imageData, 0, 0)
    setBgColor(newBg)
    saveHistory()
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null
  }

  // Export mandala as design → save to DB → open in design editor
  const handleSaveAsDesign = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsSaving(true)

    try {
      // Export canvas as blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 1.0)
      )
      if (!blob) throw new Error('Canvas export failed')

      // Upload to room upload endpoint (reuse existing upload infra)
      const formData = new FormData()
      formData.append('file', blob, 'mandala.png')

      // Upload the mandala image
      const uploadRes = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadData.success) throw new Error('Upload failed')

      const imageUrl = uploadData.room?.imageUrl || ''

      // Create a design entry via generate endpoint with the mandala as a "manual" design
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: 'geometric',
          controls: null,
          userDescription: 'Hand-drawn mandala',
        }),
      })
      const data = await res.json()

      if (data.success && data.designId) {
        // Update the design with the mandala image
        await fetch(`/api/designs/${data.designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            title: 'Mandala Design',
          }),
        })
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert('Could not save design. Try again.')
      }
    } catch (err) {
      console.error('Save mandala error:', err)
      alert('Could not save mandala. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'mandala.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const palette = COLOR_PALETTES[activePalette]

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
              Mandala Maker
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CreditBadge />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden shadow-lg bg-white"
              style={{ width: canvasSize, height: canvasSize }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: canvasSize, height: canvasSize, touchAction: 'none' }}
                className="absolute inset-0 cursor-crosshair"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
              <canvas
                ref={overlayCanvasRef}
                style={{ width: canvasSize, height: canvasSize }}
                className="absolute inset-0 pointer-events-none"
              />
            </div>

            {/* Quick actions below canvas */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all"
                title="Undo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all"
                title="Redo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
              <button
                onClick={clearCanvas}
                className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                title="Clear"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Guides
              </label>
            </div>
          </div>

          {/* Sidebar tools */}
          <div className="lg:w-72 space-y-4">
            {/* Tool selector */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tool</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTool('brush')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tool === 'brush' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✏️ Brush
                </button>
                <button
                  onClick={() => setTool('eraser')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tool === 'eraser' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🧹 Eraser
                </button>
              </div>
            </div>

            {/* Symmetry */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Symmetry</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {([4, 6, 8, 12, 16] as SymmetryMode[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSymmetry(s)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      symmetry === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Brush size */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Size</h3>
              <div className="flex items-center gap-2">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                      brushSize === size ? 'bg-gray-900' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: Math.min(size, 20),
                        height: Math.min(size, 20),
                        backgroundColor: brushSize === size ? '#fff' : '#666',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Opacity: {Math.round(opacity * 100)}%
              </h3>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-gray-900"
              />
            </div>

            {/* Color palette */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Colors</h3>
                <select
                  value={activePalette}
                  onChange={(e) => setActivePalette(parseInt(e.target.value))}
                  className="text-xs text-gray-600 bg-gray-100 rounded-md px-2 py-1 border-0 focus:ring-1 focus:ring-gray-300"
                >
                  {COLOR_PALETTES.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {palette.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setTool('brush') }}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      color === c && tool === 'brush' ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-gray-500">Custom:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => { setColor(e.target.value); setTool('brush') }}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <span className="text-xs text-gray-400 font-mono">{color}</span>
              </div>
            </div>

            {/* Background */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Background</h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => changeBg(bg.value)}
                    className={`w-9 h-9 rounded-lg border transition-all ${
                      bgColor === bg.value ? 'ring-2 ring-gray-900 ring-offset-2' : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: bg.value }}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                size="lg"
                onClick={handleSaveAsDesign}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    🖼️ Use as Wall Art
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={downloadPng}
                className="w-full"
              >
                ↓ Download PNG
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
