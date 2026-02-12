import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/server/services/orders/createOrder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, designId, variantId, frameId, sizeId } = body

    if (!userId || !designId || !variantId || !frameId || !sizeId) {
      return NextResponse.json(
        { error: 'Alla fält krävs: userId, designId, variantId, frameId, sizeId.' },
        { status: 400 }
      )
    }

    const result = await createOrder({
      userId,
      designId,
      variantId,
      frameId,
      sizeId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Kunde inte skapa order.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
    })
  } catch (error) {
    console.error('[orders/create] Error:', error)
    return NextResponse.json(
      { error: 'Orderhantering misslyckades.' },
      { status: 500 }
    )
  }
}
