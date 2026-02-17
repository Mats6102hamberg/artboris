import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth/getUserId'

export async function GET() {
  try {
    const userId = await getUserId()

    const items = await prisma.scannerPortfolioItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Portfolio GET error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta portfölj' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    const body = await request.json()

    const item = await prisma.scannerPortfolioItem.upsert({
      where: {
        userId_title_source: {
          userId,
          title: body.title || '',
          source: body.source || '',
        },
      },
      update: {
        artist: body.artist || '',
        sourceUrl: body.url || body.sourceUrl || '',
        imageUrl: body.imageUrl || '',
        description: body.description || '',
        category: body.category || '',
        price: body.price || 0,
        estimatedValue: body.estimatedValue || 0,
        profit: body.profit ?? (body.estimatedValue || 0) - (body.price || 0),
        profitMargin: body.profitMargin || 0,
        confidence: body.confidence || 0,
        riskLevel: body.riskLevel || 'medium',
        marketTrend: body.marketTrend || 'stable',
        recommendation: body.recommendation || 'hold',
      },
      create: {
        userId,
        title: body.title || '',
        artist: body.artist || '',
        source: body.source || '',
        sourceUrl: body.url || body.sourceUrl || '',
        imageUrl: body.imageUrl || '',
        description: body.description || '',
        category: body.category || '',
        price: body.price || 0,
        estimatedValue: body.estimatedValue || 0,
        profit: body.profit ?? (body.estimatedValue || 0) - (body.price || 0),
        profitMargin: body.profitMargin || 0,
        confidence: body.confidence || 0,
        riskLevel: body.riskLevel || 'medium',
        marketTrend: body.marketTrend || 'stable',
        recommendation: body.recommendation || 'hold',
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Portfolio POST error:', error)
    return NextResponse.json({ error: 'Kunde inte spara till portfölj' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID krävs' }, { status: 400 })
    }

    // Ownership check
    const item = await prisma.scannerPortfolioItem.findUnique({ where: { id } })
    if (!item || item.userId !== userId) {
      return NextResponse.json({ error: 'Inte hittat' }, { status: 404 })
    }

    await prisma.scannerPortfolioItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json({ error: 'Kunde inte ta bort' }, { status: 500 })
  }
}
