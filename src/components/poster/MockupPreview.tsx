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

  const placement = useMemo(() => {
    if (wallCorners.length !== 4) {
      return { left: 0.25, top: 0.15, width: 0.2, height: 0.35 }
    }
    return calculatePosterPlacement(wallCorners, positionX, positionY, scale, posterAspect)
  }, [wallCorners, positionX, positionY, scale, posterAspect])

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

  return (
    <div ref={containerRef} className="group/mockup relative rounded-xl overflow-hidden shadow-lg select-none">
      <img src={roomImageUrl} alt="Rum" className="w-full pointer-events-none" draggable={false} />

      {/* Shadow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${placement.left * 100}%`,
          top: `${placement.top * 100}%`,
          width: `${placement.width * 100}%`,
          height: `${placement.height * 100}%`,
          boxShadow: '5px 8px 25px rgba(0,0,0,0.4)',
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
        <div className="w-full h-full overflow-hidden" style={{ margin: isInteractive ? '12px' : 0 }}>
          <img
            src={designImageUrl}
            alt="Poster"
            className="w-full h-full"
            style={cropToCSS(cropMode, cropOffsetX, cropOffsetY)}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
