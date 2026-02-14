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
}

export interface GeneratePreviewResult {
  success: boolean
  variants: Omit<DesignVariant, 'designId'>[]
  prompt: string
  designId?: string
  error?: string
}

export async function generatePreview(input: GeneratePreviewInput): Promise<GeneratePreviewResult> {
  const { style, controls, userDescription, count = 4 } = input

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
        generateSingleVariant(prompt, i)
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
  index: number
): Promise<Omit<DesignVariant, 'designId'> | null> {
  try {
    const seed = Math.floor(Math.random() * 999999)

    const output = await replicate.run(
      'black-forest-labs/flux-schnell',
      {
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: '2:3', // Portrait
          output_format: 'webp',
          output_quality: 90,
          seed,
        },
      }
    )

    // Flux returns an array of URLs or ReadableStream
    const outputArr = output as any[]
    const tempUrl = typeof outputArr?.[0] === 'string'
      ? outputArr[0]
      : outputArr?.[0]?.url?.() || null

    if (!tempUrl) {
      console.error(`[generateSingleVariant] No output URL for variant ${index}`)
      return null
    }

    // Upload to Vercel Blob for persistent URL
    let imageUrl = typeof tempUrl === 'string' ? tempUrl : ''
    try {
      const imgRes = await fetch(imageUrl)
      const imgBlob = await imgRes.blob()
      const blobResult = await put(
        `designs/preview_${Date.now()}_${index}.webp`,
        imgBlob,
        { access: 'public', contentType: 'image/webp' }
      )
      imageUrl = blobResult.url
    } catch (blobErr) {
      console.error(`[generateSingleVariant] Blob upload failed for variant ${index}, using temp URL:`, blobErr)
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
