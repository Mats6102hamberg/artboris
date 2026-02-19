import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth/getUserId'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const anonId = await getUserId()
    const body = await request.json()
    const { imageUrl, roomImageUrl, wallCorners, imageWidth, imageHeight, style: customStyle, title: customTitle } = body as {
      imageUrl: string
      roomImageUrl?: string
      wallCorners?: string
      imageWidth?: number
      imageHeight?: number
      style?: string
      title?: string
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required.' }, { status: 400 })
    }

    // Create design with the uploaded image as the main variant
    const design = await prisma.design.create({
      data: {
        userId: anonId,
        title: customTitle || 'My Photo',
        description: '',
        imageUrl,
        style: customStyle || 'user-upload',
        prompt: '',
        roomImageUrl: roomImageUrl || null,
        wallCorners: wallCorners || null,
        positionX: 0.5,
        positionY: 0.4,
        scale: 1.0,
        frameId: 'black',
        sizeId: '50x70',
        variants: {
          create: {
            imageUrl,
            thumbnailUrl: imageUrl,
            seed: 0,
            sortOrder: 0,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      designId: design.id,
    })
  } catch (error) {
    console.error('[designs/create-from-upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create design.' },
      { status: 500 }
    )
  }
}
