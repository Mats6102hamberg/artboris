'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import { calculatePosterPlacement } from '@/lib/image/transform'
import { getFrameById } from '@/lib/pricing/prints'
import { getSizeById } from '@/lib/image/resize'

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
}: MockupPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const resizeStart = useRef<{ x: number; y: number; scale: number } | null>(null)

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

  // --- Drag to move ---
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onPositionChange || !containerRef.current) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, posX: positionX, posY: positionY }
    setIsDragging(true)

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragStart.current || !containerRef.current) return
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

  // --- Corner resize ---
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onScaleChange || !containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    resizeStart.current = { x: clientX, y: clientY, scale }
    setIsResizing(true)

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!resizeStart.current || !containerRef.current) return
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
      const rect = containerRef.current.getBoundingClientRect()
      // Diagonal distance change → scale change
      const dx = (cx - resizeStart.current.x) / rect.width
      const dy = (cy - resizeStart.current.y) / rect.height
      const delta = (dx + dy) * 2
      const newScale = Math.max(0.3, Math.min(2.0, resizeStart.current.scale + delta))
      onScaleChange(newScale)
    }

    const handleUp = () => {
      resizeStart.current = null
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
  }, [scale, onScaleChange])

  const isInteractive = !!(onPositionChange || onScaleChange)

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden shadow-lg select-none">
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

      {/* Poster — draggable */}
      <div
        className={`absolute overflow-hidden ${isInteractive ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          left: `${placement.left * 100}%`,
          top: `${placement.top * 100}%`,
          width: `${placement.width * 100}%`,
          height: `${placement.height * 100}%`,
          zIndex: 10,
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <img
          src={designImageUrl}
          alt="Poster"
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Interactive border when hovering */}
        {isInteractive && (
          <div className={`absolute inset-0 border-2 transition-opacity ${isDragging || isResizing ? 'border-blue-500 opacity-100' : 'border-blue-400 opacity-0 hover:opacity-100'}`} />
        )}
      </div>

      {/* Resize handles — corners */}
      {isInteractive && (
        <>
          {[
            { pos: 'top-0 left-0', cursor: 'nw-resize', translate: '-translate-x-1/2 -translate-y-1/2' },
            { pos: 'top-0 right-0', cursor: 'ne-resize', translate: 'translate-x-1/2 -translate-y-1/2' },
            { pos: 'bottom-0 left-0', cursor: 'sw-resize', translate: '-translate-x-1/2 translate-y-1/2' },
            { pos: 'bottom-0 right-0', cursor: 'se-resize', translate: 'translate-x-1/2 translate-y-1/2' },
          ].map((handle, i) => (
            <div
              key={i}
              className={`absolute ${handle.pos} ${handle.translate} w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md hover:bg-blue-50 hover:scale-125 transition-transform z-20`}
              style={{
                left: handle.pos.includes('left-0')
                  ? `${placement.left * 100}%`
                  : `${(placement.left + placement.width) * 100}%`,
                top: handle.pos.includes('top-0')
                  ? `${placement.top * 100}%`
                  : `${(placement.top + placement.height) * 100}%`,
                cursor: handle.cursor,
              }}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            />
          ))}
        </>
      )}
    </div>
  )
}
