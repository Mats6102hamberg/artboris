'use client'

import { useMemo, useRef, useCallback, useState, useEffect } from 'react'
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
  realisticMode?: boolean
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
  realisticMode: realisticModeProp,
  cropMode = 'COVER',
  cropOffsetX = 0,
  cropOffsetY = 0,
}: MockupPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  // Set cursor on body during drag/resize so it persists even when mouse moves fast
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
      return () => { document.body.style.cursor = '' }
    }
    if (isResizing) {
      document.body.style.cursor = 'nwse-resize'
      return () => { document.body.style.cursor = '' }
    }
  }, [isDragging, isResizing])

  // Low-power detection: auto-disable realistic mode on weak devices
  const [isLowPower, setIsLowPower] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dpr = window.devicePixelRatio || 1
    const cores = navigator.hardwareConcurrency || 2
    // Low-power heuristic: low DPR + few cores
    if (dpr <= 1 && cores <= 2) setIsLowPower(true)
  }, [])

  // Realistic mode: prop overrides auto-detection, default ON for desktop
  const realisticMode = realisticModeProp ?? !isLowPower

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

  const frameWidthPx = frame && frame.id !== 'none' ? frame.width * 0.15 : 0

  // --- Drag to move with momentum/inertia ---
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const momentumRef = useRef<number | null>(null)
  const latestPos = useRef({ x: positionX, y: positionY })
  latestPos.current = { x: positionX, y: positionY }

  const stopMomentum = useCallback(() => {
    if (momentumRef.current) { cancelAnimationFrame(momentumRef.current); momentumRef.current = null }
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onPositionChange || !containerRef.current) return
    if ('touches' in e && e.touches.length >= 2) return
    e.preventDefault()
    stopMomentum()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStart.current = { x: clientX, y: clientY, posX: positionX, posY: positionY }
    lastMoveRef.current = { x: clientX, y: clientY, t: performance.now() }
    velocityRef.current = { vx: 0, vy: 0 }
    setIsDragging(true)

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragStart.current || !containerRef.current) return
      if ('touches' in ev && ev.touches.length >= 2) return
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!dragStart.current || !containerRef.current) return
        const cx = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX
        const cy = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY
        const rect = containerRef.current.getBoundingClientRect()
        const dx = (cx - dragStart.current.x) / rect.width
        const dy = (cy - dragStart.current.y) / rect.height
        const newX = Math.max(-0.5, Math.min(1.5, dragStart.current.posX + dx))
        const newY = Math.max(-0.5, Math.min(1.5, dragStart.current.posY + dy))
        onPositionChange(newX, newY)

        // Track velocity for momentum
        const now = performance.now()
        const dt = now - lastMoveRef.current.t
        if (dt > 0) {
          const mvx = (cx - lastMoveRef.current.x) / rect.width / (dt / 1000)
          const mvy = (cy - lastMoveRef.current.y) / rect.height / (dt / 1000)
          // Smooth velocity with exponential moving average
          velocityRef.current = {
            vx: velocityRef.current.vx * 0.6 + mvx * 0.4,
            vy: velocityRef.current.vy * 0.6 + mvy * 0.4,
          }
        }
        lastMoveRef.current = { x: cx, y: cy, t: now }
      })
    }

    const handleUp = () => {
      dragStart.current = null
      setIsDragging(false)
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)

      // Apply momentum
      const { vx, vy } = velocityRef.current
      const speed = Math.hypot(vx, vy)
      if (speed > 0.15 && onPositionChange) {
        let cvx = vx * 0.3 // dampen initial velocity
        let cvy = vy * 0.3
        const friction = 0.92
        const tick = () => {
          cvx *= friction
          cvy *= friction
          if (Math.hypot(cvx, cvy) < 0.002) { momentumRef.current = null; return }
          const nx = Math.max(-0.5, Math.min(1.5, latestPos.current.x + cvx * 0.016))
          const ny = Math.max(-0.5, Math.min(1.5, latestPos.current.y + cvy * 0.016))
          onPositionChange(nx, ny)
          momentumRef.current = requestAnimationFrame(tick)
        }
        momentumRef.current = requestAnimationFrame(tick)
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleUp)
  }, [positionX, positionY, onPositionChange, stopMomentum])

  // --- Resize handles (corner drag to scale) ---
  const resizeStart = useRef<{ x: number; y: number; scale: number } | null>(null)

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
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!resizeStart.current || !containerRef.current) return
        const cx = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX
        const cy = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY
        const rect = containerRef.current.getBoundingClientRect()
        // Use diagonal distance for natural corner-drag feel
        const dx = (cx - resizeStart.current.x) / rect.width
        const dy = (cy - resizeStart.current.y) / rect.height
        const diag = (dx + dy) * 1.5
        const newScale = Math.max(0.2, Math.min(4.0, resizeStart.current.scale + diag))
        onScaleChange(newScale)
      })
    }

    const handleUp = () => {
      resizeStart.current = null
      setIsResizing(false)
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
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
  const hitPad = isInteractive ? 24 : 0 // extra touch area around poster (px)

  // --- Dynamic shadow & light based on poster position ---
  const dynamicShadow = useMemo(() => {
    // Light direction: continuous angle based on positionX
    // positionX=0 (left edge) → light from upper-left, shadow to lower-right
    // positionX=1 (right edge) → light from upper-right, shadow to lower-left
    const lightX = 1 - positionX
    const shadowOffsetX = (lightX - 0.5) * -14
    const shadowOffsetY = 3 + (1 - positionY) * 6

    // Scale affects shadow depth
    const depthFactor = Math.max(0.6, Math.min(2.0, scale))
    const blur = Math.round(12 * depthFactor)
    const spread = Math.round(1.5 * depthFactor)
    const opacity = Math.min(0.45, 0.20 + 0.08 * depthFactor)

    // Continuous light angle (not just 90/270) for smooth highlight movement
    const lightAngle = 270 * lightX + 90 * (1 - lightX) // 90..270 degrees
    const highlightOpacity = 0.04 + Math.abs(lightX - 0.5) * 0.08 // 0.04..0.08

    // Glass glare — diagonal streak
    const glareX = positionX * 100
    const glareAngle = 135 + (positionX - 0.5) * 20
    const glareIntensity = 0.06 + Math.abs(positionX - 0.5) * 0.06 // 0.06..0.09

    return {
      boxShadow: `${shadowOffsetX.toFixed(1)}px ${shadowOffsetY.toFixed(1)}px ${blur}px ${spread}px rgba(0,0,0,${opacity.toFixed(2)})`,
      lightAngle,
      highlightOpacity,
      glareX,
      glareAngle,
      glareIntensity,
    }
  }, [positionX, positionY, scale])

  return (
    <div ref={containerRef} className="group/mockup relative rounded-xl shadow-lg select-none" style={{ overflow: 'clip' }}>
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

      {/* Poster — draggable with generous touch area */}
      <div
        className={`absolute ${isInteractive ? 'cursor-pointer' : ''}`}
        style={{
          left: `calc(${placement.left * 100}% - ${hitPad}px)`,
          top: `calc(${placement.top * 100}% - ${hitPad}px)`,
          width: `calc(${placement.width * 100}% + ${hitPad * 2}px)`,
          height: `calc(${placement.height * 100}% + ${hitPad * 2}px)`,
          zIndex: 10,
          touchAction: 'none',
        }}
        onMouseDown={handleDragStart}
        onTouchStart={(e) => { handleDragStart(e); handleTouchStart(e) }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Visual poster — positioned exactly at placement coordinates */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${hitPad}px`,
            top: `${hitPad}px`,
            right: `${hitPad}px`,
            bottom: `${hitPad}px`,
          }}
        >
          <img
            src={designImageUrl}
            alt="Poster"
            className="w-full h-full"
            style={cropToCSS(cropMode, cropOffsetX, cropOffsetY)}
            draggable={false}
            onError={(e) => console.error('[MockupPreview] Image failed to load:', designImageUrl, e)}
          />
          {/* Light reflection overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(${dynamicShadow.lightAngle}deg, rgba(255,255,255,${dynamicShadow.highlightOpacity}) 0%, transparent 35%, rgba(0,0,0,0.02) 100%)`,
            }}
          />
          {/* Glass glare — only in realistic mode */}
          {realisticMode && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(
                  ${dynamicShadow.glareAngle}deg,
                  transparent ${dynamicShadow.glareX - 12}%,
                  rgba(255,255,255,${(dynamicShadow.glareIntensity * 0.25).toFixed(3)}) ${dynamicShadow.glareX - 5}%,
                  rgba(255,255,255,${(dynamicShadow.glareIntensity * 0.8).toFixed(3)}) ${dynamicShadow.glareX}%,
                  rgba(255,255,255,${(dynamicShadow.glareIntensity * 0.25).toFixed(3)}) ${dynamicShadow.glareX + 5}%,
                  transparent ${dynamicShadow.glareX + 12}%
                )`,
                mixBlendMode: 'soft-light',
              }}
            />
          )}
          {/* Room reflection in glass — only in realistic mode */}
          {realisticMode && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                opacity: 0.035,
                mixBlendMode: 'screen',
              }}
            >
              <img
                src={roomImageUrl}
                alt=""
                className="w-[140%] h-[140%] object-cover"
                draggable={false}
                style={{
                  filter: 'blur(24px) brightness(1.3)',
                  transform: `scaleX(-1) translate(${(positionX - 0.5) * -20}%, ${(positionY - 0.5) * -15}%)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resize corner handles — invisible but functional, cursor changes on hover */}
      {isInteractive && onScaleChange && (
        <>
          {[
            { corner: 'br', cursor: 'nwse-resize', left: `calc(${(placement.left + placement.width) * 100}% - 14px)`, top: `calc(${(placement.top + placement.height) * 100}% - 14px)` },
            { corner: 'bl', cursor: 'nesw-resize', left: `calc(${placement.left * 100}% - 14px)`, top: `calc(${(placement.top + placement.height) * 100}% - 14px)` },
            { corner: 'tr', cursor: 'nesw-resize', left: `calc(${(placement.left + placement.width) * 100}% - 14px)`, top: `calc(${placement.top * 100}% - 14px)` },
            { corner: 'tl', cursor: 'nwse-resize', left: `calc(${placement.left * 100}% - 14px)`, top: `calc(${placement.top * 100}% - 14px)` },
          ].map(({ corner, cursor, left, top }) => (
            <div
              key={corner}
              className="absolute z-20"
              style={{ left, top, width: '28px', height: '28px', cursor }}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
            />
          ))}
        </>
      )}

    </div>
  )
}
