import { NextRequest, NextResponse } from 'next/server'
import { generateFinalPrint } from '@/server/services/ai/generateFinalPrint'
import { DesignControls } from '@/types/design'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, originalPrompt, controls, sizeId, variantSeed } = body as {
      orderId: string
      originalPrompt: string
      controls: DesignControls
      sizeId: string
      variantSeed: number
    }

    if (!orderId || !originalPrompt || !sizeId) {
      return NextResponse.json(
        { error: 'orderId, originalPrompt and sizeId are required.' },
        { status: 400 }
      )
    }

    const result = await generateFinalPrint({
      originalPrompt,
      controls,
      sizeId,
      variantSeed: variantSeed || 0,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Slutrender misslyckades.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      imageUrl: result.imageUrl,
      widthPx: result.widthPx,
      heightPx: result.heightPx,
    })
  } catch (error) {
    console.error('[renders/final] Error:', error)
    return NextResponse.json(
      { error: 'Slutrender misslyckades.' },
      { status: 500 }
    )
  }
}
