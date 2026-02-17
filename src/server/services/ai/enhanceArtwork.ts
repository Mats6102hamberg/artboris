import Replicate from 'replicate'
import OpenAI from 'openai'
import { put } from '@vercel/blob'
import { withAIRetry } from '@/server/services/ai/withAIRetry'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export interface EnhanceResult {
  enhancedUrl: string
  description: string
}

/**
 * Enhance an artwork photo using AI.
 *
 * 1. GPT-4o Vision analyzes the artwork and produces a detailed description
 * 2. Flux-dev img2img generates a clean version using the description + original as reference
 * 3. Result is uploaded to Vercel Blob for persistence
 *
 * Returns null if enhancement fails (non-blocking — caller should fall back to original).
 */
export async function enhanceArtwork(imageUrl: string): Promise<EnhanceResult | null> {
  try {
    // ── Step 1: Analyze artwork with GPT-4o Vision ──
    console.log('[enhanceArtwork] Analyzing artwork with GPT-4o Vision...')

    const description = await analyzeArtwork(imageUrl)
    if (!description) {
      console.warn('[enhanceArtwork] Vision analysis returned empty description, skipping')
      return null
    }

    console.log(`[enhanceArtwork] Description (${description.length} chars): ${description.slice(0, 120)}...`)

    // ── Step 2: Generate clean version with Flux-dev img2img ──
    console.log('[enhanceArtwork] Generating enhanced version with Flux-dev img2img...')

    const enhancedTempUrl = await generateCleanVersion(imageUrl, description)
    if (!enhancedTempUrl) {
      console.warn('[enhanceArtwork] Flux img2img returned no result, skipping')
      return null
    }

    // ── Step 3: Upload to Vercel Blob for persistence ──
    console.log('[enhanceArtwork] Uploading enhanced image to Blob...')

    const imgRes = await fetch(enhancedTempUrl)
    const imgBlob = await imgRes.blob()
    const blobResult = await put(
      `market/enhanced/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`,
      imgBlob,
      { access: 'public', contentType: 'image/webp' },
    )

    console.log('[enhanceArtwork] Done. Enhanced URL:', blobResult.url.slice(0, 80))

    return {
      enhancedUrl: blobResult.url,
      description,
    }
  } catch (error) {
    console.error('[enhanceArtwork] Enhancement failed (non-blocking):', error)
    return null
  }
}

// ─── Internals ──────────────────────────────────────────────

async function analyzeArtwork(imageUrl: string): Promise<string | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

  const { data: response } = await withAIRetry({
    label: 'enhanceArtwork/vision',
    maxRetries: 2,
    baseDelayMs: 1500,
    primary: () =>
      openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' },
              },
              {
                type: 'text',
                text: `Describe this artwork in detail for image generation purposes.
Include: artistic style, medium/technique, subject matter, color palette, composition, and mood.
IGNORE any glass reflections, photo artifacts, uneven lighting, frame edges, or camera distortion — describe only the artwork itself.
Reply in English. Be concise but specific (max 3 sentences).`,
              },
            ],
          },
        ],
      }),
  })

  return response.choices[0]?.message?.content?.trim() || null
}

async function generateCleanVersion(
  imageUrl: string,
  description: string,
): Promise<string | null> {
  const prompt = `${description}. Professional high-quality artwork scan, clean reproduction, no glass reflections, no glare, no photo artifacts, even lighting, sharp details.`

  const { data: output } = await withAIRetry({
    label: 'enhanceArtwork/img2img',
    maxRetries: 2,
    baseDelayMs: 2000,
    primary: () =>
      replicate.run('black-forest-labs/flux-dev', {
        input: {
          image: imageUrl,
          prompt,
          prompt_strength: 0.35,
          num_outputs: 1,
          num_inference_steps: 28,
          output_format: 'webp',
          output_quality: 95,
        },
      }),
  })

  const outputArr = Array.isArray(output) ? output : [output]
  const firstOutput = outputArr[0]
  const url = String(firstOutput || '')

  if (!url || !url.startsWith('http')) {
    console.error('[enhanceArtwork] No valid URL from Flux:', url.substring(0, 100))
    return null
  }

  return url
}
