import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Crimson Print Partner Webhook
 *
 * Crimson calls this endpoint to confirm order receipt or update status.
 * Protected by a shared secret (CRIMSON_WEBHOOK_SECRET).
 *
 * POST /api/webhook/crimson
 * Headers: x-crimson-secret: <shared secret>
 * Body: {
 *   event: 'order.received' | 'order.in_production' | 'order.shipped',
 *   orderId: string,        // Artboris order ID
 *   partnerOrderRef?: string, // Crimson's internal order number
 *   trackingNumber?: string,
 *   trackingUrl?: string,
 *   carrier?: string,
 * }
 */

export async function POST(req: Request) {
  // Verify shared secret
  const secret = req.headers.get('x-crimson-secret')
  const expectedSecret = process.env.CRIMSON_WEBHOOK_SECRET

  if (!expectedSecret) {
    console.error('[crimson webhook] CRIMSON_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (secret !== expectedSecret) {
    console.warn('[crimson webhook] Invalid secret')
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const body = await req.json()
  const { event, orderId, partnerOrderRef, trackingNumber, trackingUrl, carrier } = body as {
    event: string
    orderId: string
    partnerOrderRef?: string
    trackingNumber?: string
    trackingUrl?: string
    carrier?: string
  }

  if (!event || !orderId) {
    return NextResponse.json({ error: 'event and orderId required' }, { status: 400 })
  }

  console.log(`[crimson webhook] ${event} for order ${orderId}`)

  // Find all fulfillments for this order
  const fulfillments = await prisma.fulfillment.findMany({
    where: {
      orderItem: { orderId },
      partnerId: 'crimson-stockholm',
    },
  })

  if (fulfillments.length === 0) {
    return NextResponse.json({ error: 'No fulfillments found for order' }, { status: 404 })
  }

  if (event === 'order.received') {
    // Crimson confirms they received the order
    for (const f of fulfillments) {
      await prisma.fulfillment.update({
        where: { id: f.id },
        data: {
          partnerOrderRef: partnerOrderRef || f.partnerOrderRef,
          internalNote: `Crimson bekräftar mottagning ${new Date().toISOString()}`,
        },
      })
    }

    return NextResponse.json({ ok: true, message: 'Order receipt confirmed' })
  }

  if (event === 'order.in_production') {
    for (const f of fulfillments) {
      await prisma.fulfillment.update({
        where: { id: f.id },
        data: {
          status: 'IN_PRODUCTION',
          partnerOrderRef: partnerOrderRef || f.partnerOrderRef,
        },
      })
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'IN_PRODUCTION' },
    })

    return NextResponse.json({ ok: true, message: 'Order marked in production' })
  }

  if (event === 'order.shipped') {
    for (const f of fulfillments) {
      await prisma.fulfillment.update({
        where: { id: f.id },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date(),
          carrier: carrier || f.carrier,
          trackingNumber: trackingNumber || f.trackingNumber,
          trackingUrl: trackingUrl || f.trackingUrl,
          partnerOrderRef: partnerOrderRef || f.partnerOrderRef,
        },
      })
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    })

    // Send tracking email to customer
    const { sendShippedEmail } = await import('@/server/services/email/sendEmail')
    sendShippedEmail(orderId, {
      carrier: carrier || null,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
    }).catch(err => console.error('[crimson webhook] Shipped email failed:', err))

    return NextResponse.json({ ok: true, message: 'Order marked shipped' })
  }

  return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
}
