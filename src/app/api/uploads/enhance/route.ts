import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { upscaleImage } from '@/server/services/ai/upscale'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth/getUserId'

const MIN_PRINT_LONG_SIDE = 3000
const TARGET_LONG_SIDE = 4096
const JPEG_QUALITY = 95

interface EnhanceResult {
  imageUrl: string
  originalWidth: number
  originalHeight: number
  enhancedWidth: number
  enhancedHeight: number
  wasUpscaled: boolean
  wasEnhanced: boolean
  upscaleFactor: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const designId = formData.get('designId') as string | null
    const partnershipAccepted = formData.get('partnershipAccepted') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large (max 25 MB).' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Step 1: Read original dimensions
    const originalMeta = await sharp(buffer).metadata()
    const origW = originalMeta.width!
    const origH = originalMeta.height!
    const longSide = Math.max(origW, origH)

    console.log(`[enhance] Original: ${origW}×${origH} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)

    let wasUpscaled = false
    let upscaleFactor = 1
    let currentW = origW
    let currentH = origH

    // Step 2: AI upscale if too small for print
    if (longSide < MIN_PRINT_LONG_SIDE) {
      // Calculate needed factor
      const neededFactor = Math.ceil(TARGET_LONG_SIDE / longSide)
      upscaleFactor = neededFactor <= 2 ? 2 : 4

      console.log(`[enhance] Image too small (${longSide}px). Upscaling ${upscaleFactor}×...`)

      // First upload original to get a URL for Replicate
      const ext = file.name.split('.').pop() || 'jpg'
      const tempFilename = `uploads/temp/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
      const tempBlob = await put(tempFilename, buffer, {
        access: 'public',
        contentType: file.type,
      })

      try {
        const upscaleResult = await upscaleImage({
          imageUrl: tempBlob.url,
          upscaleFactor,
        })

        // Download upscaled image
        const upscaledResponse = await fetch(upscaleResult.url)
        if (upscaledResponse.ok) {
          buffer = Buffer.from(await upscaledResponse.arrayBuffer())
          const upMeta = await sharp(buffer).metadata()
          currentW = upMeta.width!
          currentH = upMeta.height!
          wasUpscaled = true
          console.log(`[enhance] Upscaled to ${currentW}×${currentH}`)
        }
      } catch (err) {
        console.error('[enhance] Upscale failed, continuing with original:', err)
      }
    }

    // Step 3: Enhance with Sharp — auto-rotate, sRGB, sharpen, normalize
    console.log(`[enhance] Applying image enhancements...`)
    const enhanced = await sharp(buffer)
      .rotate()                          // Auto-rotate from EXIF
      .toColorspace('srgb')              // Consistent print colors
      .sharpen({                         // Subtle sharpening for print
        sigma: 1.0,
        m1: 1.0,
        m2: 0.5,
      })
      .modulate({
        saturation: 1.08,                // Slight saturation boost
        brightness: 1.02,                // Very subtle brightness lift
      })
      .normalise({ lower: 1, upper: 99 }) // Auto-levels (clip 1% extremes)
      .jpeg({
        quality: JPEG_QUALITY,
        chromaSubsampling: '4:4:4',      // Full color resolution for print
      })
      .toBuffer()

    const enhancedMeta = await sharp(enhanced).metadata()
    const enhancedW = enhancedMeta.width!
    const enhancedH = enhancedMeta.height!

    console.log(`[enhance] Enhanced: ${enhancedW}×${enhancedH} (${(enhanced.byteLength / 1024 / 1024).toFixed(1)} MB)`)

    // Step 4: Upload enhanced image to Vercel Blob
    const filename = `artwork_enhanced_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
    const blob = await put(`uploads/artwork/${filename}`, enhanced, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    const result: EnhanceResult = {
      imageUrl: blob.url,
      originalWidth: origW,
      originalHeight: origH,
      enhancedWidth: enhancedW,
      enhancedHeight: enhancedH,
      wasUpscaled,
      wasEnhanced: true,
      upscaleFactor,
    }

    console.log(`[enhance] Done: ${wasUpscaled ? `${upscaleFactor}× upscaled + ` : ''}enhanced → ${blob.url}`)

    // Save partnership + enhancement data to Design if designId provided
    if (designId) {
      try {
        await prisma.design.update({
          where: { id: designId },
          data: {
            isEnhanced: true,
            originalImageUrl: result.imageUrl, // store original before next enhancement
            ...(partnershipAccepted ? {
              partnershipAccepted: true,
              partnershipAcceptedAt: new Date(),
            } : {}),
          },
        })
        console.log(`[enhance] Updated design ${designId}: isEnhanced=true, partnership=${partnershipAccepted}`)
      } catch (err) {
        console.error(`[enhance] Failed to update design ${designId}:`, err)
      }
    } else if (partnershipAccepted) {
      // No designId yet — log for traceability
      const anonId = await getUserId()
      console.log(`[enhance] Partnership accepted by ${anonId} (no designId yet, will be linked at design creation)`)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[uploads/enhance] Error:', error)
    return NextResponse.json(
      { error: 'Enhancement failed.' },
      { status: 500 }
    )
  }
}
