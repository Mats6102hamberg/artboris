import { NextRequest, NextResponse } from 'next/server'
import { publishToGallery, unpublishFromGallery } from '@/server/services/gallery/publish'
import { getUserId } from '@/lib/auth/getUserId'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const { designId } = body

    if (!designId) {
      return NextResponse.json(
        { error: 'designId krävs.' },
        { status: 400 }
      )
    }

    const result = await publishToGallery({ designId, userId })
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
    const userId = await getUserId()
    const body = await request.json()
    const { designId } = body

    if (!designId) {
      return NextResponse.json(
        { error: 'designId krävs.' },
        { status: 400 }
      )
    }

    const result = await unpublishFromGallery(designId, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[gallery/publish DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Avpublicering misslyckades.' },
      { status: 500 }
    )
  }
}
