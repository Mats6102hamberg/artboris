import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { upscaleImage, getTargetDimensions, meetsTargetDpi } from '../ai/upscale'
import type { PrintProductType } from '@prisma/client'

// Auto-select upscale factor based on sizeCode for optimal DPI
const SIZE_UPSCALE_FACTOR: Record<string, number> = {
  '21x30': 4,  // 4096×7168 → ~340 DPI ✅
  'A4': 4,     // 4096×7168 → ~340 DPI ✅
  '30x40': 4,  // 4096×7168 → ~240 DPI ✅
  'A3': 4,     // 4096×7168 → ~240 DPI ✅
  '50x70': 4,  // 4096×7168 → ~145 DPI ✅ (poster-ok)
  '70x100': 8, // 8192×14336 → ~290 DPI ✅ (premium)
}

export interface GeneratePrintAssetInput {
  designId: string
  imageUrl: string
  sizeCode: string
  productType: PrintProductType
  upscaleFactor?: number  // override auto-select
  targetDpi?: number
}

export interface GeneratePrintAssetResult {
  success: boolean
  assetId?: string
  error?: string
}

/**
 * Orchestrator: upscale → Vercel Blob → create DesignAsset.
 * Idempotent: checks if PRINT asset already exists before doing work.
 * Auto-selects 4× or 8× based on sizeCode (70×100 gets 8×).
 */
export async function generatePrintAsset(
  input: GeneratePrintAssetInput,
): Promise<GeneratePrintAssetResult> {
  const { designId, imageUrl, sizeCode, productType } = input
  const upscaleFactor = input.upscaleFactor ?? SIZE_UPSCALE_FACTOR[sizeCode] ?? 4
  const targetDpi = input.targetDpi ?? 150

  const logPrefix = `[generatePrintAsset] design=${designId} size=${sizeCode}`

  // ── Idempotens: kolla om PRINT-asset redan finns (med upscale-data) ──
  const existing = await prisma.designAsset.findUnique({
    where: {
      designId_role_sizeCode_productType: {
        designId,
        role: 'PRINT',
        sizeCode,
        productType,
      },
    },
  })

  if (existing && existing.upscaleFactor) {
    console.log(`${logPrefix} PRINT asset already exists (${existing.id}), skipping`)
    return { success: true, assetId: existing.id }
  }

  console.log(`${logPrefix} Starting upscale pipeline (${upscaleFactor}×, target ${targetDpi} DPI)`)

  // ── Upscale via Replicate ──
  console.log(`${logPrefix} Upscale start`)
  const upscaleResult = await upscaleImage({
    imageUrl,
    upscaleFactor,
  })
  console.log(`${logPrefix} Upscale success: ${upscaleResult.finalWidthPx}×${upscaleResult.finalHeightPx}`)

  // ── Kolla om vi når target DPI ──
  const target = getTargetDimensions(sizeCode, targetDpi)
  const meetsDpi = meetsTargetDpi(
    upscaleResult.finalWidthPx,
    upscaleResult.finalHeightPx,
    sizeCode,
    targetDpi,
  )

  if (!meetsDpi && target) {
    console.warn(
      `${logPrefix} WARNING: Upscaled ${upscaleResult.finalWidthPx}×${upscaleResult.finalHeightPx} ` +
      `does not meet ${targetDpi} DPI target ${target.widthPx}×${target.heightPx} for ${sizeCode}. ` +
      `Proceeding anyway (best available).`,
    )
  }

  // ── Ladda ner upscalad bild ──
  console.log(`${logPrefix} Downloading upscaled image...`)
  const imageResponse = await fetch(upscaleResult.url)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download upscaled image: ${imageResponse.status}`)
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
  const fileSize = imageBuffer.byteLength
  const mimeType = imageResponse.headers.get('content-type') || 'image/png'

  console.log(`${logPrefix} Downloaded: ${(fileSize / 1024 / 1024).toFixed(1)} MB`)

  // ── Upload till Vercel Blob (permanent lagring) ──
  const blobPath = `print-assets/${designId}/${sizeCode}-${productType}-${upscaleFactor}x.png`
  console.log(`${logPrefix} Uploading to Vercel Blob: ${blobPath}`)

  const blob = await put(blobPath, imageBuffer, {
    access: 'public',
    contentType: mimeType,
  })

  console.log(`${logPrefix} Blob saved: ${blob.url}`)

  // ── Skapa eller uppdatera DesignAsset ──
  const assetData = {
    url: blob.url,
    widthPx: upscaleResult.finalWidthPx,
    heightPx: upscaleResult.finalHeightPx,
    dpi: targetDpi,
    fileSize,
    mimeType,
    sourceWidthPx: upscaleResult.sourceWidthPx,
    sourceHeightPx: upscaleResult.sourceHeightPx,
    upscaleFactor: upscaleResult.upscaleFactor,
    upscaleProvider: upscaleResult.upscaleProvider,
  }

  // Om placeholder redan finns (från webhook), uppdatera den
  const asset = existing
    ? await prisma.designAsset.update({
        where: { id: existing.id },
        data: assetData,
      })
    : await prisma.designAsset.create({
        data: {
          designId,
          role: 'PRINT',
          sizeCode,
          productType,
          ...assetData,
        },
      })

  console.log(`${logPrefix} Asset created: ${asset.id}`)
  return { success: true, assetId: asset.id }
}
