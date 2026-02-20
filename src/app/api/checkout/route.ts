import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth/getUserId'
import { getPricingConfig, calculateServerPrice } from '@/lib/pricing/prints'
import { reportApiError } from '@/lib/crashcatcher'
import { sendErrorAdminAlert } from '@/server/services/email/adminAlert'
import { borisLogIncident } from '@/lib/boris/autoIncident'

const VALID_PRODUCT_TYPES = ['POSTER', 'CANVAS', 'METAL', 'FRAMED_POSTER'] as const
const VALID_FRAME_COLORS = ['NONE', 'BLACK', 'WHITE', 'OAK', 'WALNUT', 'GOLD'] as const
const VALID_PAPER_TYPES = ['DEFAULT', 'MATTE', 'SEMI_GLOSS', 'FINE_ART'] as const

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key, { apiVersion: '2026-01-28.clover' })
}

interface CheckoutItem {
  designId: string
  productType: string
  sizeCode: string
  frameColor?: string
  paperType?: string
  matEnabled?: boolean
  acrylicGlass?: boolean
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
  confirmationEmail?: string
}

export async function POST(req: Request) {
  let step = 'init'
  let orderId: string | null = null
  let anonId: string | undefined

  try {
    // --- Step 1: Parse & validate ---
    step = 'parse-body'
    anonId = await getUserId()
    const body = await req.json()

    const { items, shipping } = body as {
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

    // --- Step 2: Validate enums & design existence ---
    step = 'validate-data'
    for (const item of orderItems) {
      const pt = item.productType.toUpperCase()
      if (!VALID_PRODUCT_TYPES.includes(pt as any)) {
        return NextResponse.json(
          { error: `Ogiltig produkttyp: "${item.productType}". Tillåtna: ${VALID_PRODUCT_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      item.productType = pt

      const fc = (item.frameColor ?? 'NONE').toUpperCase()
      if (!VALID_FRAME_COLORS.includes(fc as any)) {
        return NextResponse.json(
          { error: `Ogiltig ramfärg: "${item.frameColor}". Tillåtna: ${VALID_FRAME_COLORS.join(', ')}` },
          { status: 400 }
        )
      }
      item.frameColor = fc

      const pp = (item.paperType ?? 'DEFAULT').toUpperCase()
      if (!VALID_PAPER_TYPES.includes(pp as any)) {
        return NextResponse.json(
          { error: `Ogiltig papperstyp: "${item.paperType}". Tillåtna: ${VALID_PAPER_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      item.paperType = pp
    }

    // Verify all designIds exist in DB
    const designIds = [...new Set(orderItems.map(i => i.designId))]
    const existingDesigns = await prisma.design.findMany({
      where: { id: { in: designIds } },
      select: { id: true },
    })
    const existingIds = new Set(existingDesigns.map(d => d.id))
    const missingIds = designIds.filter(id => !existingIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Design(s) hittades inte i databasen: ${missingIds.join(', ')}. Prova att skapa en ny design.` },
        { status: 400 }
      )
    }

    // --- Step 3: Validate Stripe key before creating order ---
    step = 'validate-stripe'
    const stripe = getStripe()

    // --- Step 4: Calculate totals (server-side pricing) ---
    step = 'calculate-totals'
    const pricingConfig = await getPricingConfig()
    const shippingCents = pricingConfig.shippingSEK * 100
    const vatRate = pricingConfig.vatRate

    // Calculate server-side price per item and override client-sent unitPriceCents
    for (const item of orderItems) {
      const frameId = (item.frameColor ?? 'none').toLowerCase()
      const serverPrice = calculateServerPrice(pricingConfig, item.sizeCode, frameId, item.paperType, {
        matEnabled: item.matEnabled ?? false,
        acrylicGlass: item.acrylicGlass ?? false,
      })
      const serverPriceCents = serverPrice.totalPriceSEK * 100

      // Log if client price diverges significantly (> 100 öre / 1 kr)
      if (Math.abs(item.unitPriceCents - serverPriceCents) > 100) {
        console.warn(
          `[checkout] Prisavvikelse för ${item.sizeCode}/${frameId}: klient=${item.unitPriceCents} server=${serverPriceCents}`
        )
      }

      // Always use server-calculated price
      item.unitPriceCents = serverPriceCents
    }

    const subtotalCents = orderItems.reduce((sum, item) => sum + item.unitPriceCents * (item.quantity || 1), 0)
    const taxCents = Math.round((subtotalCents + shippingCents) * vatRate)
    const totalCents = subtotalCents + shippingCents + taxCents

    // --- Step 5: Create order in DB ---
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
            frameColor: item.frameColor as any,
            paperType: item.paperType as any,
            matEnabled: item.matEnabled ?? false,
            acrylicGlass: item.acrylicGlass ?? false,
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
            confirmationEmail: shipping.confirmationEmail || null,
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
    orderId = order.id

    // --- Step 6: Create Stripe session ---
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'sek',
      line_items: stripeLineItems,
      automatic_tax: { enabled: false },
      success_url: `${appUrl}/order/success?orderId=${order.id}`,
      cancel_url: `${appUrl}/order/cancel?orderId=${order.id}`,
      customer_email: shipping.confirmationEmail || shipping.email,
      metadata: {
        orderId: order.id,
      },
    })

    // --- Step 7: Update payment with Stripe session ID ---
    step = 'update-payment'
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { stripeCheckoutSessionId: session.id },
    })

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (err: any) {
    console.error(`[checkout] Error at step "${step}":`, err)

    // Rollback: cancel orphaned order if Stripe failed after order creation
    if (orderId && (step === 'create-stripe-session' || step === 'update-payment')) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELED' },
        })
        console.log(`[checkout] Rolled back order ${orderId} to CANCELED`)
      } catch (rollbackErr) {
        console.error(`[checkout] Rollback failed for order ${orderId}:`, rollbackErr)
      }
    }

    const message = err?.message || 'Okänt fel'

    // Report to Boris + CrashCatcher + admin alert
    borisLogIncident({
      title: `Checkout failed at step: ${step}`,
      description: message,
      tags: ['checkout', 'stripe', 'error', step],
      data: { step, orderId, error: message },
    })
    reportApiError('checkout', err, 'CRITICAL', { userId: anonId, orderId: orderId ?? undefined })
    sendErrorAdminAlert({
      route: `checkout (step: ${step})`,
      error: message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }).catch(() => {})

    return NextResponse.json(
      { error: `Checkout-fel (${step}): ${message}` },
      { status: 500 }
    )
  }
}
