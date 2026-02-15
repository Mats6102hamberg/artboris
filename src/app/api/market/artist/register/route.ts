import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/server/services/credits/spend'

const INVITE_BONUS_CREDITS = 20

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, displayName, bio, website, instagram, phone, bankAccount, orgNumber, inviteCode } = body

    if (!email || !displayName) {
      return NextResponse.json({ error: 'E-post och visningsnamn krävs.' }, { status: 400 })
    }

    if (!inviteCode) {
      return NextResponse.json({ error: 'Inbjudningskod krävs för registrering.' }, { status: 400 })
    }

    // Validate invite code
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.toUpperCase() },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Ogiltig inbjudningskod.' }, { status: 400 })
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Inbjudningskoden har gått ut.' }, { status: 400 })
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json({ error: 'Inbjudningskoden har redan använts.' }, { status: 400 })
    }

    // Check if artist already exists
    const existing = await prisma.artistProfile.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({
        error: 'En konstnär med denna e-post finns redan.',
        accessToken: existing.accessToken,
      }, { status: 409 })
    }

    // Create artist + redeem invite in transaction
    const artist = await prisma.$transaction(async (tx) => {
      const newArtist = await tx.artistProfile.create({
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
          isApproved: true,
        },
      })

      // Mark invite as used
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: {
          usedCount: { increment: 1 },
          redeemedById: newArtist.id,
          redeemedAt: new Date(),
        },
      })

      return newArtist
    })

    // Grant welcome credits (outside transaction — non-critical)
    await addCredits(artist.id, INVITE_BONUS_CREDITS, `Välkomstbonus: ${INVITE_BONUS_CREDITS} credits (inbjudningskod ${inviteCode.toUpperCase()})`).catch(err =>
      console.error('[register] Failed to add welcome credits:', err)
    )

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
