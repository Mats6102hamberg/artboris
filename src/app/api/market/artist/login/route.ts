import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'E-post krävs.' }, { status: 400 })
    }

    const artist = await prisma.artistProfile.findUnique({ where: { email } })
    if (!artist) {
      return NextResponse.json({ error: 'Ingen konstnär hittades med denna e-post.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      artist: {
        id: artist.id,
        email: artist.email,
        displayName: artist.displayName,
        accessToken: artist.accessToken,
        isApproved: artist.isApproved,
      },
    })
  } catch (error) {
    console.error('[market/artist/login] Error:', error)
    return NextResponse.json({ error: 'Inloggning misslyckades.' }, { status: 500 })
  }
}
