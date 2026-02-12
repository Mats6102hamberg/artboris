import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { generatePrintAsset } from '@/server/services/print/generatePrintAsset'

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

  console.log(`[stripe webhook] Received event: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      console.log(`[stripe webhook] Processing order: ${orderId}`)
      await processCheckoutCompleted(orderId, session)
    }
  }

  return NextResponse.json({ received: true })
}

async function processCheckoutCompleted(orderId: string, session: Stripe.Checkout.Session) {
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

  console.log(`[stripe webhook] Order ${orderId} → PAID`)

  // ── Hämta OrderItems ──
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { design: { select: { imageUrl: true } } },
  })

  console.log(`[stripe webhook] Order ${orderId}: ${items.length} item(s) to process`)

  // ── Per item: Fulfillment + Upscale pipeline (fail-safe) ──
  for (const item of items) {
    const itemLog = `[stripe webhook] OrderItem ${item.id} (design=${item.designId}, size=${item.sizeCode})`

    // Fulfillment: skapa bara om ingen redan finns
    let fulfillment = await prisma.fulfillment.findUnique({
      where: { orderItemId: item.id },
    })

    if (!fulfillment) {
      fulfillment = await prisma.fulfillment.create({
        data: {
          orderItemId: item.id,
          status: 'QUEUED',
          partnerId: 'crimson-stockholm',
        },
      })
      console.log(`${itemLog} Fulfillment created (QUEUED)`)
    } else {
      console.log(`${itemLog} Fulfillment already exists (${fulfillment.status})`)
    }

    // ── Upscale pipeline (fail-safe: fångar fel per item) ──
    try {
      console.log(`${itemLog} Starting print asset generation...`)

      const result = await generatePrintAsset({
        designId: item.designId,
        imageUrl: item.design.imageUrl,
        sizeCode: item.sizeCode,
        productType: item.productType,
        upscaleFactor: 4,
        targetDpi: 150,
      })

      if (result.success) {
        console.log(`${itemLog} Print asset ready: ${result.assetId}`)
      } else {
        throw new Error(result.error || 'generatePrintAsset returned success=false')
      }
    } catch (err) {
      // ── Fail-safe: markera fulfillment FAILED, logga, fortsätt ──
      console.error(`${itemLog} UPSCALE FAILED:`, err)

      await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: 'FAILED',
          internalNote: `Upscale failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      })

      console.error(`${itemLog} Fulfillment marked FAILED — continuing with next item`)
      // Avbryt INTE webhooken — fortsätt med nästa item
    }
  }

  console.log(`[stripe webhook] Order ${orderId} processing complete`)
}
