import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/server/services/orders/createOrder'
import { getOrCreateAnonId } from '@/lib/anonId'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { designId, productType, sizeCode, frameColor, paperType, quantity, unitPriceCents } = body

    if (!designId || !productType || !sizeCode || unitPriceCents == null) {
      return NextResponse.json(
        { error: 'Required fields: designId, productType, sizeCode, unitPriceCents.' },
        { status: 400 }
      )
    }

    const anonId = await getOrCreateAnonId()

    const result = await createOrder({
      anonId,
      designId,
      productType,
      sizeCode,
      frameColor,
      paperType,
      quantity,
      unitPriceCents,
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
      orderItemId: result.orderItemId,
    })
  } catch (error) {
    console.error('[orders/create] Error:', error)
    return NextResponse.json(
      { error: 'Orderhantering misslyckades.' },
      { status: 500 }
    )
  }
}
