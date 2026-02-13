import { POSTER_SIZES, cmToPixels } from './resize'

export interface DpiResult {
  sizeId: string
  label: string
  widthCm: number
  heightCm: number
  requiredWidth: number
  requiredHeight: number
  actualDpi: number
  quality: 'perfect' | 'good' | 'fair' | 'low'
  needsUpscaling: boolean
}

/**
 * Analyze an image's print quality across all poster sizes.
 * Returns a quality rating for each size based on effective DPI.
 */
export function analyzePrintQuality(
  imageWidth: number,
  imageHeight: number,
): DpiResult[] {
  const imageAspect = imageWidth / imageHeight

  return POSTER_SIZES.map((size) => {
    const sizeAspect = size.widthCm / size.heightCm
    const requiredWidth = cmToPixels(size.widthCm, 300)
    const requiredHeight = cmToPixels(size.heightCm, 300)

    // Calculate effective DPI based on how the image would be cropped/fitted
    let effectiveDpi: number
    if (imageAspect > sizeAspect) {
      // Image is wider — height is the limiting factor
      effectiveDpi = (imageHeight / (size.heightCm / 2.54))
    } else {
      // Image is taller — width is the limiting factor
      effectiveDpi = (imageWidth / (size.widthCm / 2.54))
    }

    const actualDpi = Math.round(effectiveDpi)

    let quality: DpiResult['quality']
    if (actualDpi >= 250) quality = 'perfect'
    else if (actualDpi >= 180) quality = 'good'
    else if (actualDpi >= 120) quality = 'fair'
    else quality = 'low'

    return {
      sizeId: size.id,
      label: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      requiredWidth,
      requiredHeight,
      actualDpi,
      quality,
      needsUpscaling: actualDpi < 180,
    }
  })
}

/**
 * Get a human-readable quality label.
 */
export function getQualityLabel(quality: DpiResult['quality']): string {
  switch (quality) {
    case 'perfect': return 'Perfect for print'
    case 'good': return 'Good quality'
    case 'fair': return 'Needs AI upscaling'
    case 'low': return 'Too low resolution'
  }
}

/**
 * Get the best size recommendation for an image.
 */
export function getBestSize(imageWidth: number, imageHeight: number): DpiResult | null {
  const results = analyzePrintQuality(imageWidth, imageHeight)
  // Find the largest size that's still "perfect" or "good"
  const good = results.filter(r => r.quality === 'perfect' || r.quality === 'good')
  if (good.length === 0) return results[0] // smallest
  return good[good.length - 1] // largest good
}
