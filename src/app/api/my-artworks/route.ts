import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const artworks = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      artworks,
      total: artworks.length,
    })
  } catch (error) {
    console.error('Failed to fetch artworks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const artwork = await prisma.artwork.create({
      data: {
        title: body.title,
        artist: body.artist,
        description: body.description,
        price: body.price,
        imageUrl: body.imageUrl ?? '',
        category: body.category ?? 'målning',
        year: body.year,
        status: 'tillgänglig',
        views: 0,
      },
    })

    return NextResponse.json({
      success: true,
      artwork,
    })
  } catch (error) {
    console.error('Failed to create artwork:', error)
    return NextResponse.json(
      { error: 'Failed to create artwork' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    const artwork = await prisma.artwork.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({
      success: true,
      artwork,
    })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }
    console.error('Failed to update artwork:', error)
    return NextResponse.json(
      { error: 'Failed to update artwork' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    await prisma.artwork.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Artwork deleted successfully',
    })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }
    console.error('Failed to delete artwork:', error)
    return NextResponse.json(
      { error: 'Failed to delete artwork' },
      { status: 500 }
    )
  }
}
