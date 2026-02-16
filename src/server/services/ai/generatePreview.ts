import Replicate from 'replicate'
import { StylePreset, DesignControls, DesignVariant } from '@/types/design'
import { buildGeneratePrompt } from '@/lib/prompts/templates'
import { checkPromptSafety } from '@/lib/prompts/safety'
import { isDemoMode, getDemoVariants } from '@/lib/demo/demoImages'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

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
}

export interface GeneratePreviewResult {
  success: boolean
  variants: Omit<DesignVariant, 'designId'>[]
  prompt: string
  designId?: string
  error?: string
}

export async function generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewResult> {
  const { style, controls, userDescription, count = 4, inputImageUrl, promptStrength } = input

  const prompt = buildGeneratePrompt(style, controls, userDescription)

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
        generateSingleVariant(prompt, i, inputImageUrl, promptStrength)
      )

      const results = await Promise.allSettled(promises)

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
  inputImageUrl?: string,
  promptStrength?: number
): Promise<Omit<DesignVariant, 'designId'> | null> {
  try {
    const seed = Math.floor(Math.random() * 999999)

    // Use flux-dev for img2img (supports image input), flux-schnell for txt2img
    const model = inputImageUrl
      ? 'black-forest-labs/flux-dev'
      : 'black-forest-labs/flux-schnell'

    const baseInput: Record<string, unknown> = {
      prompt,
      num_outputs: 1,
      aspect_ratio: '2:3',
      output_format: 'webp',
      output_quality: 90,
      seed,
    }

    if (inputImageUrl) {
      baseInput.image = inputImageUrl
      baseInput.prompt_strength = promptStrength ?? 0.65
      baseInput.num_inference_steps = 28
    }

    const output = await replicate.run(
      model as `${string}/${string}`,
      { input: baseInput }
    )

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
