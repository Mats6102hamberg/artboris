import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list insights
export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (status) where.status = status

  const insights = await prisma.borisInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ insights, count: insights.length })
}

// POST — create insight
export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const { category, title, problem, segment, dataSupport, hypothesis, recommendation, experiment, riskLevel } = body

    if (!category || !title || !problem) {
      return NextResponse.json({ error: 'category, title, problem required.' }, { status: 400 })
    }

    const insight = await prisma.borisInsight.create({
      data: {
        category,
        title,
        problem,
        segment: segment ?? null,
        dataSupport: dataSupport ?? undefined,
        hypothesis: hypothesis ?? null,
        recommendation: recommendation ?? null,
        experiment: experiment ?? undefined,
        riskLevel: riskLevel ?? 'low',
      },
    })

    return NextResponse.json({ success: true, insight })
  } catch (error) {
    console.error('[boris/insights] POST error:', error)
    return NextResponse.json({ error: 'Failed to create insight.' }, { status: 500 })
  }
}

// PATCH — update insight status
export async function PATCH(request: NextRequest) {

  try {
    const body = await request.json()
    const { id, status: newStatus, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'id required.' }, { status: 400 })
    }

    const data: Record<string, unknown> = { ...rest }
    if (newStatus) {
      data.status = newStatus
      if (newStatus === 'resolved') data.resolvedAt = new Date()
    }

    const insight = await prisma.borisInsight.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, insight })
  } catch (error) {
    console.error('[boris/insights] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update insight.' }, { status: 500 })
  }
}
