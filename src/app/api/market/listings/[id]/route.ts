import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Single listing detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const listing = await prisma.artworkListing.findUnique({
      where: { id },
      include: {
        artist: {
          select: { id: true, displayName: true, bio: true, avatarUrl: true, website: true, instagram: true },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Konstverk hittades inte.' }, { status: 404 })
    }

    // Increment views
    await prisma.artworkListing.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('[market/listings/[id]] GET Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta konstverk.' }, { status: 500 })
  }
}

// DELETE: Artist deletes their listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('x-artist-token')
    if (!token) {
      return NextResponse.json({ error: 'Åtkomsttoken krävs.' }, { status: 401 })
    }

    const artist = await prisma.artistProfile.findUnique({ where: { accessToken: token } })
    if (!artist) {
      return NextResponse.json({ error: 'Ogiltig konstnär.' }, { status: 401 })
    }

    const listing = await prisma.artworkListing.findUnique({ where: { id } })
    if (!listing || listing.artistId !== artist.id) {
      return NextResponse.json({ error: 'Konstverk hittades inte eller tillhör inte dig.' }, { status: 404 })
    }

    await prisma.artworkListing.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[market/listings/[id]] DELETE Error:', error)
    return NextResponse.json({ error: 'Kunde inte ta bort konstverk.' }, { status: 500 })
  }
}
