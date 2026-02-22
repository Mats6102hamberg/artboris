import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      orderCount,
      orderPending,
      orderRevenue,
      marketOrderCount,
      marketOrderPending,
      marketOrderRevenue,
      listingTotal,
      listingPendingReview,
      listingPublished,
      userTotal,
      artistCount,
      recentErrors,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['DRAFT', 'AWAITING_PAYMENT', 'PAID'] } } }),
      prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: { not: 'CANCELED' } } }),
      prisma.marketOrder.count(),
      prisma.marketOrder.count({ where: { status: 'PENDING' } }),
      prisma.marketOrder.aggregate({ _sum: { totalCents: true }, where: { status: { not: 'CANCELED' } } }),
      prisma.artworkListing.count(),
      prisma.artworkListing.count({ where: { reviewStatus: { in: ['PROCESSING', 'NEEDS_REVIEW'] } } }),
      prisma.artworkListing.count({ where: { isPublic: true, reviewStatus: 'APPROVED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ARTIST' } }),
      prisma.borisMemory.count({
        where: {
          type: 'INCIDENT',
          createdAt: { gte: oneDayAgo },
        },
      }).catch(() => 0),
    ])

    return NextResponse.json({
      orders: {
        total: orderCount,
        pending: orderPending,
        revenue: orderRevenue._sum?.totalCents || 0,
      },
      marketOrders: {
        total: marketOrderCount,
        pending: marketOrderPending,
        revenue: marketOrderRevenue._sum?.totalCents || 0,
      },
      listings: {
        total: listingTotal,
        pendingReview: listingPendingReview,
        published: listingPublished,
      },
      users: {
        total: userTotal,
        artists: artistCount,
      },
      recentErrors,
    })
  } catch (error) {
    console.error('[admin/dashboard] Error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
