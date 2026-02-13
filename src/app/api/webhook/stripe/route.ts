import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { generatePrintAsset, isPremiumSize } from '@/server/services/print/generatePrintAsset'
import { sendOrderConfirmation } from '@/server/services/email/sendEmail'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
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
  // ── Idempotency: check if already PAID ──
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

  // ── Transaction: mark PAID + update Payment ──
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

  // ── Send order confirmation (non-blocking) ──
  sendOrderConfirmation(orderId).catch(err =>
    console.error(`[stripe webhook] Email failed for ${orderId}:`, err)
  )

  // ── Fetch OrderItems ──
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { design: { select: { imageUrl: true } } },
  })

  console.log(`[stripe webhook] Order ${orderId}: ${items.length} item(s) to process`)

  // ── Per item: Fulfillment + Upscale pipeline (fail-safe) ──
  for (const item of items) {
    const itemLog = `[stripe webhook] OrderItem ${item.id} (design=${item.designId}, size=${item.sizeCode})`

    // Fulfillment: create only if none exists
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

    // ── Upscale pipeline (fail-safe: catches errors per item) ──
    if (isPremiumSize(item.sizeCode)) {
      // Premium (70×100): 8× takes ~60-120s — too slow for webhook.
      // Create placeholder, admin generates print file manually.
      console.log(`${itemLog} ⚠️  Premium size (${item.sizeCode}) — skipping upscale in webhook. Use admin to generate.`)

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
            url: item.design.imageUrl,
            mimeType: 'image/png',
          },
        })
        console.log(`${itemLog} Placeholder PRINT asset created (awaiting admin upscale)`)
      }
    } else {
      // Standard sizes (4×): safe for webhook (~20-30s)
      try {
        console.log(`${itemLog} Starting print asset generation...`)

        const result = await generatePrintAsset({
          designId: item.designId,
          imageUrl: item.design.imageUrl,
          sizeCode: item.sizeCode,
          productType: item.productType,
          targetDpi: 150,
        })

        if (result.success) {
          console.log(`${itemLog} Print asset ready: ${result.assetId} (${result.durationMs}ms)`)
        } else {
          throw new Error(result.error || 'generatePrintAsset returned success=false')
        }
      } catch (err) {
        // ── Fail-safe: mark fulfillment FAILED, log, continue ──
        console.error(`${itemLog} UPSCALE FAILED:`, err)

        await prisma.fulfillment.update({
          where: { id: fulfillment.id },
          data: {
            status: 'FAILED',
            internalNote: `Upscale failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        })

        console.error(`${itemLog} Fulfillment marked FAILED — continuing with next item`)
        // Do NOT abort the webhook — continue with next item
      }
    }
  }

  console.log(`[stripe webhook] Order ${orderId} processing complete`)
}
