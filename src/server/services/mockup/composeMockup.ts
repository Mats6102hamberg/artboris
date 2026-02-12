import { MockupConfig, WallCorner } from '@/types/design'
import { calculatePosterPlacement } from '@/lib/image/transform'
import { getFrameById } from '@/lib/pricing/prints'
import { getSizeById } from '@/lib/image/resize'

export interface ComposeMockupInput {
  roomImageUrl: string
  designImageUrl: string
  config: MockupConfig
}

export interface ComposeMockupResult {
  success: boolean
  mockupUrl: string | null
  cssOverlay: MockupCSSOverlay | null
  error?: string
}

export interface MockupCSSOverlay {
  posterStyle: React.CSSProperties
  frameStyle: React.CSSProperties
  shadowStyle: React.CSSProperties
}

/**
 * Generate a client-side CSS-based mockup overlay.
 * This positions the poster on the room photo using CSS transforms.
 * For final renders, a server-side compositing pipeline would be used.
 */
export function composeMockupCSS(input: ComposeMockupInput): ComposeMockupResult {
  const { roomImageUrl, designImageUrl, config } = input

  if (!roomImageUrl || !designImageUrl) {
    return {
      success: false,
      mockupUrl: null,
      cssOverlay: null,
      error: 'Rum- eller designbild saknas.',
    }
  }

  const frame = getFrameById(config.frameId)
  const size = getSizeById(config.sizeId)

  if (!size) {
    return {
      success: false,
      mockupUrl: null,
      cssOverlay: null,
      error: `Okänd storlek: ${config.sizeId}`,
    }
  }

  const posterAspect = size.widthCm / size.heightCm
  const placement = calculatePosterPlacement(
    config.wallCorners,
    config.positionX,
    config.positionY,
    config.scale,
    posterAspect
  )

  const frameWidthPx = frame ? frame.width * 0.3 : 0 // Scale mm to approx px

  const posterStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${placement.left * 100}%`,
    top: `${placement.top * 100}%`,
    width: `${placement.width * 100}%`,
    height: `${placement.height * 100}%`,
    backgroundImage: `url(${designImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: `rotate(${config.rotation}deg)`,
    zIndex: 10,
  }

  const frameStyle: React.CSSProperties = frame && frame.id !== 'none'
    ? {
        position: 'absolute',
        left: `${(placement.left * 100) - (frameWidthPx / 10)}%`,
        top: `${(placement.top * 100) - (frameWidthPx / 10)}%`,
        width: `calc(${placement.width * 100}% + ${frameWidthPx * 2}px)`,
        height: `calc(${placement.height * 100}% + ${frameWidthPx * 2}px)`,
        border: `${frameWidthPx}px solid ${frame.color}`,
        boxSizing: 'border-box' as const,
        transform: `rotate(${config.rotation}deg)`,
        zIndex: 9,
      }
    : {}

  const shadowStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${placement.left * 100}%`,
    top: `${placement.top * 100}%`,
    width: `${placement.width * 100}%`,
    height: `${placement.height * 100}%`,
    boxShadow: '4px 6px 20px rgba(0,0,0,0.35)',
    transform: `rotate(${config.rotation}deg)`,
    zIndex: 8,
  }

  return {
    success: true,
    mockupUrl: null, // CSS-based, no composed image URL
    cssOverlay: { posterStyle, frameStyle, shadowStyle },
  }
}
