import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/server/services/orders/createOrder'
import { getUserId } from '@/lib/auth/getUserId'
import { reportApiError } from '@/lib/crashcatcher'
import { sendErrorAdminAlert } from '@/server/services/email/adminAlert'

export async function POST(request: NextRequest) {
  let anonId: string | undefined
  let designId: string | undefined

  try {
    const body = await request.json()
    const { productType, sizeCode, frameColor, paperType, quantity, unitPriceCents } = body
    designId = body.designId

    if (!designId || !productType || !sizeCode || unitPriceCents == null) {
      return NextResponse.json(
        { error: 'Required fields: designId, productType, sizeCode, unitPriceCents.' },
        { status: 400 }
      )
    }

    anonId = await getUserId()

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
    reportApiError('orders/create', error, 'CRITICAL', { userId: anonId, designId })
    sendErrorAdminAlert({
      route: 'orders/create',
      error: error instanceof Error ? error.message : String(error),
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }).catch(() => {})
    return NextResponse.json(
      { error: 'Orderhantering misslyckades.' },
      { status: 500 }
    )
  }
}
