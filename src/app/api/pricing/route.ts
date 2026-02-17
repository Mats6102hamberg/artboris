import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SizeConfig { id: string; label: string; widthCm: number; heightCm: number; baseSEK: number; costSEK?: number }
interface FrameConfig { id: string; label: string; color: string; width: number; costSEK?: number; priceSEK: number }
interface PaperConfig { id: string; label: string; costSEK?: number; priceSEK: number }

// Public pricing endpoint — strips costSEK (internal) before returning
export async function GET() {
  try {
    const config = await prisma.pricingConfig.findUnique({ where: { id: 'current' } })

    if (!config) {
      return NextResponse.json({ error: 'Priskonfiguration saknas' }, { status: 404 })
    }

    const sizes = (config.sizes as unknown as SizeConfig[]).map(({ costSEK, ...rest }) => rest)
    const frames = (config.frames as unknown as FrameConfig[]).map(({ costSEK, ...rest }) => rest)
    const papers = (config.papers as unknown as PaperConfig[]).map(({ costSEK, ...rest }) => rest)

    return NextResponse.json(
      {
        sizes,
        frames,
        papers,
        shippingSEK: config.shippingSEK,
        vatRate: config.vatRate,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      }
    )
  } catch (error) {
    console.error('[pricing GET] Error:', error)
    return NextResponse.json({ error: 'Kunde inte hämta priser' }, { status: 500 })
  }
}
