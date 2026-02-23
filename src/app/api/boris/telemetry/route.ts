import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// POST — batch insert telemetry events
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck instanceof NextResponse) return adminCheck

    const { events } = await request.json()

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided.' }, { status: 400 })
    }

    if (events.length > 50) {
      return NextResponse.json({ error: 'Max 50 events per batch.' }, { status: 400 })
    }

    const rows = events.map((e: Record<string, unknown>) => ({
      event: String(e.event || 'unknown'),
      sessionId: String(e.sessionId || 'unknown'),
      userId: e.userId ? String(e.userId) : null,
      path: String(e.path || '/'),
      device: e.device ? String(e.device) : null,
      locale: e.locale ? String(e.locale) : null,
      country: null as string | null,
      metadata: (e.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    }))

    await prisma.telemetryEvent.createMany({ data: rows })

    return NextResponse.json({ success: true, count: rows.length })
  } catch (error) {
    console.error('[boris/telemetry] POST error:', error)
    return NextResponse.json({ error: 'Failed to store events.' }, { status: 500 })
  }
}

// GET — query events
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const event = searchParams.get('event')
  const days = parseInt(searchParams.get('days') || '7', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 5000)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
  }
  if (event) where.event = event

  const events = await prisma.telemetryEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ events, count: events.length })
}
