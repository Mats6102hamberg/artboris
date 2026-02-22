/**
 * Server-side preview pipeline for public image serving.
 *
 * TODO: Phase 2 — Apply watermark overlay to preview images before serving.
 * This module will:
 * 1. Accept a Blob URL or image key
 * 2. Fetch the thumbnail (max 600px)
 * 3. Apply a subtle diagonal watermark (e.g. "ARTBORIS PREVIEW")
 * 4. Cache the result (in-memory or Blob storage)
 * 5. Return the watermarked buffer
 *
 * For now, this is a stub that passes through the original thumbnail URL.
 * Enable watermarking by implementing applyServerWatermark().
 */

// import sharp from 'sharp'  // Uncomment when implementing watermark

export interface PreviewOptions {
  /** Max width of the preview image */
  maxWidth?: number
  /** Whether to apply watermark overlay */
  watermark?: boolean
  /** Watermark text */
  watermarkText?: string
}

const DEFAULT_OPTIONS: PreviewOptions = {
  maxWidth: 600,
  watermark: false,
  watermarkText: 'ARTBORIS PREVIEW',
}

/**
 * Get a preview-safe URL for a given image.
 * Currently returns thumbnailUrl as-is.
 * When watermarking is enabled, this will return a proxied URL.
 */
export function getPreviewUrl(
  thumbnailUrl: string | null,
  imageUrl: string,
  _options?: PreviewOptions,
): string {
  // Always prefer thumbnail (600px) over full image
  return thumbnailUrl || imageUrl
}

/**
 * TODO: Implement server-side watermark application.
 * This will use Sharp to composite a semi-transparent text overlay.
 *
 * Example implementation:
 * ```
 * export async function applyServerWatermark(
 *   imageBuffer: Buffer,
 *   options: PreviewOptions = DEFAULT_OPTIONS,
 * ): Promise<Buffer> {
 *   const { maxWidth = 600, watermarkText = 'ARTBORIS PREVIEW' } = options
 *   const image = sharp(imageBuffer)
 *   const metadata = await image.metadata()
 *   const width = Math.min(metadata.width || 600, maxWidth)
 *
 *   // Create SVG watermark overlay
 *   const svgOverlay = Buffer.from(`
 *     <svg width="${width}" height="${Math.round(width * 1.33)}">
 *       <style>
 *         text { fill: rgba(0,0,0,0.12); font-size: ${Math.round(width * 0.06)}px; font-family: sans-serif; }
 *       </style>
 *       <text x="50%" y="50%" text-anchor="middle" transform="rotate(-30, ${width/2}, ${Math.round(width*0.66)})">${watermarkText}</text>
 *     </svg>
 *   `)
 *
 *   return image
 *     .resize(width)
 *     .composite([{ input: svgOverlay, gravity: 'center' }])
 *     .jpeg({ quality: 80 })
 *     .toBuffer()
 * }
 * ```
 */
export const WATERMARK_ENABLED = false
