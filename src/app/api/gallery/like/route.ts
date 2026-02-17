import { NextRequest, NextResponse } from 'next/server'
import { toggleLike, removeLike } from '@/server/services/gallery/like'
import { getUserId } from '@/lib/auth/getUserId'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { designId } = body

    if (!designId) {
      return NextResponse.json(
        { error: 'designId is required.' },
        { status: 400 }
      )
    }

    const anonId = await getUserId()
    const result = await toggleLike(designId, anonId)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[gallery/like POST] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte toggla like.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { designId } = body

    if (!designId) {
      return NextResponse.json(
        { error: 'designId is required.' },
        { status: 400 }
      )
    }

    const anonId = await getUserId()
    const result = await removeLike(designId, anonId)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[gallery/like DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte ta bort like.' },
      { status: 500 }
    )
  }
}
