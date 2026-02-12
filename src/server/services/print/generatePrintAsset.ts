import { prisma } from '@/lib/prisma'
import { upscaleImage, getTargetDimensions, meetsTargetDpi } from '../ai/upscale'
import type { PrintProductType } from '@prisma/client'

export interface GeneratePrintAssetInput {
  designId: string
  imageUrl: string
  sizeCode: string
  productType: PrintProductType
  upscaleFactor?: number
  targetDpi?: number
}

export interface GeneratePrintAssetResult {
  success: boolean
  assetId?: string
  error?: string
}

/**
 * Orchestrator: upscale → save → create DesignAsset.
 * Idempotent: checks if PRINT asset already exists before doing work.
 */
export async function generatePrintAsset(
  input: GeneratePrintAssetInput,
): Promise<GeneratePrintAssetResult> {
  const { designId, imageUrl, sizeCode, productType } = input
  const upscaleFactor = input.upscaleFactor ?? 4
  const targetDpi = input.targetDpi ?? 150

  const logPrefix = `[generatePrintAsset] design=${designId} size=${sizeCode}`

  // ── Idempotens: kolla om PRINT-asset redan finns ──
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

  // ── Ladda ner upscalad bild och beräkna filstorlek ──
  console.log(`${logPrefix} Downloading upscaled image...`)
  const imageResponse = await fetch(upscaleResult.url)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download upscaled image: ${imageResponse.status}`)
  }
  const imageBuffer = await imageResponse.arrayBuffer()
  const fileSize = imageBuffer.byteLength
  const mimeType = imageResponse.headers.get('content-type') || 'image/png'

  console.log(`${logPrefix} Downloaded: ${(fileSize / 1024 / 1024).toFixed(1)} MB`)

  // ── Spara till Vercel Blob (eller behåll Replicate-URL temporärt) ──
  // TODO: Implementera Vercel Blob upload för permanent lagring
  // För nu: använd Replicate-URL:en (temporär, ~1h livstid)
  // I produktion: upload till Blob här
  const finalUrl = upscaleResult.url

  console.log(`${logPrefix} Saving DesignAsset...`)

  // ── Skapa eller uppdatera DesignAsset ──
  // Om placeholder redan finns (från webhook), uppdatera den
  const asset = existing
    ? await prisma.designAsset.update({
        where: { id: existing.id },
        data: {
          url: finalUrl,
          widthPx: upscaleResult.finalWidthPx,
          heightPx: upscaleResult.finalHeightPx,
          dpi: targetDpi,
          fileSize,
          mimeType,
          sourceWidthPx: upscaleResult.sourceWidthPx,
          sourceHeightPx: upscaleResult.sourceHeightPx,
          upscaleFactor: upscaleResult.upscaleFactor,
          upscaleProvider: upscaleResult.upscaleProvider,
        },
      })
    : await prisma.designAsset.create({
        data: {
          designId,
          role: 'PRINT',
          sizeCode,
          productType,
          url: finalUrl,
          widthPx: upscaleResult.finalWidthPx,
          heightPx: upscaleResult.finalHeightPx,
          dpi: targetDpi,
          fileSize,
          mimeType,
          sourceWidthPx: upscaleResult.sourceWidthPx,
          sourceHeightPx: upscaleResult.sourceHeightPx,
          upscaleFactor: upscaleResult.upscaleFactor,
          upscaleProvider: upscaleResult.upscaleProvider,
        },
      })

  console.log(`${logPrefix} Asset created: ${asset.id}`)
  return { success: true, assetId: asset.id }
}
