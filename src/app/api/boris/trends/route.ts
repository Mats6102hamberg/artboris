import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — sales & trend intelligence
export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)

  // ─── 1. Sales by style ───────────────────────────────
  const paidOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      createdAt: { gte: since },
    },
    include: {
      items: {
        include: { design: { select: { style: true, isAiGenerated: true } } },
      },
    },
  })

  const styleStats: Record<string, { count: number; revenueCents: number }> = {}
  const sizeStats: Record<string, { count: number; revenueCents: number }> = {}
  const frameStats: Record<string, { count: number; revenueCents: number }> = {}
  let totalRevenueCents = 0
  let totalItems = 0
  let aiGeneratedCount = 0
  let uploadedCount = 0

  for (const order of paidOrders) {
    for (const item of order.items) {
      const style = item.design?.style || 'unknown'
      const isAi = item.design?.isAiGenerated ?? false

      if (!styleStats[style]) styleStats[style] = { count: 0, revenueCents: 0 }
      styleStats[style].count += item.quantity
      styleStats[style].revenueCents += item.lineTotalCents

      if (!sizeStats[item.sizeCode]) sizeStats[item.sizeCode] = { count: 0, revenueCents: 0 }
      sizeStats[item.sizeCode].count += item.quantity
      sizeStats[item.sizeCode].revenueCents += item.lineTotalCents

      const frame = item.frameColor || 'NONE'
      if (!frameStats[frame]) frameStats[frame] = { count: 0, revenueCents: 0 }
      frameStats[frame].count += item.quantity
      frameStats[frame].revenueCents += item.lineTotalCents

      totalRevenueCents += item.lineTotalCents
      totalItems += item.quantity
      if (isAi) aiGeneratedCount += item.quantity
      else uploadedCount += item.quantity
    }
  }

  // Sort by revenue
  const topStyles = Object.entries(styleStats)
    .map(([style, data]) => ({ style, ...data, revenueSEK: data.revenueCents / 100 }))
    .sort((a, b) => b.revenueCents - a.revenueCents)

  const topSizes = Object.entries(sizeStats)
    .map(([size, data]) => ({ size, ...data, revenueSEK: data.revenueCents / 100 }))
    .sort((a, b) => b.count - a.count)

  const topFrames = Object.entries(frameStats)
    .map(([frame, data]) => ({ frame, ...data, revenueSEK: data.revenueCents / 100 }))
    .sort((a, b) => b.count - a.count)

  // ─── 2. Generation popularity (from telemetry) ───────
  const genEvents = await prisma.telemetryEvent.findMany({
    where: {
      event: 'GENERATE_ART',
      createdAt: { gte: since },
    },
    select: { metadata: true },
  })

  const genStyleCounts: Record<string, number> = {}
  for (const ev of genEvents) {
    const meta = ev.metadata as Record<string, unknown> | null
    const style = meta?.style ? String(meta.style) : 'unknown'
    genStyleCounts[style] = (genStyleCounts[style] || 0) + 1
  }

  const popularGenerations = Object.entries(genStyleCounts)
    .map(([style, count]) => ({ style, generations: count }))
    .sort((a, b) => b.generations - a.generations)

  // ─── 3. Add-to-cart rate by style (from telemetry) ───
  const cartEvents = await prisma.telemetryEvent.findMany({
    where: {
      event: 'ADD_TO_CART',
      createdAt: { gte: since },
    },
    select: { metadata: true },
  })

  const cartStyleCounts: Record<string, number> = {}
  for (const ev of cartEvents) {
    const meta = ev.metadata as Record<string, unknown> | null
    const sizeId = meta?.sizeId ? String(meta.sizeId) : 'unknown'
    cartStyleCounts[sizeId] = (cartStyleCounts[sizeId] || 0) + 1
  }

  // ─── 4. Conversion metrics ───────────────────────────
  const pageViews = await prisma.telemetryEvent.count({
    where: { event: 'PAGE_VIEW', createdAt: { gte: since } },
  })
  const addToCartCount = await prisma.telemetryEvent.count({
    where: { event: 'ADD_TO_CART', createdAt: { gte: since } },
  })
  const checkoutStarts = await prisma.telemetryEvent.count({
    where: { event: 'START_CHECKOUT', createdAt: { gte: since } },
  })

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    revenue: {
      totalSEK: totalRevenueCents / 100,
      totalOrders: paidOrders.length,
      totalItems,
      aiGenerated: aiGeneratedCount,
      uploaded: uploadedCount,
      avgOrderSEK: paidOrders.length > 0 ? Math.round(totalRevenueCents / paidOrders.length / 100) : 0,
    },
    topStyles,
    topSizes,
    topFrames,
    popularGenerations,
    conversion: {
      pageViews,
      addToCart: addToCartCount,
      checkoutStarts,
      viewToCartRate: pageViews > 0 ? Math.round((addToCartCount / pageViews) * 10000) / 100 : 0,
      cartToCheckoutRate: addToCartCount > 0 ? Math.round((checkoutStarts / addToCartCount) * 10000) / 100 : 0,
    },
  })
}
