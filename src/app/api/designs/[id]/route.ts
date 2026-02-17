import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth/getUserId'

// GET — load a design with its variants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, design })
  } catch (error) {
    console.error('[designs/[id]] GET error:', error)
    return NextResponse.json({ error: 'Could not load design.' }, { status: 500 })
  }
}

// PATCH — update editor state (position, scale, frame, size, selectedVariant)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const anonId = await getUserId()
    const body = await request.json()

    // Verify ownership
    const existing = await prisma.design.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Design not found.' }, { status: 404 })
    }
    if (existing.userId !== anonId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
    }

    // Only allow updating specific fields
    const allowedFields: Record<string, unknown> = {}
    if (body.positionX !== undefined) allowedFields.positionX = body.positionX
    if (body.positionY !== undefined) allowedFields.positionY = body.positionY
    if (body.scale !== undefined) allowedFields.scale = body.scale
    if (body.frameId !== undefined) allowedFields.frameId = body.frameId
    if (body.sizeId !== undefined) allowedFields.sizeId = body.sizeId
    if (body.selectedVariantId !== undefined) allowedFields.selectedVariantId = body.selectedVariantId
    if (body.imageUrl !== undefined) allowedFields.imageUrl = body.imageUrl
    if (body.title !== undefined) allowedFields.title = body.title
    if (body.cropMode !== undefined) allowedFields.cropMode = body.cropMode
    if (body.cropOffsetX !== undefined) allowedFields.cropOffsetX = body.cropOffsetX
    if (body.cropOffsetY !== undefined) allowedFields.cropOffsetY = body.cropOffsetY
    if (body.isAiGenerated !== undefined) allowedFields.isAiGenerated = body.isAiGenerated

    const design = await prisma.design.update({
      where: { id },
      data: allowedFields,
    })

    return NextResponse.json({ success: true, design })
  } catch (error) {
    console.error('[designs/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Could not update design.' }, { status: 500 })
  }
}
