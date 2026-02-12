import OpenAI from 'openai'
import { DesignControls } from '@/types/design'
import { buildFinalRenderPrompt } from '@/lib/prompts/templates'
import { getSizeById, getPixelDimensions } from '@/lib/image/resize'
import { isDemoMode } from '@/lib/demo/demoImages'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface FinalPrintInput {
  originalPrompt: string
  controls: DesignControls
  sizeId: string
  variantSeed: number
}

export interface FinalPrintResult {
  success: boolean
  imageUrl: string | null
  widthPx: number
  heightPx: number
  error?: string
}

export async function generateFinalPrint(input: FinalPrintInput): Promise<FinalPrintResult> {
  const { originalPrompt, controls, sizeId } = input

  const size = getSizeById(sizeId)
  if (!size) {
    return {
      success: false,
      imageUrl: null,
      widthPx: 0,
      heightPx: 0,
      error: `Okänd storlek: ${sizeId}`,
    }
  }

  const { width: widthPx, height: heightPx } = getPixelDimensions(size)
  const prompt = buildFinalRenderPrompt(originalPrompt, controls, widthPx, heightPx)

  // Demo mode — return a placeholder final render
  if (isDemoMode()) {
    return {
      success: true,
      imageUrl: '/assets/demo/nordic-1.svg',
      widthPx,
      heightPx,
    }
  }

  try {
    // DALL-E 3 max is 1024x1792; for true print resolution
    // we'd need to upscale. For now, generate at max quality.
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1792',
      quality: 'hd',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      return {
        success: false,
        imageUrl: null,
        widthPx,
        heightPx,
        error: 'Ingen bild genererades för slutrender.',
      }
    }

    // TODO: Upscale to actual print dimensions using a super-resolution service
    // For now, return the HD DALL-E output

    return {
      success: true,
      imageUrl,
      widthPx,
      heightPx,
    }
  } catch (error) {
    console.error('[generateFinalPrint] Error:', error)
    return {
      success: false,
      imageUrl: null,
      widthPx,
      heightPx,
      error: error instanceof Error ? error.message : 'Okänt fel vid slutrender',
    }
  }
}
