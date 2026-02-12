import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      try {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
          }),
          prisma.payment.update({
            where: { orderId },
            data: {
              stripePaymentIntentId: session.payment_intent as string,
              paidAt: new Date(),
            },
          }),
        ])

        // Skapa Fulfillment för varje OrderItem (koppla till Crimson)
        const items = await prisma.orderItem.findMany({
          where: { orderId },
        })

        for (const item of items) {
          await prisma.fulfillment.create({
            data: {
              orderItemId: item.id,
              status: 'QUEUED',
              partnerId: 'crimson-stockholm',
            },
          })
        }

        console.log(`[stripe webhook] Order ${orderId} marked PAID, fulfillments created`)
      } catch (err) {
        console.error(`[stripe webhook] Failed to process order ${orderId}:`, err)
      }
    }
  }

  return NextResponse.json({ received: true })
}
