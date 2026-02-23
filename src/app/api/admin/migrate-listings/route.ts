import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-time migration: set all existing listings to APPROVED + isPublic: true.
 * Protected by ADMIN_SECRET.
 *
 * Usage: POST /api/admin/migrate-listings?secret=YOUR_SECRET
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('secret')
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await prisma.artworkListing.updateMany({
      where: {
        OR: [
          { reviewStatus: { not: 'APPROVED' } },
          { isPublic: false },
        ],
      },
      data: {
        reviewStatus: 'APPROVED',
        isPublic: true,
      },
    })

    return NextResponse.json({
      message: `Migrerade ${result.count} listings till APPROVED + isPublic`,
      count: result.count,
    })
  } catch (error) {
    console.error('[admin/migrate-listings] Error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
