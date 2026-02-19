'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import CreditBadge from '@/components/poster/CreditBadge'
import BorisButton from '@/components/boris/BorisButton'
import RemixMenu, { RemixBanner } from '@/components/wallcraft/RemixMenu'
import { useSourceImage } from '@/hooks/useSourceImage'
import { RENDER_SCALE, exportHiResPng } from '@/lib/wallcraft/hiResExport'
import { refineArtwork } from '@/lib/mandala/refineArtwork'

// ─── Types ───
type FlowStyle = 'smooth' | 'turbulent' | 'spiral' | 'waves' | 'organic'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

const COLOR_PALETTES = [
  { name: 'Aurora', colors: ['#00D2FF', '#3A7BD5', '#7B2FBE', '#D63384', '#FF6B6B', '#FFD93D'] },
  { name: 'Ember', colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700', '#FFFACD'] },
  { name: 'Deep Sea', colors: ['#0C2340', '#1B4F72', '#2E86C1', '#5DADE2', '#85C1E9', '#D6EAF8'] },
  { name: 'Forest', colors: ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#B7E4C7'] },
  { name: 'Dusk', colors: ['#2C1654', '#4A1A6B', '#7B2D8E', '#C77DFF', '#E0AAFF', '#F3D5FF'] },
  { name: 'Earth', colors: ['#3E2723', '#5D4037', '#8D6E63', '#BCAAA4', '#D7CCC8', '#EFEBE9'] },
  { name: 'Monochrome', colors: ['#111111', '#333333', '#555555', '#888888', '#BBBBBB', '#EEEEEE'] },
  { name: 'Candy', colors: ['#FF6B9D', '#C44569', '#F8B500', '#00B8A9', '#6C5CE7', '#FD79A8'] },
]

const BACKGROUNDS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Cream', value: '#FAFAF8' },
  { name: 'Black', value: '#0A0A0A' },
  { name: 'Navy', value: '#0A1628' },
  { name: 'Dark Gray', value: '#1A1A2E' },
  { name: 'Warm Gray', value: '#E8E4DF' },
]

function AbstractContent() {
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const flowFieldRef = useRef<number[]>([])
  const isGenerating = useRef(false)
  const snapshotBeforeRef = useRef<ImageData | null>(null)

  const [flowStyle, setFlowStyle] = useState<FlowStyle>('smooth')
  const [bgColor, setBgColor] = useState('#0A0A0A')
  const [activePalette, setActivePalette] = useState(0)
  const [particleCount, setParticleCount] = useState(200)
  const [speed, setSpeed] = useState(2)
  const [trailLength, setTrailLength] = useState(0.95)
  const [particleSize, setParticleSize] = useState(2)
  const [complexity, setComplexity] = useState(3)
  const [canvasSize, setCanvasSize] = useState(600)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])

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

  // Init canvas — internal resolution = displaySize * RENDER_SCALE for print quality
  const internalSize = canvasSize * RENDER_SCALE

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = internalSize
    canvas.height = internalSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, internalSize, internalSize)
    setCanvasReady(true)
  }, [internalSize])

  // Remix: load source image from another tool (waits for canvasReady)
  const { remixFrom, remixDesignId } = useSourceImage({ canvasRef, canvasSize, canvasReady })

  // Generate flow field
  const cellSize = 20 * RENDER_SCALE
  const generateFlowField = useCallback(() => {
    const cols = Math.ceil(internalSize / cellSize)
    const rows = Math.ceil(internalSize / cellSize)
    const field: number[] = []
    const seed = Math.random() * 1000

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let angle: number
        const nx = x / cols
        const ny = y / rows

        switch (flowStyle) {
          case 'smooth':
            angle = Math.sin(nx * complexity * Math.PI + seed) * Math.cos(ny * complexity * Math.PI + seed) * Math.PI * 2
            break
          case 'turbulent':
            angle = Math.sin(nx * complexity * 4 + seed) * Math.cos(ny * complexity * 3 + seed * 0.7) * Math.PI * 4
              + Math.sin((nx + ny) * complexity * 2) * Math.PI
            break
          case 'spiral':
            const cx = nx - 0.5
            const cy = ny - 0.5
            angle = Math.atan2(cy, cx) + Math.sqrt(cx * cx + cy * cy) * complexity * Math.PI * 2
            break
          case 'waves':
            angle = Math.sin(ny * complexity * Math.PI * 2 + seed) * Math.PI * 0.5
              + Math.cos(nx * complexity * Math.PI + seed * 0.5) * Math.PI * 0.3
            break
          case 'organic':
            angle = Math.sin(nx * complexity * 2 + seed) * Math.cos(ny * complexity * 1.5 + seed * 0.8) * Math.PI
              + Math.sin((nx * ny) * complexity * 5 + seed) * Math.PI * 0.5
            break
          default:
            angle = 0
        }

        field.push(angle)
      }
    }

    flowFieldRef.current = field
  }, [internalSize, flowStyle, complexity])

  // Spawn particles
  const spawnParticles = useCallback(() => {
    const palette = COLOR_PALETTES[activePalette]
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * internalSize,
        y: Math.random() * internalSize,
        vx: 0,
        vy: 0,
        color: palette.colors[Math.floor(Math.random() * palette.colors.length)],
        life: 0,
        maxLife: 100 + Math.random() * 200,
        size: particleSize * RENDER_SCALE * (0.5 + Math.random()),
      })
    }

    particlesRef.current = particles
  }, [activePalette, particleCount, internalSize, particleSize])

  // Animation loop
  const animate = useCallback(() => {
    if (!isGenerating.current) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cols = Math.ceil(internalSize / cellSize)

    // Fade trail
    ctx.fillStyle = bgColor
    ctx.globalAlpha = 1 - trailLength
    ctx.fillRect(0, 0, internalSize, internalSize)
    ctx.globalAlpha = 1

    const field = flowFieldRef.current
    const particles = particlesRef.current
    const palette = COLOR_PALETTES[activePalette]

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.life++

      if (p.life > p.maxLife) {
        p.x = Math.random() * internalSize
        p.y = Math.random() * internalSize
        p.life = 0
        p.maxLife = 100 + Math.random() * 200
        p.color = palette.colors[Math.floor(Math.random() * palette.colors.length)]
        p.vx = 0
        p.vy = 0
        continue
      }

      const col = Math.floor(p.x / cellSize)
      const row = Math.floor(p.y / cellSize)
      const idx = row * cols + col

      if (idx >= 0 && idx < field.length) {
        const angle = field[idx]
        p.vx += Math.cos(angle) * speed * 0.3
        p.vy += Math.sin(angle) * speed * 0.3
      }

      p.vx *= 0.95
      p.vy *= 0.95
      p.x += p.vx
      p.y += p.vy

      // Wrap around
      if (p.x < 0) p.x = internalSize
      if (p.x > internalSize) p.x = 0
      if (p.y < 0) p.y = internalSize
      if (p.y > internalSize) p.y = 0

      // Draw
      const lifeRatio = p.life / p.maxLife
      const alpha = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha * 0.7
      ctx.fill()
      ctx.globalAlpha = 1
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [internalSize, bgColor, trailLength, speed, activePalette])

  const startGeneration = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save snapshot for undo
    snapshotBeforeRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Clear canvas
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, internalSize, internalSize)

    generateFlowField()
    spawnParticles()
    isGenerating.current = true
    setIsRunning(true)
    animFrameRef.current = requestAnimationFrame(animate)
  }

  const stopGeneration = () => {
    isGenerating.current = false
    setIsRunning(false)
    cancelAnimationFrame(animFrameRef.current)

    // Save to history
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => [...prev.slice(-9), imgData])
  }

  const undoLast = () => {
    if (history.length === 0 && !snapshotBeforeRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (snapshotBeforeRef.current) {
      ctx.putImageData(snapshotBeforeRef.current, 0, 0)
      snapshotBeforeRef.current = null
    } else if (history.length > 0) {
      const prev = history[history.length - 1]
      ctx.putImageData(prev, 0, 0)
      setHistory((h) => h.slice(0, -1))
    }
  }

  const clearCanvas = () => {
    if (isRunning) stopGeneration()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, internalSize, internalSize)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      isGenerating.current = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ─── Refine ───
  const imageDataToDataUrl = (imgData: ImageData): string => {
    const tmp = document.createElement('canvas')
    tmp.width = imgData.width
    tmp.height = imgData.height
    const c = tmp.getContext('2d')
    if (!c) return ''
    c.putImageData(imgData, 0, 0)
    return tmp.toDataURL('image/png')
  }

  const handleRefine = async () => {
    if (isRunning) stopGeneration()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const original = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setOriginalDataUrl(imageDataToDataUrl(original))
    setIsRefining(true)
    await new Promise((r) => setTimeout(r, 50))
    const refined = refineArtwork(original, { contrastAmount: 0.12, vibranceAmount: 0.1, depthGlowIntensity: 0.08 })
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
    if (isRunning) stopGeneration()
    setIsSaving(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('No canvas')
      const blob = await exportHiResPng(canvas)
      const formData = new FormData()
      formData.append('file', blob, 'abstract.jpg')
      const uploadRes = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error('Upload failed')
      const imageUrl = uploadData.room?.imageUrl || ''
      const res = await fetch('/api/designs/create-from-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, style: 'abstract', title: 'Abstract Painting' }),
      })
      const data = await res.json()
      if (data.success && data.designId) {
        router.push(`/wallcraft/design/${data.designId}`)
      } else {
        alert('Could not save design. Try again.')
      }
    } catch (err) {
      console.error('Save abstract error:', err)
      alert('Could not save. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'abstract-painting.png'
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
              Abstract Painter
            </span>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        <RemixBanner remixFrom={remixFrom} remixDesignId={remixDesignId} />
        <div className="flex flex-col lg:flex-row gap-6 mt-3">
          {/* Canvas */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden shadow-lg bg-black"
              style={{ width: canvasSize, height: canvasSize }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: canvasSize, height: canvasSize }}
                className="absolute inset-0"
              />
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 mt-4">
              {!isRunning ? (
                <button
                  onClick={startGeneration}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Generate
                </button>
              ) : (
                <button
                  onClick={stopGeneration}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
                  Stop
                </button>
              )}
              <button onClick={undoLast} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all" title="Undo">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <button onClick={clearCanvas} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all" title="Clear">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4">
            {/* Flow style */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Flow Style</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {(['smooth', 'turbulent', 'spiral', 'waves', 'organic'] as FlowStyle[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFlowStyle(s)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      flowStyle === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Particles */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Particles: {particleCount}</h3>
              <input type="range" min="50" max="800" step="50" value={particleCount} onChange={(e) => setParticleCount(parseInt(e.target.value))} className="w-full accent-gray-900" />
            </div>

            {/* Speed */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Speed: {speed.toFixed(1)}</h3>
              <input type="range" min="0.5" max="5" step="0.5" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-gray-900" />
            </div>

            {/* Trail */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Trail: {Math.round(trailLength * 100)}%</h3>
              <input type="range" min="0.8" max="0.99" step="0.01" value={trailLength} onChange={(e) => setTrailLength(parseFloat(e.target.value))} className="w-full accent-gray-900" />
            </div>

            {/* Particle size */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Particle Size: {particleSize}</h3>
              <input type="range" min="1" max="8" step="0.5" value={particleSize} onChange={(e) => setParticleSize(parseFloat(e.target.value))} className="w-full accent-gray-900" />
            </div>

            {/* Complexity */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/60">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Complexity: {complexity}</h3>
              <input type="range" min="1" max="8" step="1" value={complexity} onChange={(e) => setComplexity(parseInt(e.target.value))} className="w-full accent-gray-900" />
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
                  <div key={c} className="w-7 h-7 rounded-lg" style={{ backgroundColor: c }} />
                ))}
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
              <button onClick={handleRefine} disabled={isRefining || isRunning}
                className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-200/80 bg-gradient-to-r from-gray-50 to-white text-gray-700 hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Refine
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <Button size="lg" onClick={handleSaveAsDesign} disabled={isSaving || isRunning} className="w-full">
                {isSaving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>) : '🖼️ Use as Wall Art'}
              </Button>
              <Button variant="secondary" onClick={downloadPng} className="w-full">↓ Download PNG</Button>
              <div className="h-px bg-gray-100 my-1" />
              <RemixMenu currentTool="abstract" canvasRef={canvasRef} />
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
          'Vilka färger skapar lugn i abstrakt konst?',
          'Hur använder jag flödesfmältar effektivt?',
          'Tips för att skapa djup i abstrakt måleri',
        ]}
      />
    </div>
  )
}

export default function AbstractPage() {
  return (
    <Suspense>
      <AbstractContent />
    </Suspense>
  )
}
