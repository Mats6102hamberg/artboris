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
  try {
    const anonId = await getOrCreateAnonId()
    const body = await req.json()

    const { items, shipping, returnPath } = body as {
      items?: CheckoutItem[]
      shipping?: ShippingInput
      returnPath?: string // e.g. '/wallcraft' or '/poster-lab'
      // Legacy single-item fields
      designId?: string
      productType?: string
      sizeCode?: string
      frameColor?: string
      paperType?: string
      quantity?: number
      unitPriceCents?: number
    }

    // Support both multi-item (cart) and legacy single-item
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
      return NextResponse.json(
        { error: 'Inga artiklar att beställa.' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of orderItems) {
      if (!item.designId || !item.productType || !item.sizeCode || item.unitPriceCents == null) {
        return NextResponse.json(
          { error: 'Varje artikel kräver designId, productType, sizeCode, unitPriceCents.' },
          { status: 400 }
        )
      }
    }

    // Validate shipping
    if (!shipping || !shipping.firstName || !shipping.lastName || !shipping.email || !shipping.address || !shipping.postalCode || !shipping.city) {
      return NextResponse.json(
        { error: 'Leveransuppgifter krävs (namn, e-post, adress, postnummer, stad).' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotalCents = orderItems.reduce((sum, item) => {
      const qty = item.quantity || 1
      return sum + item.unitPriceCents * qty
    }, 0)
    const shippingCents = SHIPPING_CENTS
    const totalBeforeVat = subtotalCents + shippingCents
    const taxCents = Math.round(totalBeforeVat * VAT_RATE)
    const totalCents = totalBeforeVat + taxCents

    // Create order + items + shipping + payment in one transaction
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successBase = returnPath || '/order'

    // Build Stripe line items
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

    // Add shipping as line item
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

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { stripeCheckoutSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (err: any) {
    console.error('[checkout] Error:', err)
    const message = err?.message || 'Okänt fel'
    return NextResponse.json(
      { error: `Kunde inte skapa checkout-session: ${message}` },
      { status: 500 }
    )
  }
}
