'use client'

import { useState, useRef, useCallback } from 'react'

interface WallMarkerProps {
  imageUrl: string
  corners: { x: number; y: number }[]
  onCornersChange: (corners: { x: number; y: number }[]) => void
  maxCorners?: number
}

export default function WallMarker({
  imageUrl,
  corners,
  onCornersChange,
  maxCorners = 4,
}: WallMarkerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (draggingIndex !== null) return
    if (corners.length >= maxCorners) return

    const pos = getRelativePosition(e)
    onCornersChange([...corners, pos])
  }, [corners, maxCorners, draggingIndex, getRelativePosition, onCornersChange])

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingIndex(index)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getRelativePosition(moveEvent)
      const newCorners = [...corners]
      newCorners[index] = pos
      onCornersChange(newCorners)
    }

    const handleMouseUp = () => {
      setDraggingIndex(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [corners, getRelativePosition, onCornersChange])

  const handleRemoveCorner = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newCorners = corners.filter((_, i) => i !== index)
    onCornersChange(newCorners)
  }, [corners, onCornersChange])

  const cornerLabels = ['Uppe vänster', 'Uppe höger', 'Nere höger', 'Nere vänster']

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">
          Markera väggens 4 hörn ({corners.length}/{maxCorners})
        </p>
        {corners.length > 0 && (
          <button
            onClick={() => onCornersChange([])}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Rensa alla
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative rounded-xl overflow-hidden cursor-crosshair select-none"
      >
        <img src={imageUrl} alt="Rum" className="w-full" draggable={false} />

        {/* Overlay polygon */}
        {corners.length >= 3 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polygon
              points={corners.map(c => `${c.x * 100}%,${c.y * 100}%`).join(' ')}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          </svg>
        )}

        {/* Lines between corners */}
        {corners.length >= 2 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {corners.map((corner, i) => {
              const next = corners[(i + 1) % corners.length]
              if (i >= corners.length - 1 && corners.length < maxCorners) return null
              return (
                <line
                  key={i}
                  x1={`${corner.x * 100}%`}
                  y1={`${corner.y * 100}%`}
                  x2={`${next.x * 100}%`}
                  y2={`${next.y * 100}%`}
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              )
            })}
          </svg>
        )}

        {/* Corner markers */}
        {corners.map((corner, index) => (
          <div
            key={index}
            onMouseDown={(e) => handleMouseDown(index, e)}
            onDoubleClick={(e) => handleRemoveCorner(index, e)}
            className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10"
            style={{
              left: `${corner.x * 100}%`,
              top: `${corner.y * 100}%`,
            }}
          >
            <div className="w-full h-full rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              {cornerLabels[index] || `Punkt ${index + 1}`}
            </span>
          </div>
        ))}

        {/* Instruction overlay */}
        {corners.length < maxCorners && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            Klicka för att placera {cornerLabels[corners.length] || 'nästa punkt'}
          </div>
        )}
      </div>
    </div>
  )
}
