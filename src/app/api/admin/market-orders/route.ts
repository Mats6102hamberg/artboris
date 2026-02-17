import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list all market orders
export async function GET() {
  try {
    const orders = await prisma.marketOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            thumbnailUrl: true,
            isOriginal: true,
          },
        },
        artist: {
          select: {
            id: true,
            displayName: true,
            email: true,
            stripeAccountId: true,
            stripeOnboardingDone: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('[admin/market-orders GET] Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta market orders.' }, { status: 500 })
  }
}

// PATCH — update market order status, add tracking
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketOrderId, action, trackingNumber, trackingUrl } = body as {
      marketOrderId: string
      action: 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELED'
      trackingNumber?: string
      trackingUrl?: string
    }

    if (!marketOrderId || !action) {
      return NextResponse.json({ error: 'marketOrderId och action krävs.' }, { status: 400 })
    }

    const order = await prisma.marketOrder.findUnique({
      where: { id: marketOrderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order hittades inte.' }, { status: 404 })
    }

    if (action === 'IN_PRODUCTION') {
      await prisma.marketOrder.update({
        where: { id: marketOrderId },
        data: { status: 'IN_PRODUCTION' },
      })
      return NextResponse.json({ success: true, status: 'IN_PRODUCTION' })
    }

    if (action === 'SHIPPED') {
      await prisma.marketOrder.update({
        where: { id: marketOrderId },
        data: {
          status: 'SHIPPED',
          trackingNumber: trackingNumber ?? null,
          trackingUrl: trackingUrl ?? null,
        },
      })
      return NextResponse.json({ success: true, status: 'SHIPPED' })
    }

    if (action === 'DELIVERED') {
      await prisma.marketOrder.update({
        where: { id: marketOrderId },
        data: { status: 'DELIVERED' },
      })
      return NextResponse.json({ success: true, status: 'DELIVERED' })
    }

    if (action === 'CANCELED') {
      await prisma.marketOrder.update({
        where: { id: marketOrderId },
        data: { status: 'CANCELED' },
      })
      return NextResponse.json({ success: true, status: 'CANCELED' })
    }

    return NextResponse.json({ error: `Okänd action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('[admin/market-orders PATCH] Error:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera.' }, { status: 500 })
  }
}
