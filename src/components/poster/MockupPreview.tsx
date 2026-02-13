'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { calculatePosterPlacement } from '@/lib/image/transform'
import { getFrameById } from '@/lib/pricing/prints'
import { getSizeById } from '@/lib/image/resize'
import { cropToCSS, type CropMode } from '@/lib/image/crop'

interface MockupPreviewProps {
  roomImageUrl: string
  designImageUrl: string
  wallCorners: { x: number; y: number }[]
  frameId: string
  sizeId: string
  positionX: number
  positionY: number
  scale: number
  onPositionChange?: (x: number, y: number) => void
  onScaleChange?: (scale: number) => void
  cropMode?: CropMode
  cropOffsetX?: number
  cropOffsetY?: number
}

export default function MockupPreview({
  roomImageUrl,
  designImageUrl,
  wallCorners,
  frameId,
  sizeId,
  positionX,
  positionY,
  scale,
  onPositionChange,
  onScaleChange,
  cropMode = 'COVER',
  cropOffsetX = 0,
  cropOffsetY = 0,
}: MockupPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  const frame = getFrameById(frameId)
  const size = getSizeById(sizeId)
  const posterAspect = size ? size.widthCm / size.heightCm : 2 / 3

  const posterWidthCm = size?.widthCm
  const posterHeightCm = size?.heightCm

  const placement = useMemo(() => {
    if (wallCorners.length !== 4) {
      return { left: 0.25, top: 0.15, width: 0.2, height: 0.35 }
    }
    return calculatePosterPlacement(wallCorners, positionX, positionY, scale, posterAspect, posterWidthCm, posterHeightCm)
  }, [wallCorners, positionX, positionY, scale, posterAspect, posterWidthCm, posterHeightCm])

  // Reference placement at scale=1.0 (the actual selected size)
  const referencePlacement = useMemo(() => {
    if (wallCorners.length !== 4) return null
    return calculatePosterPlacement(wallCorners, positionX, positionY, 1.0, posterAspect, posterWidthCm, posterHeightCm)
  }, [wallCorners, positionX, positionY, posterAspect, posterWidthCm, posterHeightCm])

  const sizeLabel = size ? `${size.widthCm}×${size.heightCm} cm` : ''

  const frameWidthPx = frame && frame.id !== 'none' ? frame.width * 0.4 : 0

  // --- Drag to move (touch + mouse) ---
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onPositionChange || !containerRef.current) return
    // If two-finger touch, let pinch handle it
    if ('touches' in e && e.touches.length >= 2) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, posX: positionX, posY: positionY }
    setIsDragging(true)

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragStart.current || !containerRef.current) return
      // If pinch started, stop drag
      if ('touches' in ev && ev.touches.length >= 2) return
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
      const rect = containerRef.current.getBoundingClientRect()
      const dx = (cx - dragStart.current.x) / rect.width
      const dy = (cy - dragStart.current.y) / rect.height
      const newX = Math.max(0, Math.min(1, dragStart.current.posX + dx))
      const newY = Math.max(0, Math.min(1, dragStart.current.posY + dy))
      onPositionChange(newX, newY)
    }

    const handleUp = () => {
      dragStart.current = null
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
  }, [positionX, positionY, onPositionChange])

  // --- Pinch to zoom (touch) ---
  const getTouchDist = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && onScaleChange) {
      e.preventDefault()
      pinchStart.current = { dist: getTouchDist(e.touches[0], e.touches[1]), scale }
    }
  }, [scale, onScaleChange])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current && onScaleChange) {
      e.preventDefault()
      const newDist = getTouchDist(e.touches[0], e.touches[1])
      const ratio = newDist / pinchStart.current.dist
      const newScale = Math.max(0.2, Math.min(4.0, pinchStart.current.scale * ratio))
      onScaleChange(newScale)
    }
  }, [onScaleChange])

  const handleTouchEnd = useCallback(() => {
    pinchStart.current = null
  }, [])

  // --- Scroll wheel to zoom (desktop) ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!onScaleChange) return
    e.preventDefault()
    const delta = -e.deltaY * 0.002
    const newScale = Math.max(0.2, Math.min(4.0, scale + delta))
    onScaleChange(newScale)
  }, [scale, onScaleChange])

  const isInteractive = !!(onPositionChange || onScaleChange)
  const showReference = isInteractive && Math.abs(scale - 1.0) > 0.02 && referencePlacement

  // Calculate previewed cm size based on scale
  const previewWidthCm = posterWidthCm ? Math.round(posterWidthCm * scale) : null
  const previewHeightCm = posterHeightCm ? Math.round(posterHeightCm * scale) : null
  const isScaled = Math.abs(scale - 1.0) > 0.02

  // --- Dynamic shadow & light based on poster position ---
  const dynamicShadow = useMemo(() => {
    // positionX 0..1: 0=left wall edge, 1=right wall edge
    // Light source assumed from the opposite side of where the poster is
    // Poster on left side → light from left → shadow goes right (positive offsetX)
    // Poster on right side → light from right → shadow goes left (negative offsetX)
    const lightX = 1 - positionX          // 0..1, where 1 = light from left
    const shadowOffsetX = (lightX - 0.5) * -16  // -8..+8 px range

    // positionY: higher poster → more shadow below
    const shadowOffsetY = 4 + (1 - positionY) * 8  // 4..12 px

    // Scale affects shadow depth — bigger poster = more depth = bigger shadow
    const depthFactor = Math.max(0.6, Math.min(2.0, scale))
    const blur = Math.round(14 * depthFactor)
    const spread = Math.round(2 * depthFactor)
    const opacity = Math.min(0.55, 0.25 + 0.1 * depthFactor)

    // Light reflection angle — gradient from the light side
    // lightX > 0.5 means light from left, so highlight on left edge
    const lightAngle = lightX > 0.5 ? 270 : 90 // degrees
    const highlightOpacity = 0.06 + Math.abs(lightX - 0.5) * 0.12 // 0.06..0.12

    return {
      boxShadow: `${shadowOffsetX.toFixed(1)}px ${shadowOffsetY.toFixed(1)}px ${blur}px ${spread}px rgba(0,0,0,${opacity.toFixed(2)})`,
      lightAngle,
      highlightOpacity,
    }
  }, [positionX, positionY, scale])

  return (
    <div ref={containerRef} className="group/mockup relative rounded-xl overflow-hidden shadow-lg select-none">
      <img src={roomImageUrl} alt="Rum" className="w-full pointer-events-none" draggable={false} />

      {/* Dynamic shadow — reacts to poster position and scale */}
      <div
        className="absolute pointer-events-none transition-shadow duration-150"
        style={{
          left: `${placement.left * 100}%`,
          top: `${placement.top * 100}%`,
          width: `${placement.width * 100}%`,
          height: `${placement.height * 100}%`,
          boxShadow: dynamicShadow.boxShadow,
          zIndex: 8,
        }}
      />

      {/* Frame */}
      {frame && frame.id !== 'none' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(${placement.left * 100}% - ${frameWidthPx}px)`,
            top: `calc(${placement.top * 100}% - ${frameWidthPx}px)`,
            width: `calc(${placement.width * 100}% + ${frameWidthPx * 2}px)`,
            height: `calc(${placement.height * 100}% + ${frameWidthPx * 2}px)`,
            backgroundColor: frame.color,
            zIndex: 9,
          }}
        />
      )}

      {/* Reference outline — shows the selected size at scale=1.0 */}
      {showReference && referencePlacement && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${referencePlacement.left * 100}%`,
            top: `${referencePlacement.top * 100}%`,
            width: `${referencePlacement.width * 100}%`,
            height: `${referencePlacement.height * 100}%`,
            border: '1.5px dashed rgba(255,255,255,0.7)',
            borderRadius: '2px',
            zIndex: 11,
          }}
        >
          <span
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full whitespace-nowrap"
          >
            {sizeLabel}
          </span>
        </div>
      )}

      {/* Poster — draggable with generous touch area */}
      <div
        className={`absolute ${isInteractive ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? '!cursor-grabbing' : ''}`}
        style={{
          left: `${placement.left * 100}%`,
          top: `${placement.top * 100}%`,
          width: `${placement.width * 100}%`,
          height: `${placement.height * 100}%`,
          zIndex: 10,
          padding: isInteractive ? '12px' : 0,
          margin: isInteractive ? '-12px' : 0,
          touchAction: 'none',
        }}
        onMouseDown={handleDragStart}
        onTouchStart={(e) => { handleDragStart(e); handleTouchStart(e) }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div className="w-full h-full overflow-hidden relative" style={{ margin: isInteractive ? '12px' : 0 }}>
          <img
            src={designImageUrl}
            alt="Poster"
            className="w-full h-full"
            style={cropToCSS(cropMode, cropOffsetX, cropOffsetY)}
            draggable={false}
          />
          {/* Light reflection overlay — subtle highlight on the light-facing edge */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(${dynamicShadow.lightAngle}deg, rgba(255,255,255,${dynamicShadow.highlightOpacity}) 0%, transparent 40%, rgba(0,0,0,0.03) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Floating size tag */}
      {isInteractive && posterWidthCm && posterHeightCm && (
        <div
          className="absolute pointer-events-none z-20 flex justify-center"
          style={{
            left: `${placement.left * 100}%`,
            top: `calc(${(placement.top + placement.height) * 100}% + 8px)`,
            width: `${placement.width * 100}%`,
          }}
        >
          <div className={`inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
            isScaled ? 'opacity-100' : 'opacity-70'
          }`}>
            {isScaled ? (
              <>
                <span className="opacity-60 line-through">{posterWidthCm}×{posterHeightCm}</span>
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-white font-semibold">{previewWidthCm}×{previewHeightCm} cm</span>
              </>
            ) : (
              <span>{posterWidthCm}×{posterHeightCm} cm</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
