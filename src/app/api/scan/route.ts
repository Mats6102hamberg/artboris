import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, AVAILABLE_SOURCES } from '@/lib/scrapers'
import { valuateItems, ValuatedItem } from '@/lib/aiValuation'

interface ScanFilters {
  minPrice: number
  maxPrice: number
  minProfit: number
  minProfitMargin: number
  maxProfitMargin: number
  riskLevel: 'all' | 'low' | 'medium' | 'high'
  recommendation: 'all' | 'buy' | 'hold' | 'avoid'
}

function applyFilters(items: ValuatedItem[], filters: ScanFilters): ValuatedItem[] {
  return items.filter(item => {
    if (item.price < filters.minPrice || item.price > filters.maxPrice) return false
    if (item.profit < filters.minProfit) return false
    if (item.profitMargin < filters.minProfitMargin) return false
    if (item.profitMargin > filters.maxProfitMargin) return false
    if (filters.riskLevel !== 'all' && item.riskLevel !== filters.riskLevel) return false
    if (filters.recommendation !== 'all' && item.recommendation !== filters.recommendation) return false
    return true
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const type = body.type || 'paintings'
    const sources: string[] = body.sources || AVAILABLE_SOURCES
    const sortBy: string = body.sortBy || 'profit'
    const filters: ScanFilters = {
      minPrice: body.filters?.minPrice ?? 0,
      maxPrice: body.filters?.maxPrice ?? 10000000,
      minProfit: body.filters?.minProfit ?? 0,
      minProfitMargin: body.filters?.minProfitMargin ?? 0,
      maxProfitMargin: body.filters?.maxProfitMargin ?? 1000,
      riskLevel: body.filters?.riskLevel ?? 'all',
      recommendation: body.filters?.recommendation ?? 'all',
    }

    if (!['paintings', 'sculptures'].includes(type)) {
      return NextResponse.json({ error: 'Invalid scan type' }, { status: 400 })
    }

    // 1. Scrape selected sources
    const { items: scrapedItems, sourceResults } = await scrapeAll(sources, type)

    // 2. AI-valuate all items
    const valuatedItems = await valuateItems(scrapedItems)

    // 3. Apply filters
    const filtered = applyFilters(valuatedItems, filters)

    // 4. Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'profit': return b.profit - a.profit
        case 'profitMargin': return b.profitMargin - a.profitMargin
        case 'price': return a.price - b.price
        case 'priceDesc': return b.price - a.price
        case 'confidence': return b.confidence - a.confidence
        default: return b.profit - a.profit
      }
    })

    return NextResponse.json({
      success: true,
      results: sorted,
      totalFound: valuatedItems.length,
      totalFiltered: sorted.length,
      scanType: type,
      timestamp: new Date().toISOString(),
      sources: Object.keys(sourceResults),
      sourceResults,
      hasAIValuation: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-mock-key',
    })

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      {
        error: 'Scan failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
