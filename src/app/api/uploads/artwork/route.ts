import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large (max 25 MB).' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `artwork_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(`uploads/artwork/${filename}`, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    })
  } catch (error) {
    console.error('[uploads/artwork] Error:', error)
    return NextResponse.json(
      { error: 'Upload failed.' },
      { status: 500 }
    )
  }
}
