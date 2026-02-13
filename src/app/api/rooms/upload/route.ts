import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large (max 10 MB).' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rooms')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/rooms/${filename}`

    return NextResponse.json({
      success: true,
      room: {
        id: `room_${Date.now()}`,
        imageUrl,
        thumbnailUrl: imageUrl,
        width: 0,
        height: 0,
        wallCorners: [],
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[rooms/upload] Error:', error)
    return NextResponse.json(
      { error: 'Uppladdning misslyckades.' },
      { status: 500 }
    )
  }
}
