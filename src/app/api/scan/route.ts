import { NextRequest, NextResponse } from 'next/server'
import { ArtScraper } from '@/lib/scrapers'
import { PriceAnalyzer } from '@/lib/priceAnalyzer'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    if (!type || !['paintings', 'sculptures'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid scan type' },
        { status: 400 }
      )
    }

    console.log(`Starting real art scan for ${type}...`)
    
    // Hämta riktig data från web scraping
    const scrapedItems = await ArtScraper.scrapeAll(type)
    
    if (scrapedItems.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalFound: 0,
        scanType: type,
        timestamp: new Date().toISOString(),
        message: 'Inga objekt hittades i denna sökning. Försök igen senare.'
      })
    }

    // Analysera varje objekt med riktig AI-analys
    const analyzedItems = scrapedItems.map(item => {
      const analysis = PriceAnalyzer.analyzeItem(item)
      return {
        ...item,
        ...analysis
      }
    })

    // Sortera efter vinstpotential (högst först)
    analyzedItems.sort((a, b) => b.profitMargin - a.profitMargin)

    // Filtrera bort objekt med negativ vinstpotential
    const profitableItems = analyzedItems.filter(item => item.profitMargin > 0)

    console.log(`Scan complete: ${profitableItems.length} profitable items found`)

    return NextResponse.json({
      success: true,
      results: profitableItems,
      totalFound: profitableItems.length,
      scanType: type,
      timestamp: new Date().toISOString(),
      sources: ['Bukowskis', 'Lauritz', 'Barnebys'],
      analysisType: 'real'
    })

  } catch (error) {
    console.error('Scanning error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to scan art markets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
