/**
 * Shared crop logic used by both MockupPreview (CSS) and print-render (server-side).
 * Ensures pixel-perfect consistency between what the user sees and what gets printed.
 *
 * CropMode:
 *   COVER   — fill target area, crop overflow (default, matches CSS object-cover)
 *   CONTAIN — fit entire image inside target, may have letterbox
 *   FILL    — stretch to fill (distorts aspect ratio)
 *
 * cropOffsetX/Y: shift the crop window (-1 to 1, 0 = centered)
 */

export type CropMode = 'COVER' | 'CONTAIN' | 'FILL'

export interface CropRect {
  /** Source image crop (pixels from top-left of source) */
  sx: number
  sy: number
  sw: number
  sh: number
  /** Destination rect (pixels in target canvas) */
  dx: number
  dy: number
  dw: number
  dh: number
}

/**
 * Calculate the crop rect for rendering a source image into a target area.
 *
 * @param srcW  Source image width (px)
 * @param srcH  Source image height (px)
 * @param tgtW  Target area width (px)
 * @param tgtH  Target area height (px)
 * @param mode  CropMode (COVER, CONTAIN, FILL)
 * @param offsetX  Horizontal offset (-1 to 1, 0 = centered)
 * @param offsetY  Vertical offset (-1 to 1, 0 = centered)
 */
export function calculateCropRect(
  srcW: number,
  srcH: number,
  tgtW: number,
  tgtH: number,
  mode: CropMode = 'COVER',
  offsetX: number = 0,
  offsetY: number = 0,
): CropRect {
  const srcAspect = srcW / srcH
  const tgtAspect = tgtW / tgtH

  if (mode === 'FILL') {
    // Stretch — use entire source, fill entire target
    return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: 0, dy: 0, dw: tgtW, dh: tgtH }
  }

  if (mode === 'CONTAIN') {
    // Fit entire image inside target (letterbox)
    let dw: number, dh: number
    if (srcAspect > tgtAspect) {
      // Source is wider → fit by width
      dw = tgtW
      dh = tgtW / srcAspect
    } else {
      // Source is taller → fit by height
      dh = tgtH
      dw = tgtH * srcAspect
    }
    const dx = (tgtW - dw) / 2
    const dy = (tgtH - dh) / 2
    return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx, dy, dw, dh }
  }

  // COVER — fill target, crop overflow
  let sw: number, sh: number
  if (srcAspect > tgtAspect) {
    // Source is wider than target → crop horizontally
    sh = srcH
    sw = srcH * tgtAspect
  } else {
    // Source is taller than target → crop vertically
    sw = srcW
    sh = srcW / tgtAspect
  }

  // Center + apply offset
  // offsetX/Y range: -1 to 1, where 0 = centered
  const maxOffsetX = srcW - sw
  const maxOffsetY = srcH - sh
  const sx = Math.max(0, Math.min(maxOffsetX, (maxOffsetX / 2) + (offsetX * maxOffsetX / 2)))
  const sy = Math.max(0, Math.min(maxOffsetY, (maxOffsetY / 2) + (offsetY * maxOffsetY / 2)))

  return { sx, sy, sw, sh, dx: 0, dy: 0, dw: tgtW, dh: tgtH }
}

/**
 * Convert CropMode + offset to CSS object-fit + object-position.
 * Used by MockupPreview for browser rendering.
 */
export function cropToCSS(
  mode: CropMode = 'COVER',
  offsetX: number = 0,
  offsetY: number = 0,
): { objectFit: 'cover' | 'contain' | 'fill'; objectPosition: string } {
  const fitMap: Record<CropMode, 'cover' | 'contain' | 'fill'> = {
    COVER: 'cover',
    CONTAIN: 'contain',
    FILL: 'fill',
  }

  // Convert offset (-1 to 1) to percentage (0% to 100%)
  const posX = Math.round(50 + offsetX * 50)
  const posY = Math.round(50 + offsetY * 50)

  return {
    objectFit: fitMap[mode],
    objectPosition: `${posX}% ${posY}%`,
  }
}
