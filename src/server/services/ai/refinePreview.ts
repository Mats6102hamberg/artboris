import OpenAI from 'openai'
import { DesignControls, DesignVariant } from '@/types/design'
import { buildRefinePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface RefinePreviewInput {
  originalPrompt: string
  feedback: string
  controls: DesignControls
}

export interface RefinePreviewResult {
  success: boolean
  variant: Omit<DesignVariant, 'designId'> | null
  prompt: string
  error?: string
}

export async function refinePreview(input: RefinePreviewInput): Promise<RefinePreviewResult> {
  const { originalPrompt, feedback, controls } = input

  const prompt = buildRefinePrompt(originalPrompt, feedback, controls)

  const safetyCheck = checkPromptSafety(prompt)
  if (!safetyCheck.safe) {
    return {
      success: false,
      variant: null,
      prompt,
      error: safetyCheck.reason,
    }
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1792',
      quality: 'standard',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      return {
        success: false,
        variant: null,
        prompt,
        error: 'Ingen bild genererades.',
      }
    }

    return {
      success: true,
      variant: {
        id: `var_${Date.now()}_refined`,
        imageUrl,
        thumbnailUrl: imageUrl,
        seed: Math.floor(Math.random() * 999999),
        isSelected: false,
        createdAt: new Date().toISOString(),
      },
      prompt,
    }
  } catch (error) {
    console.error('[refinePreview] Error:', error)
    return {
      success: false,
      variant: null,
      prompt,
      error: error instanceof Error ? error.message : 'Okänt fel vid förfining',
    }
  }
}
