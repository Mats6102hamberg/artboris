'use client'

import { useCallback } from 'react'

interface ProtectedImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  /** Extra classes on the outer wrapper */
  wrapperClassName?: string
  /** Children rendered inside the overlay (badges, hover effects, etc.) */
  children?: React.ReactNode
}

/**
 * Image component with basic anti-casual-copy protections:
 * - Right-click blocked on image area
 * - Drag disabled
 * - Transparent overlay captures pointer events
 * - user-select: none
 *
 * NOTE: This does NOT prevent determined users (dev tools, network tab).
 * It prevents casual right-click-save and drag-to-desktop.
 */
export default function ProtectedImage({
  src,
  alt,
  className = '',
  style,
  loading = 'lazy',
  wrapperClassName = '',
  children,
}: ProtectedImageProps) {
  const blockContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const blockDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div
      className={`relative select-none ${wrapperClassName}`}
      onContextMenu={blockContext}
      onDragStart={blockDrag}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        draggable={false}
        onContextMenu={blockContext}
        onDragStart={blockDrag}
      />
      {/* Transparent overlay to intercept pointer events on the image */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'transparent' }}
        onContextMenu={blockContext}
        onDragStart={blockDrag}
      />
      {/* Children (badges, hover overlays) rendered above the protection layer */}
      {children && (
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <div className="pointer-events-auto w-full h-full">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
