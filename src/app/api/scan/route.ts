import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Mock data för demo - IRL skulle detta vara riktiga web scraping calls
const mockPaintings = [
  {
    title: "Landskap med solnedgång",
    artist: "Erik Johansson",
    price: 25000,
    estimatedValue: 45000,
    profitMargin: 80,
    source: "Bukowskis",
    imageUrl: "https://picsum.photos/seed/painting1/400/300",
    description: "Oljemålning på duk, 60x80cm"
  },
  {
    title: "Stilleben med frukter",
    artist: "Anna Nilsson",
    price: 18000,
    estimatedValue: 35000,
    profitMargin: 94,
    source: "Lauritz",
    imageUrl: "https://picsum.photos/seed/painting2/400/300",
    description: "Oljemålning på duk, 50x60cm"
  },
  {
    title: "Abstrakt komposition",
    artist: "Lars Persson",
    price: 32000,
    estimatedValue: 55000,
    profitMargin: 72,
    source: "Barnebys",
    imageUrl: "https://picsum.photos/seed/painting3/400/300",
    description: "Oljemålning på duk, 80x100cm"
  }
]

const mockSculptures = [
  {
    title: "Bronsfågel",
    artist: "Sven Lindberg",
    price: 45000,
    estimatedValue: 75000,
    profitMargin: 67,
    source: "Kunstkompaniet",
    imageUrl: "https://picsum.photos/seed/sculpture1/400/300",
    description: "Brons, 30cm hög"
  },
  {
    title: "Marmorskulptur",
    artist: "Maria Andersson",
    price: 85000,
    estimatedValue: 120000,
    profitMargin: 41,
    source: "Uppsala Auktionskammare",
    imageUrl: "https://picsum.photos/seed/sculpture2/400/300",
    description: "Marmor, 45cm hög"
  }
]

// Mock web scraping funktioner
async function scrapeBukowskis(type: string) {
  // IRL: Hämta data från bukowskis.com
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulera nätverksfördröjning
  return type === 'paintings' ? mockPaintings.slice(0, 2) : []
}

async function scrapeLauritz(type: string) {
  // IRL: Hämta data från lauritz.com
  await new Promise(resolve => setTimeout(resolve, 1200))
  return type === 'paintings' ? [mockPaintings[1]] : []
}

async function scrapeBarnebys(type: string) {
  // IRL: Hämta data från barnebys.com
  await new Promise(resolve => setTimeout(resolve, 800))
  return type === 'paintings' ? [mockPaintings[2]] : mockSculptures.slice(0, 1)
}

async function scrapeKunstkompaniet(type: string) {
  // IRL: Hämta data från kunstkompaniet.no
  await new Promise(resolve => setTimeout(resolve, 1500))
  return type === 'sculptures' ? [mockSculptures[0]] : []
}

async function scrapeUppsalaAuktionskammare(type: string) {
  // IRL: Hämta data från uppsalaauktion.se
  await new Promise(resolve => setTimeout(resolve, 1000))
  return type === 'sculptures' ? [mockSculptures[1]] : []
}

// AI-pris-analys (mock)
function analyzePricePotential(item: any) {
  // IRL: Använd AI för att analysera marknadsdata
  const baseMargin = Math.random() * 30 + 40 // 40-70% bas marginal
  const artistMultiplier = Math.random() * 20 + 0.8 // 0.8-1.0 multiplier
  const conditionMultiplier = Math.random() * 15 + 0.9 // 0.9-1.05 multiplier
  
  const adjustedMargin = baseMargin * artistMultiplier * conditionMultiplier
  return Math.round(adjustedMargin)
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    if (!type || !['paintings', 'sculptures'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid scan type' },
        { status: 400 }
      )
    }

    // Starta skanning av alla källor parallellt
    const scrapingPromises = [
      scrapeBukowskis(type),
      scrapeLauritz(type),
      scrapeBarnebys(type),
      scrapeKunstkompaniet(type),
      scrapeUppsalaAuktionskammare(type)
    ]

    const results = await Promise.all(scrapingPromises)
    const allItems = results.flat()

    // Analysera varje objekt
    const analyzedItems = allItems.map(item => ({
      ...item,
      profitMargin: analyzePricePotential(item)
    }))

    // Sortera efter vinstpotential (högst först)
    analyzedItems.sort((a, b) => b.profitMargin - a.profitMargin)

    return NextResponse.json({
      success: true,
      results: analyzedItems,
      totalFound: analyzedItems.length,
      scanType: type,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Scanning error:', error)
    return NextResponse.json(
      { error: 'Failed to scan art markets' },
      { status: 500 }
    )
  }
}
