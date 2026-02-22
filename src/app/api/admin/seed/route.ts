import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-time admin seed endpoint.
 * Sets mhg10mhg@gmail.com to ADMIN role.
 * Protected by ADMIN_SECRET — call once, then this is a no-op.
 *
 * Usage: POST /api/admin/seed  (with x-admin-key header or ?secret= param)
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('secret')
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ADMIN_EMAIL = 'mhg10mhg@gmail.com'

  try {
    const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })

    if (!user) {
      return NextResponse.json({ error: `User ${ADMIN_EMAIL} not found. Log in first to create the account.` }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ message: 'Already ADMIN', userId: user.id })
    }

    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: 'ADMIN' },
    })

    return NextResponse.json({ message: `${ADMIN_EMAIL} is now ADMIN`, userId: user.id })
  } catch (error) {
    console.error('[admin/seed] Error:', error)
    return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 })
  }
}
