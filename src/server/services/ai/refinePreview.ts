import OpenAI from 'openai'
import Replicate from 'replicate'
import { StylePreset, DesignControls, DesignVariant, AspectRatio, ASPECT_RATIO_MAP } from '@/types/design'
import { buildRefinePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'
import { isDemoMode } from '@/lib/demo/demoImages'
import { withAIRetry } from '@/server/services/ai/withAIRetry'
import { isBorisStyle, STYLE_DEFINITIONS } from '@/lib/prompts/styles'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface RefinePreviewInput {
  originalPrompt: string
  feedback: string
  controls: DesignControls
  style?: StylePreset
  aspectRatio?: AspectRatio
}

export interface RefinePreviewResult {
  success: boolean
  variant: Omit<DesignVariant, 'designId'> | null
  prompt: string
  error?: string
}

export async function refinePreview(input: RefinePreviewInput): Promise<RefinePreviewResult> {
  const { originalPrompt, feedback, controls, style, aspectRatio = 'portrait' } = input
  const arConfig = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP.portrait

  const prompt = buildRefinePrompt(originalPrompt, feedback, controls, style)

  // Get negative prompt for Boris styles
  const negativePrompt = style ? STYLE_DEFINITIONS[style]?.negativePrompt : undefined
  const useBoris = style ? isBorisStyle(style) : false

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
        size: arConfig.dalle as '1024x1792' | '1792x1024' | '1024x1024',
        quality: 'standard',
      }),
      fallback: async () => {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || '' })
        const replicateModel = useBoris
          ? 'black-forest-labs/flux-dev'
          : 'black-forest-labs/flux-schnell'
        const replicateInput: Record<string, unknown> = {
          prompt,
          num_outputs: 1,
          aspect_ratio: arConfig.flux,
          output_format: 'webp',
          output_quality: 90,
        }
        if (useBoris) {
          replicateInput.num_inference_steps = 28
          if (negativePrompt) {
            replicateInput.negative_prompt = negativePrompt
          }
        }
        const output = await replicate.run(
          replicateModel as `${string}/${string}`,
          { input: replicateInput }
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
