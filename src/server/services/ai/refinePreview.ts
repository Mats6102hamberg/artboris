import OpenAI from 'openai'
import Replicate from 'replicate'
import { DesignControls, DesignVariant } from '@/types/design'
import { buildRefinePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'
import { isDemoMode } from '@/lib/demo/demoImages'
import { withAIRetry } from '@/server/services/ai/withAIRetry'

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

  // Demo mode — return a placeholder refined variant
  if (isDemoMode()) {
    const demoStyles = ['nordic', 'abstract', 'minimal', 'botanical', 'retro']
    const randomStyle = demoStyles[Math.floor(Math.random() * demoStyles.length)]
    const variant = Math.random() > 0.5 ? '1' : '2'
    return {
      success: true,
      variant: {
        id: `var_${Date.now()}_refined`,
        imageUrl: `/assets/demo/${randomStyle}-${variant}.svg`,
        thumbnailUrl: `/assets/demo/${randomStyle}-${variant}.svg`,
        seed: Math.floor(Math.random() * 999999),
        isSelected: false,
        createdAt: new Date().toISOString(),
      },
      prompt,
    }
  }

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
    const { data: response } = await withAIRetry({
      label: 'refinePreview',
      maxRetries: 3,
      primary: () => openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1792',
        quality: 'standard',
      }),
      fallback: async () => {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || '' })
        const output = await replicate.run(
          'black-forest-labs/flux-schnell' as `${string}/${string}`,
          {
            input: {
              prompt,
              num_outputs: 1,
              aspect_ratio: '2:3',
              output_format: 'webp',
              output_quality: 90,
            },
          }
        )
        const outputArr = Array.isArray(output) ? output : [output]
        const url = String(outputArr[0] || '')
        if (!url.startsWith('http')) throw new Error('Replicate returned no valid URL')
        return { data: [{ url }] } as OpenAI.Images.ImagesResponse
      },
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
      error: error instanceof Error ? error.message : 'Unknown error during refinement',
    }
  }
}
