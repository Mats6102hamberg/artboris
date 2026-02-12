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
      await processCheckoutCompleted(orderId, session)
    }
  }

  return NextResponse.json({ received: true })
}

async function processCheckoutCompleted(orderId: string, session: Stripe.Checkout.Session) {
  try {
    // ── Idempotens: kolla om redan PAID ──
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    })

    if (!order) {
      console.warn(`[stripe webhook] Order ${orderId} not found`)
      return
    }

    if (order.status === 'PAID' || order.status === 'IN_PRODUCTION' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      console.log(`[stripe webhook] Order ${orderId} already ${order.status}, skipping`)
      return
    }

    // ── Transaktion: markera PAID + uppdatera Payment ──
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      }),
      prisma.payment.update({
        where: { orderId },
        data: {
          stripePaymentIntentId: (session.payment_intent as string) ?? null,
          paidAt: new Date(),
        },
      }),
    ])

    // ── Skapa Fulfillment + DesignAsset PRINT per OrderItem ──
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      include: { design: { select: { imageUrl: true } } },
    })

    for (const item of items) {
      // Fulfillment: skapa bara om ingen redan finns (orderItemId är @unique)
      const existingFulfillment = await prisma.fulfillment.findUnique({
        where: { orderItemId: item.id },
      })

      if (!existingFulfillment) {
        await prisma.fulfillment.create({
          data: {
            orderItemId: item.id,
            status: 'QUEUED',
            partnerId: 'crimson-stockholm',
          },
        })
      }

      // DesignAsset PRINT: skapa placeholder om ingen finns
      const existingAsset = await prisma.designAsset.findUnique({
        where: {
          designId_role_sizeCode_productType: {
            designId: item.designId,
            role: 'PRINT',
            sizeCode: item.sizeCode,
            productType: item.productType,
          },
        },
      })

      if (!existingAsset) {
        await prisma.designAsset.create({
          data: {
            designId: item.designId,
            role: 'PRINT',
            sizeCode: item.sizeCode,
            productType: item.productType,
            // Placeholder: använd preview-URL tills riktig printfil genereras
            url: item.design.imageUrl,
            mimeType: 'image/png',
          },
        })
      }
    }

    console.log(`[stripe webhook] Order ${orderId} → PAID, ${items.length} fulfillment(s) + asset(s) created`)
  } catch (err) {
    console.error(`[stripe webhook] Failed to process order ${orderId}:`, err)
  }
}
