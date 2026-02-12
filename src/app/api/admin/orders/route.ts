import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePrintAsset } from '@/server/services/print/generatePrintAsset'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        payment: true,
        shippingAddress: true,
        items: {
          include: {
            design: { select: { id: true, title: true, imageUrl: true } },
            fulfillment: {
              include: {
                partner: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    // Hämta DesignAssets PRINT för alla designs i ordrarna (full metadata)
    const designIds = [...new Set(orders.flatMap(o => o.items.map(i => i.designId)))]
    const printAssets = await prisma.designAsset.findMany({
      where: { designId: { in: designIds }, role: 'PRINT' },
      select: {
        id: true,
        url: true,
        role: true,
        sizeCode: true,
        productType: true,
        widthPx: true,
        heightPx: true,
        dpi: true,
        fileSize: true,
        mimeType: true,
        sourceWidthPx: true,
        sourceHeightPx: true,
        upscaleFactor: true,
        upscaleProvider: true,
        createdAt: true,
        designId: true,
      },
    })

    const assetMap = new Map<string, (typeof printAssets)[number]>()
    for (const asset of printAssets) {
      const key = `${asset.designId}:${asset.sizeCode}:${asset.productType}`
      if (!assetMap.has(key)) assetMap.set(key, asset)
    }

    const enriched = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        printAsset: assetMap.get(`${item.designId}:${item.sizeCode}:${item.productType}`) ?? null,
      })),
    }))

    return NextResponse.json({ success: true, orders: enriched })
  } catch (error) {
    console.error('[admin/orders GET] Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta ordrar.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, fulfillmentId, trackingNumber, trackingUrl, carrier } = body

    if (!fulfillmentId || !action) {
      return NextResponse.json({ error: 'fulfillmentId och action krävs.' }, { status: 400 })
    }

    if (action === 'IN_PRODUCTION') {
      const fulfillment = await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: 'IN_PRODUCTION',
        },
        include: { orderItem: { select: { orderId: true } } },
      })

      // Uppdatera Order-status också
      await prisma.order.update({
        where: { id: fulfillment.orderItem.orderId },
        data: { status: 'IN_PRODUCTION' },
      })

      return NextResponse.json({ success: true, fulfillment })
    }

    if (action === 'SHIPPED') {
      const fulfillment = await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date(),
          carrier: carrier ?? null,
          trackingNumber: trackingNumber ?? null,
          trackingUrl: trackingUrl ?? null,
        },
        include: { orderItem: { select: { orderId: true } } },
      })

      // Kolla om alla items i ordern är SHIPPED
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: fulfillment.orderItem.orderId },
        include: { fulfillment: true },
      })

      const allShipped = allItems.every(i => i.fulfillment?.status === 'SHIPPED' || i.fulfillment?.status === 'DELIVERED')

      if (allShipped) {
        await prisma.order.update({
          where: { id: fulfillment.orderItem.orderId },
          data: { status: 'SHIPPED' },
        })
      }

      return NextResponse.json({ success: true, fulfillment })
    }

    if (action === 'DELIVERED') {
      const fulfillment = await prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
        include: { orderItem: { select: { orderId: true } } },
      })

      const allItems = await prisma.orderItem.findMany({
        where: { orderId: fulfillment.orderItem.orderId },
        include: { fulfillment: true },
      })

      const allDelivered = allItems.every(i => i.fulfillment?.status === 'DELIVERED')

      if (allDelivered) {
        await prisma.order.update({
          where: { id: fulfillment.orderItem.orderId },
          data: { status: 'DELIVERED' },
        })
      }

      return NextResponse.json({ success: true, fulfillment })
    }

    if (action === 'GENERATE_PRINT') {
      // Admin-triggered print asset generation (for premium sizes or failed items)
      const { orderItemId } = body

      if (!orderItemId) {
        return NextResponse.json({ error: 'orderItemId krävs för GENERATE_PRINT.' }, { status: 400 })
      }

      const item = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: { design: { select: { imageUrl: true } } },
      })

      if (!item) {
        return NextResponse.json({ error: 'OrderItem hittades inte.' }, { status: 404 })
      }

      console.log(`[admin] Triggering print asset generation for OrderItem ${orderItemId}`)

      const result = await generatePrintAsset({
        designId: item.designId,
        imageUrl: item.design.imageUrl,
        sizeCode: item.sizeCode,
        productType: item.productType,
        targetDpi: 150,
      })

      if (result.success) {
        // Om fulfillment var FAILED, sätt tillbaka till QUEUED
        if (fulfillmentId) {
          const f = await prisma.fulfillment.findUnique({ where: { id: fulfillmentId } })
          if (f && f.status === 'FAILED') {
            await prisma.fulfillment.update({
              where: { id: fulfillmentId },
              data: { status: 'QUEUED', internalNote: null },
            })
          }
        }

        return NextResponse.json({
          success: true,
          assetId: result.assetId,
          durationMs: result.durationMs,
        })
      } else {
        return NextResponse.json({ error: result.error || 'Print generation failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: `Okänd action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('[admin/orders PATCH] Error:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera.' }, { status: 500 })
  }
}
