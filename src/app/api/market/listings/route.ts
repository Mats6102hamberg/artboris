import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { optimizeForPrint } from '@/lib/image/printOptimize'

// GET: Public gallery — fetch all published listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const artistId = searchParams.get('artistId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')

    // If artist token provided + matching artistId, show ALL their listings
    const token = request.headers.get('x-artist-token')
    let isOwnDashboard = false
    if (token && artistId) {
      const artist = await prisma.artistProfile.findUnique({ where: { accessToken: token } })
      if (artist && artist.id === artistId) {
        isOwnDashboard = true
      }
    }

    const where: any = isOwnDashboard
      ? { artistId }  // Artist sees all their own listings
      : { isPublic: true, reviewStatus: 'APPROVED', isSold: false }  // Public gallery
    if (category && category !== 'all') where.category = category
    if (!isOwnDashboard && artistId) where.artistId = artistId

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

    // ── Sharp print optimization pipeline ──
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let optimized
    try {
      optimized = await optimizeForPrint(fileBuffer)
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Bildbehandling misslyckades.' }, { status: 400 })
    }

    const ts = Date.now()
    const slug = Math.random().toString(36).slice(2, 8)
    const printExt = optimized.printMimeType === 'image/png' ? 'png' : 'jpg'

    // Upload print-ready version
    const printBlob = await put(
      `market/${artist.id}/${ts}_${slug}_print.${printExt}`,
      optimized.printBuffer,
      { access: 'public', contentType: optimized.printMimeType }
    )

    // Upload thumbnail
    const thumbBlob = await put(
      `market/${artist.id}/${ts}_${slug}_thumb.jpg`,
      optimized.thumbnailBuffer,
      { access: 'public', contentType: 'image/jpeg' }
    )

    const listing = await prisma.artworkListing.create({
      data: {
        artistId: artist.id,
        title,
        description,
        technique,
        category,
        year,
        imageUrl: printBlob.url,
        printUrl: printBlob.url,
        thumbnailUrl: thumbBlob.url,
        imageWidthPx: optimized.optimizedWidthPx,
        imageHeightPx: optimized.optimizedHeightPx,
        maxPrintSize: optimized.maxPrintSize,
        printQuality: optimized.overallQuality,
        widthCm,
        heightCm,
        artistPriceSEK,
        isOriginal,
        maxPrints,
        reviewStatus: 'PROCESSING',
        isPublic: false,
      },
    })

    return NextResponse.json({
      success: true,
      listing,
      imageInfo: {
        originalSize: `${optimized.originalWidthPx}×${optimized.originalHeightPx}`,
        optimizedSize: `${optimized.optimizedWidthPx}×${optimized.optimizedHeightPx}`,
        wasResized: optimized.wasResized,
        resizeDirection: optimized.resizeDirection,
        maxPrintSize: optimized.maxPrintSize,
        overallQuality: optimized.overallQuality,
        sizeQualities: optimized.sizeQualities,
      },
    })
  } catch (error) {
    console.error('[market/listings] POST Error:', error)
    return NextResponse.json({ error: 'Kunde inte skapa konstverk.' }, { status: 500 })
  }
}
