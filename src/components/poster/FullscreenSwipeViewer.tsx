'use client'

import { useState, useRef, useCallback } from 'react'

interface FullscreenSwipeViewerProps {
  variants: { id: string; imageUrl: string }[]
  initialIndex: number
  onClose: () => void
  onSelect: (index: number) => void
  selectedIndex: number | null
}

export default function FullscreenSwipeViewer({
  variants,
  initialIndex,
  onClose,
  onSelect,
  selectedIndex,
}: FullscreenSwipeViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalSwipe.current = null
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy)
      }
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault()
      setDragX(dx)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    const minSwipe = 50

    if (isHorizontalSwipe.current) {
      if (dragX < -minSwipe && currentIndex < variants.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (dragX > minSwipe && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }

    setDragX(0)
    isHorizontalSwipe.current = null
  }, [dragX, currentIndex, variants.length])

  const variant = variants[currentIndex]
  if (!variant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full">
        {currentIndex + 1} / {variants.length}
      </div>

      {/* Image area with swipe */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={variant.imageUrl}
          alt={`Variant ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* Bottom controls */}
      <div className="pb-8 pt-4 px-4 flex flex-col items-center gap-4">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {variants.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'w-3 h-3 bg-white'
                  : i === selectedIndex
                    ? 'w-2.5 h-2.5 bg-purple-400'
                    : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Select button */}
        <button
          onClick={() => onSelect(currentIndex)}
          className={`px-8 py-3 rounded-full font-medium text-sm transition-all ${
            selectedIndex === currentIndex
              ? 'bg-purple-500 text-white'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {selectedIndex === currentIndex ? '✓ Vald variant' : 'Välj denna variant'}
        </button>
      </div>
    </div>
  )
}
