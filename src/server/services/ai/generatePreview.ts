import OpenAI from 'openai'
import { StylePreset, DesignControls, DesignVariant } from '@/types/design'
import { buildGeneratePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface GeneratePreviewInput {
  style: StylePreset
  controls: DesignControls
  userDescription?: string
  count?: number
}

export interface GeneratePreviewResult {
  success: boolean
  variants: Omit<DesignVariant, 'designId'>[]
  prompt: string
  error?: string
}

export async function generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewResult> {
  const { style, controls, userDescription, count = 4 } = input

  const prompt = buildGeneratePrompt(style, controls, userDescription)

  const safetyCheck = checkPromptSafety(prompt)
  if (!safetyCheck.safe) {
    return {
      success: false,
      variants: [],
      prompt,
      error: safetyCheck.reason,
    }
  }

  try {
    // Generate variants in parallel
    const promises = Array.from({ length: count }, (_, i) =>
      generateSingleVariant(prompt, i)
    )

    const results = await Promise.allSettled(promises)
    const variants: Omit<DesignVariant, 'designId'>[] = []

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        variants.push(result.value)
      }
    }

    if (variants.length === 0) {
      return {
        success: false,
        variants: [],
        prompt,
        error: 'Kunde inte generera några varianter. Försök igen.',
      }
    }

    return { success: true, variants, prompt }
  } catch (error) {
    console.error('[generatePreview] Error:', error)
    return {
      success: false,
      variants: [],
      prompt,
      error: error instanceof Error ? error.message : 'Okänt fel vid generering',
    }
  }
}

async function generateSingleVariant(
  prompt: string,
  index: number
): Promise<Omit<DesignVariant, 'designId'> | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1792', // Portrait 2:3-ish
      quality: 'standard',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) return null

    const seed = Math.floor(Math.random() * 999999)

    return {
      id: `var_${Date.now()}_${index}`,
      imageUrl,
      thumbnailUrl: imageUrl, // Same for now; could resize later
      seed,
      isSelected: false,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`[generateSingleVariant] Variant ${index} failed:`, error)
    return null
  }
}
