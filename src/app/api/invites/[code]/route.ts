import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — validate an invite code (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const invite = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!invite) {
    return NextResponse.json({ valid: false, error: 'Ogiltig inbjudningskod.' }, { status: 404 })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: 'Inbjudningskoden har gått ut.' }, { status: 410 })
  }

  if (invite.usedCount >= invite.maxUses) {
    return NextResponse.json({ valid: false, error: 'Inbjudningskoden har redan använts.' }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    type: invite.type,
    note: invite.note,
  })
}
