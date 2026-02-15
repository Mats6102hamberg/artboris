import sharp from 'sharp'
import { POSTER_SIZES, cmToPixels } from './resize'

/**
 * Crimson print specs:
 * - Optimal: 300 DPI (perfect)
 * - Acceptable: 200+ DPI (good)
 * - Minimum: 150 DPI (fair — visible softness at close range)
 * - Below 150: low quality, not recommended
 *
 * Max long side cap: 15000px (beyond this = unnecessary data, slow uploads)
 * Min long side: 1500px (below = too small for any print)
 * Output: sRGB, high-quality JPEG for print, PNG preserved if input is PNG
 */

const MAX_LONG_SIDE = 15000
const MIN_LONG_SIDE = 1500
const PRINT_JPEG_QUALITY = 95
const THUMBNAIL_WIDTH = 600

export interface PrintSizeQuality {
  sizeId: string
  label: string
  widthCm: number
  heightCm: number
  requiredWidthPx: number
  requiredHeightPx: number
  effectiveDpi: number
  quality: 'perfect' | 'good' | 'fair' | 'low'
}

export interface OptimizeResult {
  printBuffer: Buffer
  thumbnailBuffer: Buffer
  printMimeType: string
  originalWidthPx: number
  originalHeightPx: number
  optimizedWidthPx: number
  optimizedHeightPx: number
  wasResized: boolean
  resizeDirection: 'none' | 'downscaled' | 'unchanged'
  sizeQualities: PrintSizeQuality[]
  maxPrintSize: string | null
  overallQuality: string
}

/**
 * Analyze print quality for all poster sizes given image dimensions.
 */
export function analyzeSizeQualities(
  imageWidth: number,
  imageHeight: number,
): PrintSizeQuality[] {
  const imageAspect = imageWidth / imageHeight

  return POSTER_SIZES.map((size) => {
    const sizeAspect = size.widthCm / size.heightCm
    const requiredWidthPx = cmToPixels(size.widthCm, 300)
    const requiredHeightPx = cmToPixels(size.heightCm, 300)

    // Effective DPI: how the image maps to this print size (cover crop)
    let effectiveDpi: number
    if (imageAspect > sizeAspect) {
      // Image wider than target — height is limiting
      effectiveDpi = imageHeight / (size.heightCm / 2.54)
    } else {
      // Image taller than target — width is limiting
      effectiveDpi = imageWidth / (size.widthCm / 2.54)
    }

    effectiveDpi = Math.round(effectiveDpi)

    let quality: PrintSizeQuality['quality']
    if (effectiveDpi >= 250) quality = 'perfect'
    else if (effectiveDpi >= 200) quality = 'good'
    else if (effectiveDpi >= 150) quality = 'fair'
    else quality = 'low'

    return {
      sizeId: size.id,
      label: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      requiredWidthPx,
      requiredHeightPx,
      effectiveDpi,
      quality,
    }
  })
}

/**
 * Find the largest print size with acceptable quality (≥200 DPI).
 */
function findMaxPrintSize(qualities: PrintSizeQuality[]): string | null {
  const acceptable = qualities.filter(q => q.quality === 'perfect' || q.quality === 'good')
  if (acceptable.length === 0) return null
  // Sizes are ordered small→large, pick last acceptable
  return acceptable[acceptable.length - 1].sizeId
}

/**
 * Main pipeline: optimize an uploaded artwork image for Crimson print production.
 *
 * Steps:
 * 1. Read metadata (dimensions, format, color space)
 * 2. Validate minimum resolution
 * 3. Convert to sRGB if needed
 * 4. Downscale if exceeding MAX_LONG_SIDE (cap huge files)
 * 5. Generate high-quality print version (JPEG 95% or PNG)
 * 6. Generate thumbnail (600px wide, JPEG)
 * 7. Analyze DPI quality per print size
 */
export async function optimizeForPrint(inputBuffer: Buffer): Promise<OptimizeResult> {
  // Step 1: Read metadata
  const metadata = await sharp(inputBuffer).metadata()
  const origW = metadata.width!
  const origH = metadata.height!
  const format = metadata.format // jpeg, png, webp, tiff, etc.

  const longSide = Math.max(origW, origH)

  // Step 2: Validate minimum
  if (longSide < MIN_LONG_SIDE) {
    throw new Error(
      `Bilden är för liten (${origW}×${origH}px). Minsta krav: ${MIN_LONG_SIDE}px på längsta sidan.`
    )
  }

  // Step 3-4: Process — sRGB + optional downscale
  let pipeline = sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF
    .toColorspace('srgb') // Ensure sRGB for consistent print colors

  let optimizedW = origW
  let optimizedH = origH
  let wasResized = false
  let resizeDirection: OptimizeResult['resizeDirection'] = 'none'

  if (longSide > MAX_LONG_SIDE) {
    // Downscale — preserve aspect ratio
    if (origW > origH) {
      pipeline = pipeline.resize(MAX_LONG_SIDE, null, { fit: 'inside', withoutEnlargement: true })
      optimizedW = MAX_LONG_SIDE
      optimizedH = Math.round(origH * (MAX_LONG_SIDE / origW))
    } else {
      pipeline = pipeline.resize(null, MAX_LONG_SIDE, { fit: 'inside', withoutEnlargement: true })
      optimizedH = MAX_LONG_SIDE
      optimizedW = Math.round(origW * (MAX_LONG_SIDE / origH))
    }
    wasResized = true
    resizeDirection = 'downscaled'
  }

  // Step 5: Output print-ready version
  // Keep PNG if input was PNG (transparency), otherwise JPEG for smaller files
  let printBuffer: Buffer
  let printMimeType: string

  if (format === 'png') {
    printBuffer = await pipeline.png({ quality: 100 }).toBuffer()
    printMimeType = 'image/png'
  } else {
    printBuffer = await pipeline
      .jpeg({ quality: PRINT_JPEG_QUALITY, chromaSubsampling: '4:4:4' })
      .toBuffer()
    printMimeType = 'image/jpeg'
  }

  // Get actual output dimensions
  const outputMeta = await sharp(printBuffer).metadata()
  optimizedW = outputMeta.width!
  optimizedH = outputMeta.height!

  // Step 6: Generate thumbnail
  const thumbnailBuffer = await sharp(printBuffer)
    .resize(THUMBNAIL_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()

  // Step 7: Analyze quality per print size
  const sizeQualities = analyzeSizeQualities(optimizedW, optimizedH)
  const maxPrintSize = findMaxPrintSize(sizeQualities)

  // Overall quality = quality at the largest common size (50×70)
  const target50x70 = sizeQualities.find(q => q.sizeId === '50x70')
  const overallQuality = target50x70?.quality || sizeQualities[sizeQualities.length - 1]?.quality || 'low'

  return {
    printBuffer,
    thumbnailBuffer,
    printMimeType,
    originalWidthPx: origW,
    originalHeightPx: origH,
    optimizedWidthPx: optimizedW,
    optimizedHeightPx: optimizedH,
    wasResized,
    resizeDirection,
    sizeQualities,
    maxPrintSize,
    overallQuality,
  }
}
