import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getOrCreateAnonId } from '@/lib/anonId'

const SHIPPING_CENTS = 9900 // 99 kr
const VAT_RATE = 0.25

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  })
}

interface CheckoutItem {
  designId: string
  productType: string
  sizeCode: string
  frameColor?: string
  paperType?: string
  quantity?: number
  unitPriceCents: number
}

interface ShippingInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address: string
  postalCode: string
  city: string
}

export async function POST(req: Request) {
  let step = 'init'
  try {
    step = 'parse-body'
    const anonId = await getOrCreateAnonId()
    const body = await req.json()

    const { items, shipping, returnPath } = body as {
      items?: CheckoutItem[]
      shipping?: ShippingInput
      returnPath?: string
      designId?: string
      productType?: string
      sizeCode?: string
      frameColor?: string
      paperType?: string
      quantity?: number
      unitPriceCents?: number
    }

    const orderItems: CheckoutItem[] = items && items.length > 0
      ? items
      : body.designId
        ? [{
            designId: body.designId,
            productType: body.productType,
            sizeCode: body.sizeCode,
            frameColor: body.frameColor,
            paperType: body.paperType,
            quantity: body.quantity || 1,
            unitPriceCents: body.unitPriceCents,
          }]
        : []

    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'Inga artiklar att beställa.' }, { status: 400 })
    }

    for (const item of orderItems) {
      if (!item.designId || !item.productType || !item.sizeCode || item.unitPriceCents == null) {
        return NextResponse.json(
          { error: `Artikel saknar fält: designId=${item.designId}, productType=${item.productType}, sizeCode=${item.sizeCode}, unitPriceCents=${item.unitPriceCents}` },
          { status: 400 }
        )
      }
    }

    if (!shipping || !shipping.firstName || !shipping.lastName || !shipping.email || !shipping.address || !shipping.postalCode || !shipping.city) {
      return NextResponse.json({ error: 'Leveransuppgifter krävs.' }, { status: 400 })
    }

    step = 'calculate-totals'
    const subtotalCents = orderItems.reduce((sum, item) => sum + item.unitPriceCents * (item.quantity || 1), 0)
    const shippingCents = SHIPPING_CENTS
    const taxCents = Math.round((subtotalCents + shippingCents) * VAT_RATE)
    const totalCents = subtotalCents + shippingCents + taxCents

    step = 'create-order'
    console.log('[checkout] Creating order with items:', JSON.stringify(orderItems.map(i => ({
      designId: i.designId, productType: i.productType, sizeCode: i.sizeCode,
      frameColor: i.frameColor, unitPriceCents: i.unitPriceCents,
    }))))

    const order = await prisma.order.create({
      data: {
        anonId,
        status: 'AWAITING_PAYMENT',
        currency: 'SEK',
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        items: {
          create: orderItems.map(item => ({
            designId: item.designId,
            productType: item.productType as any,
            sizeCode: item.sizeCode,
            frameColor: (item.frameColor ?? 'NONE') as any,
            paperType: (item.paperType ?? 'DEFAULT') as any,
            quantity: item.quantity || 1,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.unitPriceCents * (item.quantity || 1),
          })),
        },
        shippingAddress: {
          create: {
            fullName: `${shipping.firstName} ${shipping.lastName}`,
            email: shipping.email,
            phone: shipping.phone || null,
            address1: shipping.address,
            postalCode: shipping.postalCode,
            city: shipping.city,
            countryCode: 'SE',
          },
        },
        payment: {
          create: {
            provider: 'STRIPE',
            amountCents: totalCents,
            currency: 'SEK',
          },
        },
      },
      include: { payment: true, items: true },
    })

    step = 'create-stripe-session'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map(item => ({
      quantity: item.quantity || 1,
      price_data: {
        currency: 'sek',
        unit_amount: item.unitPriceCents,
        product_data: {
          name: `Artboris Print (${item.sizeCode})`,
          description: `${item.productType}${item.frameColor && item.frameColor !== 'NONE' ? ` + ram ${item.frameColor}` : ''}`,
        },
      },
    }))

    stripeLineItems.push({
      quantity: 1,
      price_data: {
        currency: 'sek',
        unit_amount: shippingCents,
        product_data: {
          name: 'Frakt',
          description: 'Leverans inom Sverige',
        },
      },
    })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'sek',
      line_items: stripeLineItems,
      automatic_tax: { enabled: false },
      success_url: `${appUrl}/order/success?orderId=${order.id}`,
      cancel_url: `${appUrl}/order/cancel?orderId=${order.id}`,
      customer_email: shipping.email,
      metadata: {
        orderId: order.id,
      },
    })

    step = 'update-payment'
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { stripeCheckoutSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (err: any) {
    console.error(`[checkout] Error at step "${step}":`, err)
    const message = err?.message || 'Okänt fel'
    return NextResponse.json(
      { error: `Checkout-fel (${step}): ${message}` },
      { status: 500 }
    )
  }
}
