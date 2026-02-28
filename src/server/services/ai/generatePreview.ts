import Replicate from 'replicate'
import OpenAI from 'openai'
import { StylePreset, DesignControls, DesignVariant, AspectRatio, ASPECT_RATIO_MAP } from '@/types/design'
import { buildGeneratePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'
import { isDemoMode, getDemoVariants } from '@/lib/demo/demoImages'
import { isBorisStyle, isArtistStyle } from '@/lib/prompts/styles'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { withAIRetry } from '@/server/services/ai/withAIRetry'
import { sendAIAdminAlert } from '@/server/services/email/adminAlert'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export interface GeneratePreviewInput {
  style: StylePreset
  controls: DesignControls
  userDescription?: string
  count?: number
  anonId?: string
  roomImageUrl?: string
  wallCorners?: string
  inputImageUrl?: string
  promptStrength?: number
  aspectRatio?: AspectRatio
  quality?: 'preview' | 'standard'
}

export interface GeneratePreviewResult {
  success: boolean
  variants: Omit<DesignVariant, 'designId'>[]
  prompt: string
  designId?: string
  error?: string
}

export async function generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewResult> {
  const { style, controls, userDescription, count = 4, inputImageUrl, promptStrength, aspectRatio = 'portrait', quality = 'standard' } = input

  const { prompt, negativePrompt } = buildGeneratePrompt(style, controls, userDescription)

  let variants: Omit<DesignVariant, 'designId'>[] = []

  // Demo mode — use placeholder images when no API key is set
  if (isDemoMode()) {
    const demoVariants = getDemoVariants(style)
    variants = demoVariants.map((v) => ({
      id: v.id,
      imageUrl: v.imageUrl,
      thumbnailUrl: v.thumbnailUrl,
      seed: v.seed,
      isSelected: false,
      createdAt: new Date().toISOString(),
    }))
  } else {
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
        generateSingleVariant(prompt, i, style, negativePrompt, inputImageUrl, promptStrength, aspectRatio, quality)
      )

      const results = await Promise.allSettled(promises)

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          variants.push(result.value)
        }
      }

      // Alert admin if some variants failed
      const failedCount = results.filter(r => r.status === 'rejected').length
      if (failedCount > 0 && variants.length > 0) {
        sendAIAdminAlert({
          type: 'fallback_triggered',
          service: `generatePreview (${failedCount}/${count} variants failed)`,
          error: 'Partial failure in variant generation',
          timestamp: new Date().toISOString(),
        }).catch(() => {})
      }

      if (variants.length === 0) {
        sendAIAdminAlert({
          type: 'complete_failure',
          service: 'generatePreview',
          error: 'All variants failed',
          timestamp: new Date().toISOString(),
        }).catch(() => {})

        return {
          success: false,
          variants: [],
          prompt,
          error: 'Bildgenereringen misslyckades. Kontrollera att din Replicate API-nyckel är giltig och har tillräckligt med kredit.',
        }
      }
    } catch (error) {
      console.error('[generatePreview] Error:', error)
      return {
        success: false,
        variants: [],
        prompt,
        error: error instanceof Error ? error.message : 'Unknown error during generation',
      }
    }
  }

  // Persist to DB (both demo and real mode)
  let designId: string | undefined
  if (variants.length > 0) {
    const userId = input.anonId || 'anonymous'
    try {
      const design = await prisma.design.create({
        data: {
          userId,
          title: `${style} design`,
          imageUrl: variants[0].imageUrl,
          style,
          prompt,
          isAiGenerated: true,
          isPublic: true,
          aspectRatio,
          roomImageUrl: input.roomImageUrl || null,
          wallCorners: input.wallCorners || null,
          variants: {
            create: variants.map((v, i) => ({
              id: v.id,
              imageUrl: v.imageUrl,
              thumbnailUrl: v.thumbnailUrl,
              seed: v.seed,
              sortOrder: i,
            })),
          },
        },
      })
      designId = design.id
      console.log(`[generatePreview] Design saved: ${designId} with ${variants.length} variants`)
    } catch (dbErr) {
      console.error('[generatePreview] DB save failed (non-blocking):', dbErr)
    }
  }

  return { success: true, variants, prompt, designId }
}

async function generateSingleVariant(
  prompt: string,
  index: number,
  style: StylePreset,
  negativePrompt?: string,
  inputImageUrl?: string,
  promptStrength?: number,
  aspectRatio: AspectRatio = 'portrait',
  quality: 'preview' | 'standard' = 'standard'
): Promise<Omit<DesignVariant, 'designId'> | null> {
  try {
    const seed = Math.floor(Math.random() * 999999)

    const isPreview = quality === 'preview'

    // Use flux-dev for Boris styles (better quality, supports negative prompt) and img2img
    // Use flux-schnell for regular styles (faster/cheaper) and always for preview quality
    const useFluxDev = !isPreview && (inputImageUrl || isBorisStyle(style))
    const model = useFluxDev
      ? 'black-forest-labs/flux-dev'
      : 'black-forest-labs/flux-schnell'

    const arConfig = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP.portrait
    const baseInput: Record<string, unknown> = {
      prompt,
      num_outputs: 1,
      output_format: 'webp',
      seed,
    }

    // Preview mode: use explicit small dimensions instead of aspect_ratio
    if (isPreview) {
      const previewDims: Record<AspectRatio, { width: number; height: number }> = {
        portrait:  { width: 512, height: 768 },
        landscape: { width: 768, height: 512 },
        square:    { width: 512, height: 512 },
      }
      const dims = previewDims[aspectRatio] || previewDims.portrait
      baseInput.width = dims.width
      baseInput.height = dims.height
      baseInput.output_quality = 70
    } else {
      baseInput.aspect_ratio = arConfig.flux
      baseInput.output_quality = 90
    }

    // Boris styles use flux-dev which needs inference steps
    if (isBorisStyle(style) && !inputImageUrl && !isPreview) {
      baseInput.num_inference_steps = 28
    }

    // Pass negative prompt for flux-dev (Boris styles)
    if (negativePrompt && useFluxDev) {
      baseInput.negative_prompt = negativePrompt
    }

    if (inputImageUrl) {
      baseInput.image = inputImageUrl
      baseInput.prompt_strength = promptStrength ?? 0.65
      baseInput.num_inference_steps = 28
    }

    const { data: output } = await withAIRetry({
      label: `generatePreview variant ${index}`,
      maxRetries: 2,
      fallbackRetries: 1,
      suppressAlert: true, // parent aggregates alerts
      primary: () => replicate.run(model as `${string}/${string}`, { input: baseInput }),
      // DALL-E 3 fallback (only for txt2img — img2img has no DALL-E equivalent)
      ...(!inputImageUrl && {
        fallback: async () => {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
          const res = await openai.images.generate({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: arConfig.dalle as '1024x1792' | '1792x1024' | '1024x1024',
            quality: 'standard',
          })
          const url = res.data?.[0]?.url
          if (!url) throw new Error('DALL-E 3 returned no image')
          return [url]
        },
      }),
    })

    // Flux returns FileOutput[] — use String() to get the URL
    const outputArr = Array.isArray(output) ? output : [output]
    const firstOutput = outputArr[0]
    const tempUrl = String(firstOutput || '')

    if (!tempUrl || !tempUrl.startsWith('http')) {
      console.error(`[generateSingleVariant] No valid URL for variant ${index}:`, tempUrl.substring(0, 100))
      return null
    }

    // Upload to Vercel Blob for persistent URL
    let imageUrl = tempUrl
    try {
      const imgRes = await fetch(tempUrl)
      const imgBlob = await imgRes.blob()
      const blobResult = await put(
        `designs/preview_${Date.now()}_${index}.webp`,
        imgBlob,
        { access: 'public', contentType: 'image/webp' }
      )
      imageUrl = blobResult.url
    } catch (uploadErr) {
      console.error(`[generateSingleVariant] Blob upload failed for variant ${index}, using temp URL:`, uploadErr)
    }

    return {
      id: `var_${Date.now()}_${index}`,
      imageUrl,
      thumbnailUrl: imageUrl,
      seed,
      isSelected: false,
      createdAt: new Date().toISOString(),
    }
  } catch (error: any) {
    const msg = error?.message || error?.error?.message || 'Unknown error'
    const status = error?.status || error?.response?.status || 'N/A'
    console.error(`[generateSingleVariant] Variant ${index} failed (status ${status}):`, msg)
    return null
  }
}
