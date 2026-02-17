/**
 * High-resolution export utilities for Wallcraft creative tools.
 *
 * Display canvas is kept small (600px) for fast interaction.
 * At export time, we upscale to print-quality resolution.
 *
 * Target: 70×100 cm @ 250 DPI = 6890×9843 px
 * We export square canvases at 6000×6000 px which gives:
 *   - 50×50 cm @ 305 DPI (perfect)
 *   - 50×70 cm @ 217 DPI (good)
 *   - 70×100 cm @ 152 DPI (fair — acceptable for wall art viewed from distance)
 */

/** Default high-res export size in pixels */
export const HIRES_EXPORT_SIZE = 6000

/** Internal render scale factor (canvas.width = displaySize * RENDER_SCALE) */
export const RENDER_SCALE = 4

/**
 * Upscale a canvas to high resolution for print export.
 * Uses browser's built-in high-quality image smoothing.
 */
export function upscaleCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetSize: number = HIRES_EXPORT_SIZE
): HTMLCanvasElement {
  const hiRes = document.createElement('canvas')
  hiRes.width = targetSize
  hiRes.height = targetSize
  const ctx = hiRes.getContext('2d')
  if (!ctx) return sourceCanvas

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, 0, 0, targetSize, targetSize)

  return hiRes
}

/**
 * Export a canvas as a high-quality JPEG blob at the specified resolution.
 * JPEG 95% gives excellent print quality at ~2-5 MB instead of 20-50 MB for PNG.
 */
export async function exportHiResPng(
  sourceCanvas: HTMLCanvasElement,
  targetSize: number = HIRES_EXPORT_SIZE
): Promise<Blob> {
  const hiRes = upscaleCanvas(sourceCanvas, targetSize)

  // Fill white background (JPEG has no transparency)
  const final = document.createElement('canvas')
  final.width = hiRes.width
  final.height = hiRes.height
  const ctx = final.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, final.width, final.height)
  ctx.drawImage(hiRes, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) =>
    final.toBlob(resolve, 'image/jpeg', 0.95)
  )
  if (!blob) throw new Error('High-res export failed')
  return blob
}
