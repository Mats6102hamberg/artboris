'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import CreditBadge from '@/components/poster/CreditBadge'
import BorisButton from '@/components/boris/BorisButton'
import RemixMenu, { RemixBanner } from '@/components/wallcraft/RemixMenu'
import { useSourceImage } from '@/hooks/useSourceImage'
import { HIRES_EXPORT_SIZE } from '@/lib/wallcraft/hiResExport'
import { refineArtwork } from '@/lib/mandala/refineArtwork'

// ─── Types ───
type Tool = 'brush' | 'eraser' | 'line' | 'circle' | 'rect'
type RepeatMode = 'grid' | 'brick' | 'mirror' | 'diagonal'

interface HistoryEntry {
  imageData: ImageData
}

const COLOR_PALETTES = [
  { name: 'Nordic', colors: ['#2C3E50', '#5D6D7E', '#AEB6BF', '#D5DBDB', '#85929E', '#1B2631'] },
  { name: 'Terracotta', colors: ['#C0392B', '#E74C3C', '#D4A574', '#F0E0C8', '#8B4513', '#CD853F'] },
  { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#023E8A', '#48CAE4', '#CAF0F8'] },
  { name: 'Botanical', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#1B4332'] },
  { name: 'Blush', colors: ['#FFB5A7', '#FCD5CE', '#F8EDEB', '#F9DCC4', '#FEC89A', '#E8A598'] },
  { name: 'Monochrome', colors: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'] },
  { name: 'Jewel', colors: ['#6C3483', '#1F618D', '#117A65', '#B7950B', '#A04000', '#1C2833'] },
  { name: 'Pastel', colors: ['#AEC6CF', '#FFD1DC', '#FDFD96', '#B39EB5', '#77DD77', '#FFB347'] },
]

const BACKGROUNDS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Cream', value: '#FAFAF8' },
  { name: 'Light Gray', value: '#F0F0F0' },
  { name: 'Navy', value: '#0A1628' },
  { name: 'Black', value: '#111111' },
  { name: 'Sage', value: '#D4DBC8' },
]

const BRUSH_SIZES = [1, 2, 4, 8, 14, 22]
const TILE_SIZES = [64, 96, 128, 192, 256]

function PatternContent() {
  const router = useRouter()

  // Canvas refs
  const tileCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const shapeStart = useRef<{ x: number; y: number } | null>(null)

  // State
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#2C3E50')
  const [brushSize, setBrushSize] = useState(4)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [activePalette, setActivePalette] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [tileSize, setTileSize] = useState(128)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('grid')
  const [showGrid, setShowGrid] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [previewSize, setPreviewSize] = useState(400)

  // Refine state
  const [isRefining, setIsRefining] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [refinedImageData, setRefinedImageData] = useState<ImageData | null>(null)
  const [originalDataUrl, setOriginalDataUrl] = useState('')
  const [refinedDataUrl, setRefinedDataUrl] = useState('')
  const [sliderPosition, setSliderPosition] = useState(50)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDraggingSlider = useRef(false)

  // Responsive
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth
      if (w < 640) setPreviewSize(Math.min(w - 32, 340))
      else if (w < 1024) setPreviewSize(380)
      else setPreviewSize(400)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Init tile canvas
  useEffect(() => {
    const canvas = tileCanvasRef.current
    if (!canvas) return
    canvas.width = tileSize
    canvas.height = tileSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, tileSize, tileSize)
    saveHistory()
    updatePreview()
    setCanvasReady(true)
  }, [tileSize])

  // Remix: load source image from another tool onto tile canvas (waits for canvasReady)
  const { remixFrom, remixDesignId } = useSourceImage({
    canvasRef: tileCanvasRef,
    canvasSize: tileSize,
    canvasReady,
    onLoaded: () => { saveHistory(); updatePreview() },
  })

  // Update preview when tile changes
  const updatePreview = useCallback(() => {
    const tile = tileCanvasRef.current
    const preview = previewCanvasRef.current
    if (!tile || !preview) return
    const ctx = preview.getContext('2d')
    if (!ctx) return

    const pw = preview.width
    const ph = preview.height
    ctx.clearRect(0, 0, pw, ph)

    const cols = Math.ceil(pw / tileSize) + 1
    const rows = Math.ceil(ph / tileSize) + 1

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = col * tileSize
        let y = row * tileSize

        ctx.save()

        if (repeatMode === 'brick') {
          if (row % 2 === 1) x += tileSize / 2
        } else if (repeatMode === 'mirror') {
          const flipH = col % 2 === 1
          const flipV = row % 2 === 1
          ctx.translate(x + (flipH ? tileSize : 0), y + (flipV ? tileSize : 0))
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
          ctx.drawImage(tile, 0, 0)
          ctx.restore()
          continue
        } else if (repeatMode === 'diagonal') {
          if ((row + col) % 2 === 1) {
            ctx.translate(x + tileSize, y)
            ctx.scale(-1, 1)
            ctx.drawImage(tile, 0, 0)
            ctx.restore()
            continue
          }
        }

        ctx.drawImage(tile, x, y)
        ctx.restore()
      }
    }
  }, [tileSize, repeatMode])

  const saveHistory = useCallback(() => {
    const canvas = tileCanvasRef.current
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
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newIndex = historyIndex - 1
    ctx.putImageData(history[newIndex].imageData, 0, 0)
    setHistoryIndex(newIndex)
    updatePreview()
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const newIndex = historyIndex + 1
    ctx.putImageData(history[newIndex].imageData, 0, 0)
    setHistoryIndex(newIndex)
    updatePreview()
  }

  const clearCanvas = () => {
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveHistory()
    updatePreview()
  }

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = tileCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
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
    const point = getCanvasPoint(e)
    if (!point) return

    if (tool === 'line' || tool === 'circle' || tool === 'rect') {
      shapeStart.current = point
      isDrawing.current = true
      return
    }

    isDrawing.current = true
    lastPoint.current = point
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const point = getCanvasPoint(e)
    if (!point) return

    if (tool === 'brush' || tool === 'eraser') {
      if (!lastPoint.current) return
      const canvas = tileCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawLine(ctx, lastPoint.current.x, lastPoint.current.y, point.x, point.y)
      lastPoint.current = point
      updatePreview()
    }
  }

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if ((tool === 'line' || tool === 'circle' || tool === 'rect') && shapeStart.current) {
      const point = getCanvasPoint(e) || shapeStart.current
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.globalAlpha = opacity

      if (tool === 'line') {
        ctx.beginPath()
        ctx.moveTo(shapeStart.current.x, shapeStart.current.y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      } else if (tool === 'circle') {
        const rx = Math.abs(point.x - shapeStart.current.x) / 2
        const ry = Math.abs(point.y - shapeStart.current.y) / 2
        const cx = (shapeStart.current.x + point.x) / 2
        const cy = (shapeStart.current.y + point.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (tool === 'rect') {
        const w = point.x - shapeStart.current.x
        const h = point.y - shapeStart.current.y
        ctx.strokeRect(shapeStart.current.x, shapeStart.current.y, w, h)
      }

      ctx.globalAlpha = 1
      shapeStart.current = null
    }

    lastPoint.current = null
    saveHistory()
    updatePreview()
  }

  const changeBg = (newBg: string) => {
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const oldRgb = hexToRgb(bgColor)
    const newRgb = hexToRgb(newBg)
    if (!oldRgb || !newRgb) return
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i] - oldRgb.r) < 10 && Math.abs(data[i + 1] - oldRgb.g) < 10 && Math.abs(data[i + 2] - oldRgb.b) < 10) {
        data[i] = newRgb.r; data[i + 1] = newRgb.g; data[i + 2] = newRgb.b
      }
    }
    ctx.putImageData(imageData, 0, 0)
    setBgColor(newBg)
    saveHistory()
    updatePreview()
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
  }

  // ─── Refine ───
  const imageDataToDataUrl = (imgData: ImageData): string => {
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = imgData.width
    tmpCanvas.height = imgData.height
    const tmpCtx = tmpCanvas.getContext('2d')
    if (!tmpCtx) return ''
    tmpCtx.putImageData(imgData, 0, 0)
    return tmpCanvas.toDataURL('image/png')
  }

  const handleRefine = async () => {
    const canvas = tileCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const original = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setOriginalImageData(original)
    setOriginalDataUrl(imageDataToDataUrl(original))
    setIsRefining(true)
    await new Promise((r) => setTimeout(r, 50))
    const refined = refineArtwork(original)
    setRefinedImageData(refined)
    setRefinedDataUrl(imageDataToDataUrl(refined))
    await new Promise((r) => setTimeout(r, 1200))
    setIsRefining(false)
    setSliderPosition(50)
    setShowComparison(true)
  }

  const handleUseRefined = () => {
    const canvas = tileCanvasRef.current
    if (!canvas || !refinedImageData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.putImageData(refinedImageData, 0, 0)
    saveHistory()
    updatePreview()
    setShowComparison(false)
    setOriginalImageData(null)
    setRefinedImageData(null)
  }

  const handleKeepOriginal = () => {
    setShowComparison(false)
    setOriginalImageData(null)
    setRefinedImageData(null)
  }

  const handleSliderDrag = (clientX: number) => {
    const container = sliderRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)))
  }

  // ─── Export ───
  const exportFullPattern = (outputSize?: number): HTMLCanvasElement => {
    const tile = tileCanvasRef.current!
    const size = outputSize || 1024

    // Upscale tile for high-res output
    const scaleFactor = Math.max(1, Math.ceil(size / (tileSize * 8)))
    const hiTileSize = tileSize * scaleFactor
    let hiTile: HTMLCanvasElement | HTMLCanvasElement = tile
    if (scaleFactor > 1) {
      hiTile = document.createElement('canvas')
      hiTile.width = hiTileSize
      hiTile.height = hiTileSize
      const tCtx = hiTile.getContext('2d')!
      tCtx.imageSmoothingEnabled = true
      tCtx.imageSmoothingQuality = 'high'
      tCtx.drawImage(tile, 0, 0, hiTileSize, hiTileSize)
    }

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = size
    exportCanvas.height = size
    const ctx = exportCanvas.getContext('2d')!
    const cols = Math.ceil(size / hiTileSize) + 1
    const rows = Math.ceil(size / hiTileSize) + 1
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = col * hiTileSize
        let y = row * hiTileSize
        ctx.save()
        if (repeatMode === 'brick') {
          if (row % 2 === 1) x += hiTileSize / 2
        } else if (repeatMode === 'mirror') {
          const flipH = col % 2 === 1
          const flipV = row % 2 === 1
          ctx.translate(x + (flipH ? hiTileSize : 0), y + (flipV ? hiTileSize : 0))
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
          ctx.drawImage(hiTile, 0, 0)
          ctx.restore()
          continue
        } else if (repeatMode === 'diagonal') {
          if ((row + col) % 2 === 1) {
            ctx.translate(x + hiTileSize, y)
            ctx.scale(-1, 1)
            ctx.drawImage(hiTile, 0, 0)
            ctx.restore()
            continue
          }
        }
        ctx.drawImage(hiTile, x, y)
        ctx.restore()
      }
    }
    return exportCanvas
  }

  const handleSaveAsDesign = async () => {
    setIsSaving(true)
    try {
      const exportCanvas = exportFullPattern(HIRES_EXPORT_SIZE)
      // White background for JPEG (no transparency)
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = exportCanvas.width
      finalCanvas.height = exportCanvas.height
      const fCtx = finalCanvas.getContext('2d')!
      fCtx.fillStyle = '#FFFFFF'
      fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
      fCtx.drawImage(exportCanvas, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => finalCanvas.toBlob(resolve, 'image/jpeg', 0.95))
      if (!blob) throw new Error('Canvas export failed')
      const formData = new FormData()
      formData.append('file', blob, 'pattern.jpg')
      const uploadRes = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error('Upload failed')
      const imageUrl = uploadData.room?.imageUrl || ''
      const res = await fetch('/api/designs/create-from-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, style: 'geometric', title: 'Pattern Design' }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert('Could not save design. Try again.')
      }
    } catch (err) {
      console.error('Save pattern error:', err)
      alert('Could not save pattern. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadPng = () => {
    const exportCanvas = exportFullPattern()
    const link = document.createElement('a')
    link.download = 'pattern.png'
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
  }

  const palette = COLOR_PALETTES[activePalette]
  const tileDisplaySize = Math.min(previewSize * 0.55, 280)

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'brush', label: 'Brush', icon: '✏️' },
    { id: 'eraser', label: 'Eraser', icon: '🧹' },
    { id: 'line', label: 'Line', icon: '╱' },
    { id: 'circle', label: 'Circle', icon: '○' },
    { id: 'rect', label: 'Rect', icon: '□' },
  ]

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
              Pattern Studio
            </span>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <RemixBanner remixFrom={remixFrom} remixDesignId={remixDesignId} />
        <div className="flex flex-col lg:flex-row gap-6 mt-3">
          {/* Left: Tile editor + Preview */}
          <div className="flex-1 flex flex-col items-center gap-6">
            {/* Tile editor */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 text-center">Tile</p>
              <div
                className="relative rounded-xl overflow-hidden shadow-md bg-white border border-gray-200/60"
                style={{ width: tileDisplaySize, height: tileDisplaySize }}
              >
                <canvas
                  ref={tileCanvasRef}
                  style={{ width: tileDisplaySize, height: tileDisplaySize, touchAction: 'none' }}
                  className="cursor-crosshair"
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                />
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none border border-dashed border-gray-300/50" />
                )}
              </div>
            </div>

            {/* Live preview */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 text-center">Live Preview</p>
              <div
                className="rounded-xl overflow-hidden shadow-lg border border-gray-200/60"
                style={{ width: previewSize, height: previewSize }}
              >
                <canvas
                  ref={previewCanvasRef}
                  width={previewSize}
                  height={previewSize}
                  style={{ width: previewSize, height: previewSize }}
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all" title="Undo">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all" title="Redo">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
              </button>
              <button onClick={clearCanvas} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all" title="Clear">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="rounded border-gray-300" />
                Grid
              </label>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4">
            {/* Tool selector */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tool</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {tools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      tool === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={t.label}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat mode */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Repeat</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {(['grid', 'brick', 'mirror', 'diagonal'] as RepeatMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setRepeatMode(mode); setTimeout(updatePreview, 10) }}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      repeatMode === mode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Tile size */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tile Size</h3>
              <div className="flex gap-1.5">
                {TILE_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTileSize(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      tileSize === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    <div className="rounded-full" style={{ width: Math.min(size, 20), height: Math.min(size, 20), backgroundColor: brushSize === size ? '#fff' : '#666' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Opacity: {Math.round(opacity * 100)}%</h3>
              <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full accent-gray-900" />
            </div>

            {/* Colors */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Colors</h3>
                <select value={activePalette} onChange={(e) => setActivePalette(parseInt(e.target.value))} className="text-xs text-gray-600 bg-gray-100 rounded-md px-2 py-1 border-0 focus:ring-1 focus:ring-gray-300">
                  {COLOR_PALETTES.map((p, i) => (<option key={i} value={i}>{p.name}</option>))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {palette.colors.map((c) => (
                  <button key={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush') }}
                    className={`w-9 h-9 rounded-lg transition-all ${color === c && tool !== 'eraser' ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-gray-500">Custom:</label>
                <input type="color" value={color} onChange={(e) => { setColor(e.target.value); if (tool === 'eraser') setTool('brush') }} className="w-8 h-8 rounded cursor-pointer border-0" />
                <span className="text-xs text-gray-400 font-mono">{color}</span>
              </div>
            </div>

            {/* Background */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Background</h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button key={bg.value} onClick={() => changeBg(bg.value)}
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
              <div className="h-px bg-gray-100 my-1" />
              <RemixMenu currentTool="pattern" canvasRef={tileCanvasRef} exportCanvas={exportFullPattern} />
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
          'Vilka mönster passar i ett kök?',
          'Hur skapar jag ett harmoniskt upprepande mönster?',
          'Tips för färgval i mönsterdesign',
        ]}
      />
    </div>
  )
}

export default function PatternPage() {
  return (
    <Suspense>
      <PatternContent />
    </Suspense>
  )
}
