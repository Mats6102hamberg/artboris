import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationTo } from '@/server/services/email/sendEmail'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: 'orderId krävs' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      shippingAddress: {
        select: { email: true, confirmationEmail: true },
      },
    },
  })

  if (!order || !order.shippingAddress) {
    return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 })
  }

  return NextResponse.json({
    email: order.shippingAddress.email,
    confirmationEmail: order.shippingAddress.confirmationEmail,
    status: order.status,
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { orderId, email } = body as { orderId?: string; email?: string }

  if (!orderId) {
    return NextResponse.json({ error: 'orderId krävs' }, { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Giltig e-postadress krävs' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 })
  }

  try {
    await sendOrderConfirmationTo(orderId, email)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-receipt] Error:', err)
    return NextResponse.json({ error: 'Kunde inte skicka bekräftelse' }, { status: 500 })
  }
}
