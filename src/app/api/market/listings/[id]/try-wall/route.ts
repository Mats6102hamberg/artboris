import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Increment try-on-wall counter for a listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.artworkListing.update({
      where: { id },
      data: { tryOnWallCount: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[market/listings/[id]/try-wall] Error:', error)
    return NextResponse.json({ error: 'Misslyckades.' }, { status: 500 })
  }
}
