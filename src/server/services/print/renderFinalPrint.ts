import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { calculateCropRect, type CropMode } from '@/lib/image/crop'
import { getSizeById, cmToPixels } from '@/lib/image/resize'
import { generatePrintAsset } from './generatePrintAsset'
import type { PrintProductType } from '@prisma/client'

export interface RenderFinalPrintInput {
  designId: string
  sizeCode: string
  productType: PrintProductType
  dpi?: number
  bleedMm?: number
}

export interface RenderFinalPrintResult {
  success: boolean
  assetId?: string
  url?: string
  widthPx?: number
  heightPx?: number
  durationMs?: number
  error?: string
}

/**
 * Render a PRINT_FINAL asset that exactly matches MockupPreview.
 *
 * Pipeline:
 * 1. Load Design + selectedVariant + crop/position/scale from DB
 * 2. Ensure PRINT master exists (upscaled), create if missing
 * 3. Apply calculateCropRect (same logic as MockupPreview CSS)
 * 4. Add bleed if requested
 * 5. Export to Blob, create DesignAsset role=PRINT_FINAL
 *
 * Idempotent: skips if PRINT_FINAL already exists for this designId+sizeCode+productType.
 */
export async function renderFinalPrint(
  input: RenderFinalPrintInput,
): Promise<RenderFinalPrintResult> {
  const { designId, sizeCode, productType } = input
  const dpi = input.dpi ?? 300
  const bleedMm = input.bleedMm ?? 0
  const startTime = Date.now()
  const logPrefix = `[renderFinalPrint] design=${designId} size=${sizeCode}`

  // ── Idempotent check ──
  const existing = await prisma.designAsset.findUnique({
    where: {
      designId_role_sizeCode_productType: {
        designId,
        role: 'PRINT_FINAL',
        sizeCode,
        productType,
      },
    },
  })

  if (existing) {
    console.log(`${logPrefix} PRINT_FINAL already exists (${existing.id}), skipping`)
    return {
      success: true,
      assetId: existing.id,
      url: existing.url,
      widthPx: existing.widthPx ?? undefined,
      heightPx: existing.heightPx ?? undefined,
      durationMs: Date.now() - startTime,
    }
  }

  // ── Load design with crop/position data ──
  const design = await prisma.design.findUnique({
    where: { id: designId },
    include: {
      variants: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!design) {
    return { success: false, error: 'Design hittades inte.' }
  }

  // Determine source image: selectedVariant or first variant or design.imageUrl
  let sourceImageUrl = design.imageUrl
  if (design.selectedVariantId && design.variants.length > 0) {
    const selected = design.variants.find(v => v.id === design.selectedVariantId)
    if (selected) sourceImageUrl = selected.imageUrl
  } else if (design.variants.length > 0) {
    sourceImageUrl = design.variants[0].imageUrl
  }

  const cropMode = (design.cropMode || 'COVER') as CropMode
  const cropOffsetX = design.cropOffsetX ?? 0
  const cropOffsetY = design.cropOffsetY ?? 0

  console.log(`${logPrefix} Source: ${sourceImageUrl.slice(0, 80)}...`)
  console.log(`${logPrefix} Crop: ${cropMode} offset=(${cropOffsetX}, ${cropOffsetY})`)

  // ── Ensure PRINT master exists ──
  const printMaster = await prisma.designAsset.findUnique({
    where: {
      designId_role_sizeCode_productType: {
        designId,
        role: 'PRINT',
        sizeCode,
        productType,
      },
    },
  })

  let masterUrl: string
  if (printMaster && printMaster.upscaleFactor) {
    masterUrl = printMaster.url
    console.log(`${logPrefix} Using existing PRINT master: ${printMaster.id}`)
  } else {
    console.log(`${logPrefix} PRINT master missing, generating...`)
    const printResult = await generatePrintAsset({
      designId,
      imageUrl: sourceImageUrl,
      sizeCode,
      productType,
      targetDpi: Math.min(dpi, 150), // upscale targets 150 DPI minimum
    })
    if (!printResult.success) {
      return { success: false, error: `PRINT master generation failed: ${printResult.error}` }
    }
    // Re-fetch the created asset
    const newMaster = await prisma.designAsset.findFirst({
      where: { designId, role: 'PRINT', sizeCode, productType },
    })
    if (!newMaster) {
      return { success: false, error: 'PRINT master created but not found.' }
    }
    masterUrl = newMaster.url
    console.log(`${logPrefix} PRINT master created: ${newMaster.id}`)
  }

  // ── Download master image ──
  console.log(`${logPrefix} Downloading master image...`)
  const masterRes = await fetch(masterUrl)
  if (!masterRes.ok) {
    return { success: false, error: `Failed to download master: ${masterRes.status}` }
  }
  const masterBuffer = Buffer.from(await masterRes.arrayBuffer())
  const masterMeta = await sharp(masterBuffer).metadata()
  const srcW = masterMeta.width!
  const srcH = masterMeta.height!

  console.log(`${logPrefix} Master: ${srcW}×${srcH}`)

  // ── Calculate target dimensions ──
  const sizeInfo = getSizeById(sizeCode)
  if (!sizeInfo) {
    return { success: false, error: `Unknown sizeCode: ${sizeCode}` }
  }

  const bleedPx = bleedMm > 0 ? cmToPixels(bleedMm / 10, dpi) : 0
  const tgtW = cmToPixels(sizeInfo.widthCm, dpi) + bleedPx * 2
  const tgtH = cmToPixels(sizeInfo.heightCm, dpi) + bleedPx * 2

  console.log(`${logPrefix} Target: ${tgtW}×${tgtH} (${dpi} DPI, bleed ${bleedMm}mm = ${bleedPx}px)`)

  // ── Apply crop (same logic as MockupPreview CSS) ──
  const crop = calculateCropRect(srcW, srcH, tgtW, tgtH, cropMode, cropOffsetX, cropOffsetY)

  console.log(`${logPrefix} Crop rect: src(${crop.sx},${crop.sy} ${crop.sw}×${crop.sh}) → dst(${crop.dx},${crop.dy} ${crop.dw}×${crop.dh})`)

  // ── Render with Sharp ──
  // Step 1: Extract crop region from source
  const extracted = sharp(masterBuffer)
    .extract({
      left: Math.round(crop.sx),
      top: Math.round(crop.sy),
      width: Math.round(crop.sw),
      height: Math.round(crop.sh),
    })
    .resize(Math.round(crop.dw), Math.round(crop.dh), { fit: 'fill' })

  let finalImage: sharp.Sharp

  if (crop.dx > 0 || crop.dy > 0) {
    // CONTAIN mode: place on white background
    const extractedBuf = await extracted.png().toBuffer()
    finalImage = sharp({
      create: {
        width: tgtW,
        height: tgtH,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([{
        input: extractedBuf,
        left: Math.round(crop.dx),
        top: Math.round(crop.dy),
      }])
  } else {
    // COVER or FILL: extracted image IS the final image
    finalImage = extracted
  }

  // Export as high-quality PNG
  const outputBuffer = await finalImage.png({ quality: 100 }).toBuffer()
  const outputMeta = await sharp(outputBuffer).metadata()
  const finalW = outputMeta.width!
  const finalH = outputMeta.height!
  const fileSize = outputBuffer.byteLength

  console.log(`${logPrefix} Output: ${finalW}×${finalH}, ${(fileSize / 1024 / 1024).toFixed(1)} MB`)

  // ── Upload to Vercel Blob ──
  const blobPath = `print-final/${designId}/${sizeCode}-${productType}-${dpi}dpi.png`
  console.log(`${logPrefix} Uploading to Blob: ${blobPath}`)

  const blob = await put(blobPath, outputBuffer, {
    access: 'public',
    contentType: 'image/png',
  })

  console.log(`${logPrefix} Blob saved: ${blob.url}`)

  // ── Create DesignAsset ──
  const asset = await prisma.designAsset.create({
    data: {
      designId,
      role: 'PRINT_FINAL',
      sizeCode,
      productType,
      url: blob.url,
      widthPx: finalW,
      heightPx: finalH,
      dpi,
      fileSize,
      mimeType: 'image/png',
      sourceWidthPx: srcW,
      sourceHeightPx: srcH,
    },
  })

  const durationMs = Date.now() - startTime
  console.log(`${logPrefix} PRINT_FINAL created: ${asset.id} (${(durationMs / 1000).toFixed(1)}s)`)

  return {
    success: true,
    assetId: asset.id,
    url: blob.url,
    widthPx: finalW,
    heightPx: finalH,
    durationMs,
  }
}
