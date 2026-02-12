import { NextRequest, NextResponse } from 'next/server'
import { renderFinalPrint } from '@/server/services/print/renderFinalPrint'
import type { PrintProductType } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: designId } = await params
    const body = await request.json()
    const { sizeCode, productType, dpi, bleedMm } = body as {
      sizeCode: string
      productType: PrintProductType
      dpi?: number
      bleedMm?: number
    }

    if (!sizeCode || !productType) {
      return NextResponse.json(
        { error: 'sizeCode och productType krävs.' },
        { status: 400 }
      )
    }

    const result = await renderFinalPrint({
      designId,
      sizeCode,
      productType,
      dpi,
      bleedMm,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assetId: result.assetId,
      url: result.url,
      widthPx: result.widthPx,
      heightPx: result.heightPx,
      durationMs: result.durationMs,
    })
  } catch (error) {
    console.error('[designs/[id]/print-final] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte rendera tryckfil.' },
      { status: 500 }
    )
  }
}
