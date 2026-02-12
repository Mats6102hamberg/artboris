import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getOrCreateAnonId } from '@/lib/anonId'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

export async function POST(req: Request) {
  try {
    const anonId = await getOrCreateAnonId()
    const body = await req.json()

    const {
      designId,
      productType,
      sizeCode,
      frameColor,
      paperType,
      quantity = 1,
      unitPriceCents,
    } = body

    if (!designId || !productType || !sizeCode || unitPriceCents == null) {
      return NextResponse.json(
        { error: 'Obligatoriska fält: designId, productType, sizeCode, unitPriceCents.' },
        { status: 400 }
      )
    }

    const lineTotalCents = unitPriceCents * quantity

    const order = await prisma.order.create({
      data: {
        anonId,
        status: 'AWAITING_PAYMENT',
        currency: 'SEK',
        subtotalCents: lineTotalCents,
        totalCents: lineTotalCents,
        items: {
          create: [
            {
              designId,
              productType,
              sizeCode,
              frameColor: frameColor ?? 'NONE',
              paperType: paperType ?? 'DEFAULT',
              quantity,
              unitPriceCents,
              lineTotalCents,
            },
          ],
        },
        payment: {
          create: {
            provider: 'STRIPE',
            amountCents: lineTotalCents,
            currency: 'SEK',
          },
        },
      },
      include: { payment: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'sek',
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'sek',
            unit_amount: unitPriceCents,
            product_data: {
              name: `ArtBoris Print (${sizeCode})`,
              description: `${productType}${frameColor && frameColor !== 'NONE' ? ` + ram ${frameColor}` : ''}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/order/success?orderId=${order.id}`,
      cancel_url: `${appUrl}/order/cancel?orderId=${order.id}`,
      metadata: {
        orderId: order.id,
      },
    })

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { stripeCheckoutSessionId: session.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json(
      { error: 'Checkout create failed' },
      { status: 500 }
    )
  }
}
