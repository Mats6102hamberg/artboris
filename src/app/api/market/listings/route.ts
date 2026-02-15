import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

// GET: Public gallery — fetch all published listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const artistId = searchParams.get('artistId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')

    const where: any = { isPublished: true, isSold: false }
    if (category && category !== 'all') where.category = category
    if (artistId) where.artistId = artistId

    const [listings, total] = await Promise.all([
      prisma.artworkListing.findMany({
        where,
        include: {
          artist: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.artworkListing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[market/listings] GET Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta konstverk.' }, { status: 500 })
  }
}

// POST: Artist creates a new listing (requires accessToken)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-artist-token')
    if (!token) {
      return NextResponse.json({ error: 'Åtkomsttoken krävs.' }, { status: 401 })
    }

    const artist = await prisma.artistProfile.findUnique({ where: { accessToken: token } })
    if (!artist || !artist.isActive) {
      return NextResponse.json({ error: 'Ogiltig eller inaktiv konstnär.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const technique = (formData.get('technique') as string) || ''
    const category = (formData.get('category') as string) || 'painting'
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null
    const widthCm = formData.get('widthCm') ? parseFloat(formData.get('widthCm') as string) : null
    const heightCm = formData.get('heightCm') ? parseFloat(formData.get('heightCm') as string) : null
    const artistPriceSEK = parseInt(formData.get('artistPriceSEK') as string) || 0
    const isOriginal = formData.get('isOriginal') === 'true'
    const maxPrints = formData.get('maxPrints') ? parseInt(formData.get('maxPrints') as string) : null

    if (!file || !title || !artistPriceSEK) {
      return NextResponse.json({ error: 'Bild, titel och pris krävs.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Filen måste vara en bild.' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bilden är för stor (max 50 MB).' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `market/${artist.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    const listing = await prisma.artworkListing.create({
      data: {
        artistId: artist.id,
        title,
        description,
        technique,
        category,
        year,
        imageUrl: blob.url,
        widthCm,
        heightCm,
        artistPriceSEK,
        isOriginal,
        maxPrints,
        isPublished: true,
      },
    })

    return NextResponse.json({ success: true, listing })
  } catch (error) {
    console.error('[market/listings] POST Error:', error)
    return NextResponse.json({ error: 'Kunde inte skapa konstverk.' }, { status: 500 })
  }
}
