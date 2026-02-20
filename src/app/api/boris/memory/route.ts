import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list memories (filtered by type, tags, resolved)
export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'INCIDENT' | 'UX_LEARNING' | 'PATTERN' | null
  const tag = searchParams.get('tag')
  const resolved = searchParams.get('resolved')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (tag) where.tags = { has: tag }
  if (resolved === 'true') where.resolved = true
  if (resolved === 'false') where.resolved = false

  const memories = await prisma.borisMemory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ memories, count: memories.length })
}

// POST — create a new memory
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { type, title, description, data, tags, confidence } = body

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'type, title, description required.' }, { status: 400 })
    }

    const memory = await prisma.borisMemory.create({
      data: {
        type,
        title,
        description,
        data: data ?? undefined,
        tags: tags ?? [],
        confidence: confidence ?? 0.5,
      },
    })

    return NextResponse.json({ success: true, memory })
  } catch (error) {
    console.error('[boris/memory] POST error:', error)
    return NextResponse.json({ error: 'Failed to create memory.' }, { status: 500 })
  }
}

// PATCH — update a memory (resolve, change confidence, etc.)
export async function PATCH(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    const memory = await prisma.borisMemory.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json({ success: true, memory })
  } catch (error) {
    console.error('[boris/memory] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update memory.' }, { status: 500 })
  }
}
