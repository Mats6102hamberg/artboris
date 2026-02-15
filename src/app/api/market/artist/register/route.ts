import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, displayName, bio, website, instagram, phone, bankAccount, orgNumber } = body

    if (!email || !displayName) {
      return NextResponse.json({ error: 'E-post och visningsnamn krävs.' }, { status: 400 })
    }

    // Check if artist already exists
    const existing = await prisma.artistProfile.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({
        error: 'En konstnär med denna e-post finns redan.',
        accessToken: existing.accessToken,
      }, { status: 409 })
    }

    const artist = await prisma.artistProfile.create({
      data: {
        email,
        displayName,
        bio: bio || '',
        website: website || '',
        instagram: instagram || '',
        phone: phone || '',
        bankAccount: bankAccount || '',
        orgNumber: orgNumber || '',
        acceptedTermsAt: new Date(),
        isApproved: true, // Auto-approve for now
      },
    })

    return NextResponse.json({
      success: true,
      artist: {
        id: artist.id,
        email: artist.email,
        displayName: artist.displayName,
        accessToken: artist.accessToken,
      },
    })
  } catch (error) {
    console.error('[market/artist/register] Error:', error)
    return NextResponse.json(
      { error: 'Registrering misslyckades.' },
      { status: 500 }
    )
  }
}
