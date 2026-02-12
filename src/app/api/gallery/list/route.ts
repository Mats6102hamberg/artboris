import { NextRequest, NextResponse } from 'next/server'
import { listGallery, likeGalleryItem } from '@/server/services/gallery/list'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const style = searchParams.get('style') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = (searchParams.get('sortBy') as 'recent' | 'popular') || 'recent'

    const result = await listGallery({ style, limit, offset, sortBy })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[gallery/list] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta galleri.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { galleryItemId } = body

    if (!galleryItemId) {
      return NextResponse.json(
        { error: 'galleryItemId krävs.' },
        { status: 400 }
      )
    }

    const item = await likeGalleryItem(galleryItemId)

    return NextResponse.json({
      success: true,
      likes: item.likes,
    })
  } catch (error) {
    console.error('[gallery/list POST] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte gilla.' },
      { status: 500 }
    )
  }
}
