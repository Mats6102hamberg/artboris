'use client'

import { useMemo } from 'react'
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
}: MockupPreviewProps) {
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

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      <img src={roomImageUrl} alt="Rum" className="w-full" />

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

      {/* Poster */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${placement.left * 100}%`,
          top: `${placement.top * 100}%`,
          width: `${placement.width * 100}%`,
          height: `${placement.height * 100}%`,
          zIndex: 10,
        }}
      >
        <img
          src={designImageUrl}
          alt="Poster"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
