import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Default pricing — seeded on first GET if no config exists
const DEFAULT_SIZES = [
  { id: 'a5', label: 'A5 (15×21 cm)', widthCm: 14.8, heightCm: 21.0, baseSEK: 99, costSEK: 0 },
  { id: 'a4', label: 'A4 (21×30 cm)', widthCm: 21.0, heightCm: 29.7, baseSEK: 149, costSEK: 0 },
  { id: 'a3', label: 'A3 (30×42 cm)', widthCm: 29.7, heightCm: 42.0, baseSEK: 249, costSEK: 0 },
  { id: '30x40', label: '30×40 cm', widthCm: 30.0, heightCm: 40.0, baseSEK: 249, costSEK: 0 },
  { id: '40x50', label: '40×50 cm', widthCm: 40.0, heightCm: 50.0, baseSEK: 349, costSEK: 0 },
  { id: '50x70', label: '50×70 cm', widthCm: 50.0, heightCm: 70.0, baseSEK: 449, costSEK: 0 },
  { id: '61x91', label: '61×91 cm', widthCm: 61.0, heightCm: 91.0, baseSEK: 599, costSEK: 0 },
  { id: '70x100', label: '70×100 cm', widthCm: 70.0, heightCm: 100.0, baseSEK: 749, costSEK: 0 },
]

const DEFAULT_FRAMES = [
  { id: 'none', label: 'Ingen ram', color: 'transparent', width: 0, costSEK: 0, priceSEK: 0 },
  { id: 'black', label: 'Svart', color: '#1a1a1a', width: 20, costSEK: 0, priceSEK: 0 },
  { id: 'white', label: 'Vit', color: '#f5f5f5', width: 20, costSEK: 0, priceSEK: 0 },
  { id: 'oak', label: 'Ek', color: '#C4A265', width: 25, costSEK: 0, priceSEK: 0 },
  { id: 'walnut', label: 'Valnöt', color: '#5C4033', width: 25, costSEK: 0, priceSEK: 0 },
  { id: 'gold', label: 'Guld', color: '#D4AF37', width: 30, costSEK: 0, priceSEK: 0 },
]

const DEFAULT_PAPERS = [
  { id: 'DEFAULT', label: 'Standard', costSEK: 0, priceSEK: 0 },
  { id: 'MATTE', label: 'Matt', costSEK: 0, priceSEK: 0 },
  { id: 'SEMI_GLOSS', label: 'Semi-gloss', costSEK: 0, priceSEK: 0 },
  { id: 'FINE_ART', label: 'Fine Art', costSEK: 0, priceSEK: 0 },
]

async function getOrCreateConfig() {
  let config = await prisma.pricingConfig.findUnique({ where: { id: 'current' } })

  if (!config) {
    config = await prisma.pricingConfig.create({
      data: {
        id: 'current',
        sizes: DEFAULT_SIZES,
        frames: DEFAULT_FRAMES,
        papers: DEFAULT_PAPERS,
        shippingSEK: 99,
        marketShippingSEK: 79,
        vatRate: 0.25,
      },
    })
    console.log('[admin/pricing] Default PricingConfig created')
  }

  return config
}

export async function GET() {
  try {
    const config = await getOrCreateConfig()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('[admin/pricing GET] Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta priskonfiguration' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { sizes, frames, papers, shippingSEK, marketShippingSEK, vatRate } = body

    const data: Record<string, unknown> = {}
    if (sizes !== undefined) data.sizes = sizes
    if (frames !== undefined) data.frames = frames
    if (papers !== undefined) data.papers = papers
    if (shippingSEK !== undefined) data.shippingSEK = shippingSEK
    if (marketShippingSEK !== undefined) data.marketShippingSEK = marketShippingSEK
    if (vatRate !== undefined) data.vatRate = vatRate

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Inga fält att uppdatera' }, { status: 400 })
    }

    // Ensure config exists
    await getOrCreateConfig()

    const config = await prisma.pricingConfig.update({
      where: { id: 'current' },
      data,
    })

    console.log('[admin/pricing] Config updated:', Object.keys(data).join(', '))
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('[admin/pricing PATCH] Error:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera priskonfiguration' }, { status: 500 })
  }
}
