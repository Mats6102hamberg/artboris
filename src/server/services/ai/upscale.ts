import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Target dimensions per sizeCode at given DPI
const SIZE_DIMENSIONS: Record<string, { widthCm: number; heightCm: number }> = {
  '21x30': { widthCm: 21, heightCm: 30 },
  'A4': { widthCm: 21, heightCm: 29.7 },
  '30x40': { widthCm: 30, heightCm: 40 },
  'A3': { widthCm: 29.7, heightCm: 42 },
  '50x70': { widthCm: 50, heightCm: 70 },
  '70x100': { widthCm: 70, heightCm: 100 },
}

export interface UpscaleInput {
  imageUrl: string
  upscaleFactor?: number // 2, 4, or 8 (8 = two-pass: 4× then 2×)
}

export interface UpscaleResult {
  url: string
  sourceWidthPx: number
  sourceHeightPx: number
  finalWidthPx: number
  finalHeightPx: number
  upscaleFactor: number
  upscaleProvider: string
}

/**
 * Single-pass upscale via Replicate Real-ESRGAN.
 * Supports scale 2 or 4.
 */
async function runSingleUpscale(imageUrl: string, scale: 2 | 4): Promise<string> {
  console.log(`[upscale] Running ${scale}× pass via Replicate...`)

  const output = await replicate.run(
    'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    {
      input: {
        image: imageUrl,
        scale,
        face_enhance: false,
      },
    },
  )

  // Output is a URL string or ReadableStream
  if (typeof output === 'string') {
    return output
  } else if (output && typeof output === 'object' && 'url' in (output as Record<string, unknown>)) {
    return (output as Record<string, unknown>).url as string
  }
  throw new Error(`[upscale] Unexpected Replicate output type: ${typeof output}`)
}

/**
 * Upscale an image using Replicate's Real-ESRGAN model.
 * - factor 2: single 2× pass
 * - factor 4: single 4× pass (default)
 * - factor 8: two-pass pipeline (4× → 2×) for premium/large formats
 */
export async function upscaleImage(input: UpscaleInput): Promise<UpscaleResult> {
  const factor = input.upscaleFactor ?? 4

  console.log(`[upscale] Starting ${factor}× upscale via Replicate...`)
  console.log(`[upscale] Source: ${input.imageUrl.slice(0, 80)}...`)

  let resultUrl: string

  if (factor === 8) {
    // Two-pass: 4× then 2×
    console.log(`[upscale] 8× mode: pass 1/2 (4×)`)
    const pass1Url = await runSingleUpscale(input.imageUrl, 4)
    console.log(`[upscale] 8× mode: pass 2/2 (2×)`)
    resultUrl = await runSingleUpscale(pass1Url, 2)
  } else if (factor === 2 || factor === 4) {
    resultUrl = await runSingleUpscale(input.imageUrl, factor)
  } else {
    throw new Error(`[upscale] Unsupported upscale factor: ${factor}. Use 2, 4, or 8.`)
  }

  console.log(`[upscale] Replicate returned result (${factor}×)`)

  // Source dimensions from DALL-E output (known: 1024×1792)
  const sourceWidthPx = 1024
  const sourceHeightPx = 1792

  return {
    url: resultUrl,
    sourceWidthPx,
    sourceHeightPx,
    finalWidthPx: sourceWidthPx * factor,
    finalHeightPx: sourceHeightPx * factor,
    upscaleFactor: factor,
    upscaleProvider: 'replicate',
  }
}

/**
 * Calculate target pixel dimensions for a given sizeCode and DPI.
 */
export function getTargetDimensions(sizeCode: string, dpi: number = 150) {
  const size = SIZE_DIMENSIONS[sizeCode]
  if (!size) return null

  const pxPerCm = dpi / 2.54
  return {
    widthPx: Math.round(size.widthCm * pxPerCm),
    heightPx: Math.round(size.heightCm * pxPerCm),
    dpi,
  }
}

/**
 * Check if upscaled dimensions meet the target DPI for a sizeCode.
 */
export function meetsTargetDpi(
  upscaledWidthPx: number,
  upscaledHeightPx: number,
  sizeCode: string,
  targetDpi: number = 150,
): boolean {
  const target = getTargetDimensions(sizeCode, targetDpi)
  if (!target) return true // unknown size, assume ok
  return upscaledWidthPx >= target.widthPx && upscaledHeightPx >= target.heightPx
}
