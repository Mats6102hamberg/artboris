import { NextRequest, NextResponse } from 'next/server'

// Mock implementation för att undvika Puppeteer build issues
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    if (!type || !['paintings', 'sculptures'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid scan type' },
        { status: 400 }
      )
    }

    console.log(`🚀 Starting MOCK art scan for ${type} (Puppeteer disabled for build)...`)
    
    // Simulera scraping med mock data
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockItems = [
      {
        title: "Abstrakt komposition",
        artist: "Erik Johansson",
        price: 25000,
        estimatedValue: 45000,
        profitMargin: 80,
        source: "Bukowskis (Mock)",
        imageUrl: "https://picsum.photos/seed/mock-bukowskis/400/300",
        description: "Oljemålning på duk, 60x80cm",
        riskLevel: "medium" as const,
        confidence: 0.75,
        marketTrend: "rising" as const,
        recommendation: "buy" as const
      },
      {
        title: "Landskap med solnedgång",
        artist: "Anna Nilsson",
        price: 18000,
        estimatedValue: 35000,
        profitMargin: 94,
        source: "Lauritz (Mock)",
        imageUrl: "https://picsum.photos/seed/mock-lauritz/400/300",
        description: "Akrylmålning, 50x70cm",
        riskLevel: "low" as const,
        confidence: 0.85,
        marketTrend: "rising" as const,
        recommendation: "buy" as const
      },
      {
        title: "Modernistisk verk",
        artist: "Lars Persson",
        price: 32000,
        estimatedValue: 55000,
        profitMargin: 72,
        source: "Barnebys (Mock)",
        imageUrl: "https://picsum.photos/seed/mock-barnebys/400/300",
        description: "Brons, 35cm hög",
        riskLevel: "medium" as const,
        confidence: 0.70,
        marketTrend: "stable" as const,
        recommendation: "hold" as const
      },
      {
        title: "Stilleben med frukter",
        artist: "Maria Lindberg",
        price: 12000,
        estimatedValue: 28000,
        profitMargin: 133,
        source: "Bukowskis (Mock)",
        imageUrl: "https://picsum.photos/seed/mock-lowprice/400/300",
        description: "Akvarell, 40x50cm",
        riskLevel: "high" as const,
        confidence: 0.65,
        marketTrend: "rising" as const,
        recommendation: "buy" as const
      },
      {
        title: "Porträtt av herre",
        artist: "Sven Eriksson",
        price: 85000,
        estimatedValue: 95000,
        profitMargin: 12,
        source: "Barnebys (Mock)",
        imageUrl: "https://picsum.photos/seed/mock-highprice/400/300",
        description: "Oljemålning på duk, 70x90cm",
        riskLevel: "low" as const,
        confidence: 0.90,
        marketTrend: "stable" as const,
        recommendation: "hold" as const
      }
    ]

    console.log(`✅ Generated ${mockItems.length} mock items`)

    return NextResponse.json({
      success: true,
      results: mockItems,
      totalFound: mockItems.length,
      scanType: type,
      timestamp: new Date().toISOString(),
      sources: ['Bukowskis (Mock)', 'Lauritz (Mock)', 'Barnebys (Mock)'],
      analysisType: 'mock-puppeteer',
      scrapingMethod: 'mock-build-safe',
      dataQuality: 'mock-data',
      note: 'Puppeteer är inaktiverat för build. Använder mock data.'
    })

  } catch (error) {
    console.error('❌ Mock scraping error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate mock data',
        details: error instanceof Error ? error.message : 'Unknown error',
        scrapingMethod: 'mock-failed'
      },
      { status: 500 }
    )
  }
}
