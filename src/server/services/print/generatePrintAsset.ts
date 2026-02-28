import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { upscaleImage, getTargetDimensions, meetsTargetDpi } from '../ai/upscale'
import { calculateCropRect, type CropMode } from '@/lib/image/crop'
import type { PrintProductType } from '@prisma/client'

// Auto-select upscale factor based on sizeCode for optimal DPI
const SIZE_UPSCALE_FACTOR: Record<string, number> = {
  '21x30': 4,  // 4096×7168 → ~340 DPI ✅
  'A4': 4,     // 4096×7168 → ~340 DPI ✅
  '30x40': 4,  // 4096×7168 → ~240 DPI ✅
  'A3': 4,     // 4096×7168 → ~240 DPI ✅
  '50x70': 4,  // 4096×7168 → ~145 DPI ✅ (poster-ok)
  '70x100': 8, // 8192×14336 → ~290 DPI ✅ (premium, 2-pass)
}

// Premium sizes require 8× (two Replicate passes) — too slow for webhook
const PREMIUM_SIZES = new Set(['70x100'])

/**
 * Check if a sizeCode is premium (requires 8× upscale, too slow for webhook).
 */
export function isPremiumSize(sizeCode: string): boolean {
  return PREMIUM_SIZES.has(sizeCode)
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
  durationMs?: number
  error?: string
}

/**
 * Orchestrator: upscale → Vercel Blob → create DesignAsset.
 * Idempotent: checks if PRINT asset already exists before doing work.
 * Auto-selects 4× or 8× based on sizeCode (70×100 gets 8×).
 *
 * ⚠️  Premium sizes (70×100) use 8× (two Replicate passes, ~60-120s).
 *     These should NOT be called from webhook — use admin trigger instead.
 */
export async function generatePrintAsset(
  input: GeneratePrintAssetInput,
): Promise<GeneratePrintAssetResult> {
  const { designId, imageUrl, sizeCode, productType } = input
  const targetDpi = input.targetDpi ?? 150
  const startTime = Date.now()

  const logPrefix = `[generatePrintAsset] design=${designId} size=${sizeCode}`

  // ── Detect source dimensions to auto-adjust upscale factor ──
  let sourceWidth = 1024
  try {
    const imgRes = await fetch(imageUrl)
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const meta = await sharp(buf).metadata()
    sourceWidth = meta.width ?? 1024
    console.log(`${logPrefix} Detected source width: ${sourceWidth}px`)
  } catch (err) {
    console.warn(`${logPrefix} Could not detect source dimensions, assuming 1024px`)
  }

  // For low-res sources (≤600px, e.g. 512px previews), double the upscale factor
  const baseUpscaleFactor = input.upscaleFactor ?? SIZE_UPSCALE_FACTOR[sizeCode] ?? 4
  const sourceIsLowRes = sourceWidth <= 600
  const upscaleFactor = sourceIsLowRes
    ? Math.min(baseUpscaleFactor * 2, 8)
    : baseUpscaleFactor

  if (sourceIsLowRes) {
    console.log(`${logPrefix} Low-res source (${sourceWidth}px) → adjusted upscale from ${baseUpscaleFactor}× to ${upscaleFactor}×`)
  }

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
    return { success: true, assetId: existing.id, durationMs: Date.now() - startTime }
  }

  console.log(`${logPrefix} Starting upscale pipeline (${upscaleFactor}×, target ${targetDpi} DPI)`)

  if (upscaleFactor >= 8) {
    console.warn(`${logPrefix} ⚠️  8× upscale (premium) — estimated 60-120s. Not safe for webhook timeout.`)
  }

  // ── Upscale via Replicate ──
  console.log(`${logPrefix} Upscale start`)
  const upscaleResult = await upscaleImage({
    imageUrl,
    upscaleFactor,
  })
  console.log(`${logPrefix} Upscale success: ${upscaleResult.finalWidthPx}×${upscaleResult.finalHeightPx}`)

  // ── Check if we reach target DPI ──
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

  // If placeholder already exists (from webhook), update it
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

  const durationMs = Date.now() - startTime
  const durationSec = (durationMs / 1000).toFixed(1)

  console.log(`${logPrefix} Asset created: ${asset.id} (${durationSec}s total)`)

  if (durationMs > 25000) {
    console.warn(`${logPrefix} ⚠️  Took ${durationSec}s — exceeds Vercel webhook timeout (30s). Consider admin-triggered generation for this size.`)
  }

  return { success: true, assetId: asset.id, durationMs }
}
