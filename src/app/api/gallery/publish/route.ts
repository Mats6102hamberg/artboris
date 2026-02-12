import { NextRequest, NextResponse } from 'next/server'
import { publishToGallery, unpublishFromGallery } from '@/server/services/gallery/publish'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, imageUrl, mockupUrl, style, roomType, colorMood } = body

    if (!userId || !title || !imageUrl) {
      return NextResponse.json(
        { error: 'userId, title och imageUrl krävs.' },
        { status: 400 }
      )
    }

    const result = await publishToGallery({
      userId,
      title,
      description: description || '',
      imageUrl,
      mockupUrl: mockupUrl || '',
      style: style || 'minimal',
      roomType,
      colorMood,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[gallery/publish] Error:', error)
    return NextResponse.json(
      { error: 'Publicering misslyckades.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { galleryItemId, userId } = body

    if (!galleryItemId || !userId) {
      return NextResponse.json(
        { error: 'galleryItemId och userId krävs.' },
        { status: 400 }
      )
    }

    const result = await unpublishFromGallery(galleryItemId, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[gallery/publish DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Avpublicering misslyckades.' },
      { status: 500 }
    )
  }
}
