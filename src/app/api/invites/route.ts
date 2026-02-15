import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function generateCode(type: string): string {
  const prefix = type === 'PHOTOGRAPHER' ? 'FOTO' : 'ARTIST'
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${random}`
}

// GET — list all invite codes (admin)
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invites = await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invites })
}

// POST — create new invite code(s) (admin)
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      type = 'ARTIST',
      note = '',
      maxUses = 1,
      count = 1,
      expiresInDays,
    } = body as {
      type?: 'ARTIST' | 'PHOTOGRAPHER'
      note?: string
      maxUses?: number
      count?: number
      expiresInDays?: number
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const created = []
    for (let i = 0; i < Math.min(count, 50); i++) {
      const invite = await prisma.inviteCode.create({
        data: {
          code: generateCode(type),
          type,
          note,
          maxUses,
          expiresAt,
        },
      })
      created.push(invite)
    }

    return NextResponse.json({ success: true, invites: created })
  } catch (error) {
    console.error('[invites] POST Error:', error)
    return NextResponse.json({ error: 'Kunde inte skapa inbjudan.' }, { status: 500 })
  }
}
