'use client'

import { useState, useRef, useEffect } from 'react'

interface RemixMenuProps {
  /** Current tool — will be excluded from the menu */
  currentTool: 'mandala' | 'abstract' | 'pattern' | 'colorfield'
  /** Ref to the canvas to export from */
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  /** Optional: for pattern, export the full tiled pattern instead */
  exportCanvas?: () => HTMLCanvasElement
}

const TOOL_LABELS: Record<string, string> = {
  mandala: 'Mandala Maker',
  abstract: 'Abstract Painter',
  pattern: 'Pattern Studio',
  colorfield: 'Color Field Studio',
}

const TOOLS = [
  { id: 'mandala', label: 'Mandala Maker', path: '/wallcraft/mandala', icon: '◎' },
  { id: 'abstract', label: 'Abstract Painter', path: '/wallcraft/abstract', icon: '◈' },
  { id: 'pattern', label: 'Pattern Studio', path: '/wallcraft/pattern', icon: '▦' },
  { id: 'colorfield', label: 'Color Field Studio', path: '/wallcraft/colorfield', icon: '▬' },
] as const

export default function RemixMenu({ currentTool, canvasRef, exportCanvas }: RemixMenuProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleRemix = async (targetPath: string) => {
    setUploading(true)
    try {
      // Get canvas to export
      const sourceCanvas = exportCanvas ? exportCanvas() : canvasRef.current
      if (!sourceCanvas) throw new Error('No canvas')

      // Downscale to max 1024px and export as JPEG 80% to save storage
      const MAX_REMIX_SIZE = 1024
      let exportCanvas2: HTMLCanvasElement = sourceCanvas
      if (sourceCanvas.width > MAX_REMIX_SIZE || sourceCanvas.height > MAX_REMIX_SIZE) {
        const scale = MAX_REMIX_SIZE / Math.max(sourceCanvas.width, sourceCanvas.height)
        const w = Math.round(sourceCanvas.width * scale)
        const h = Math.round(sourceCanvas.height * scale)
        exportCanvas2 = document.createElement('canvas')
        exportCanvas2.width = w
        exportCanvas2.height = h
        const ctx = exportCanvas2.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(sourceCanvas, 0, 0, w, h)
        }
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas2.toBlob(resolve, 'image/jpeg', 0.8)
      )
      if (!blob) throw new Error('Canvas export failed')

      // Upload to get a persistent URL
      const formData = new FormData()
      formData.append('file', blob, 'remix-source.jpg')
      const uploadRes = await fetch('/api/rooms/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error('Upload failed')

      const imageUrl = uploadData.room?.imageUrl || ''

      // Auto-save as Design in DB (safety net — user can always go back)
      let designId = ''
      try {
        const toolLabel = TOOL_LABELS[currentTool] || currentTool
        const genRes = await fetch('/api/designs/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: 'remix',
            controls: null,
            userDescription: `Remix checkpoint from ${toolLabel}`,
          }),
        })
        const genData = await genRes.json()
        if (genData.success && genData.designId) {
          await fetch(`/api/designs/${genData.designId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, title: `${toolLabel} — Remix` }),
          })
          designId = genData.designId
        }
      } catch (saveErr) {
        console.warn('[RemixMenu] Auto-save failed, continuing anyway:', saveErr)
      }

      // Navigate to target tool with sourceImage + saved design reference
      const params = new URLSearchParams({
        sourceImage: imageUrl,
        remixFrom: currentTool,
      })
      if (designId) params.set('remixDesignId', designId)

      window.location.href = `${targetPath}?${params.toString()}`
    } catch (err) {
      console.error('Remix export failed:', err)
      alert('Could not export image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const otherTools = TOOLS.filter(t => t.id !== currentTool)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={uploading}
        className="w-full px-4 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all font-medium shadow-sm flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <span className="animate-spin">⟳</span>
            Saving &amp; opening...
          </>
        ) : (
          <>
            <span>✦</span>
            Remix in...
          </>
        )}
      </button>

      {open && !uploading && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Continue in another tool</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Your work is auto-saved</p>
          </div>
          {otherTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleRemix(tool.path)}
              className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 group"
            >
              <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">{tool.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{tool.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Banner shown when arriving via remix — shows source tool + link back to saved design */
export function RemixBanner({ remixFrom, remixDesignId }: { remixFrom: string | null; remixDesignId: string | null }) {
  if (!remixFrom) return null

  const fromLabel = TOOL_LABELS[remixFrom] || remixFrom

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-purple-500 text-sm">✦</span>
        <p className="text-xs text-purple-700 truncate">
          Remixed from <span className="font-semibold">{fromLabel}</span>
        </p>
      </div>
      {remixDesignId && (
        <a
          href={`/wallcraft/design/${remixDesignId}`}
          className="text-xs font-medium text-purple-600 hover:text-purple-800 whitespace-nowrap underline underline-offset-2"
        >
          View saved version
        </a>
      )}
    </div>
  )
}
