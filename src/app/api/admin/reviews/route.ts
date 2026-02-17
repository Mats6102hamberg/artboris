import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list all listings pending review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || 'pending' // pending | approved | rejected | all

    const where: any = {}
    if (status === 'pending') {
      where.reviewStatus = { in: ['PROCESSING', 'NEEDS_REVIEW'] }
    } else if (status === 'approved') {
      where.reviewStatus = 'APPROVED'
    } else if (status === 'rejected') {
      where.reviewStatus = 'REJECTED'
    }
    // 'all' = no filter

    const listings = await prisma.artworkListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        technique: true,
        category: true,
        imageUrl: true,
        thumbnailUrl: true,
        artistPriceSEK: true,
        isOriginal: true,
        reviewStatus: true,
        isPublic: true,
        aiChecked: true,
        faceDetected: true,
        safetyFlag: true,
        createdAt: true,
        artist: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, listings })
  } catch (error) {
    console.error('[admin/reviews GET] Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta listings.' }, { status: 500 })
  }
}

// PATCH — approve or reject a listing
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, action, rejectReason } = body as {
      listingId: string
      action: 'APPROVE' | 'REJECT'
      rejectReason?: string
    }

    if (!listingId || !action) {
      return NextResponse.json({ error: 'listingId och action krävs.' }, { status: 400 })
    }

    const listing = await prisma.artworkListing.findUnique({
      where: { id: listingId },
      select: { id: true, reviewStatus: true, title: true, artistId: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing hittades inte.' }, { status: 404 })
    }

    if (action === 'APPROVE') {
      await prisma.artworkListing.update({
        where: { id: listingId },
        data: {
          reviewStatus: 'APPROVED',
          isPublic: true,
        },
      })

      console.log(`[admin/reviews] APPROVED listing ${listingId} "${listing.title}"`)
      return NextResponse.json({ success: true, status: 'APPROVED' })
    }

    if (action === 'REJECT') {
      await prisma.artworkListing.update({
        where: { id: listingId },
        data: {
          reviewStatus: 'REJECTED',
          isPublic: false,
        },
      })

      console.log(`[admin/reviews] REJECTED listing ${listingId} "${listing.title}" — reason: ${rejectReason || 'none'}`)
      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    return NextResponse.json({ error: `Okänd action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('[admin/reviews PATCH] Error:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera.' }, { status: 500 })
  }
}
