/**
 * Client-side watermark overlay for preview images.
 * Prevents downloading unwatermarked previews before purchase.
 */
export function applyCanvasWatermark(
  canvas: HTMLCanvasElement,
  text: string = 'POSTER LAB PREVIEW'
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas

  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#000000'
  ctx.font = `${Math.max(16, width * 0.04)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Diagonal watermark pattern
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)

  const spacing = Math.max(100, height * 0.15)
  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing * 2) {
      ctx.fillText(text, x - width / 2, y - height / 2)
    }
  }

  ctx.restore()
}

/**
 * Generate a watermark overlay as a data URL for CSS background.
 */
export function generateWatermarkDataUrl(
  width: number = 400,
  height: number = 200,
  text: string = 'PREVIEW'
): string {
  if (typeof document === 'undefined') return ''

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#666666'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.fillText(text, 0, 0)

  return canvas.toDataURL('image/png')
}
