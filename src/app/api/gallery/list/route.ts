import { NextRequest, NextResponse } from 'next/server'
import { listGallery, likeGalleryItem } from '@/server/services/gallery/list'

const DEMO_GALLERY = [
  { id: 'g1', title: 'Nordisk Fjällvy', description: 'Lugna berg i pastelltoner', imageUrl: '/assets/demo/nordic-1.svg', mockupUrl: '/assets/demo/nordic-1.svg', style: 'nordic', likes: 47, createdAt: '2026-02-10T12:00:00Z' },
  { id: 'g2', title: 'Abstrakt Natt', description: 'Djupa färger och geometri', imageUrl: '/assets/demo/abstract-1.svg', mockupUrl: '/assets/demo/abstract-1.svg', style: 'abstract', likes: 83, createdAt: '2026-02-09T15:30:00Z' },
  { id: 'g3', title: 'Ren Linje', description: 'Minimalistisk komposition', imageUrl: '/assets/demo/minimal-1.svg', mockupUrl: '/assets/demo/minimal-1.svg', style: 'minimal', likes: 62, createdAt: '2026-02-11T09:00:00Z' },
  { id: 'g4', title: 'Botanisk Dröm', description: 'Blommor och blad i akvarell', imageUrl: '/assets/demo/botanical-1.svg', mockupUrl: '/assets/demo/botanical-1.svg', style: 'botanical', likes: 91, createdAt: '2026-02-08T18:00:00Z' },
  { id: 'g5', title: 'Retro Solnedgång', description: 'Synthwave-inspirerad', imageUrl: '/assets/demo/retro-1.svg', mockupUrl: '/assets/demo/retro-1.svg', style: 'retro', likes: 55, createdAt: '2026-02-10T20:00:00Z' },
  { id: 'g6', title: 'Skogens Tystnad', description: 'Nordisk skog i dimma', imageUrl: '/assets/demo/nordic-2.svg', mockupUrl: '/assets/demo/nordic-2.svg', style: 'nordic', likes: 38, createdAt: '2026-02-07T14:00:00Z' },
  { id: 'g7', title: 'Gyllene Cirklar', description: 'Abstrakt med guld och blått', imageUrl: '/assets/demo/abstract-2.svg', mockupUrl: '/assets/demo/abstract-2.svg', style: 'abstract', likes: 74, createdAt: '2026-02-06T11:00:00Z' },
  { id: 'g8', title: 'Balans', description: 'Geometrisk minimalism', imageUrl: '/assets/demo/minimal-2.svg', mockupUrl: '/assets/demo/minimal-2.svg', style: 'minimal', likes: 29, createdAt: '2026-02-11T16:00:00Z' },
  { id: 'g9', title: 'Eucalyptus', description: 'Gröna kvistar i skandinavisk stil', imageUrl: '/assets/demo/botanical-2.svg', mockupUrl: '/assets/demo/botanical-2.svg', style: 'botanical', likes: 66, createdAt: '2026-02-09T08:00:00Z' },
  { id: 'g10', title: 'Neon Triangel', description: 'Cyberpunk-inspirerad', imageUrl: '/assets/demo/retro-2.svg', mockupUrl: '/assets/demo/retro-2.svg', style: 'retro', likes: 42, createdAt: '2026-02-10T22:00:00Z' },
  { id: 'g11', title: 'Morgondimma', description: 'Nordiskt landskap i gryning', imageUrl: '/assets/demo/nordic-1.svg', mockupUrl: '/assets/demo/nordic-1.svg', style: 'nordic', likes: 58, createdAt: '2026-02-05T07:00:00Z' },
  { id: 'g12', title: 'Blomsterbukett', description: 'Vårblommor i mjuka toner', imageUrl: '/assets/demo/botanical-1.svg', mockupUrl: '/assets/demo/botanical-1.svg', style: 'botanical', likes: 103, createdAt: '2026-02-04T13:00:00Z' },
]

function getDemoGallery(style?: string, sortBy?: string) {
  let items = [...DEMO_GALLERY]
  if (style) items = items.filter(i => i.style === style)
  if (sortBy === 'popular') items.sort((a, b) => b.likes - a.likes)
  else items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const style = searchParams.get('style') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = (searchParams.get('sortBy') as 'recent' | 'popular') || 'recent'

    let result
    try {
      result = await listGallery({ style, limit, offset, sortBy })
    } catch {
      // DB not migrated — use demo data
      const items = getDemoGallery(style, sortBy)
      result = { items: items.slice(offset, offset + limit), total: items.length }
    }

    // If DB returned empty, fall back to demo
    if (!result.items || result.items.length === 0) {
      const items = getDemoGallery(style, sortBy)
      result = { items: items.slice(offset, offset + limit), total: items.length }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[gallery/list] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta galleri.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { galleryItemId } = body

    if (!galleryItemId) {
      return NextResponse.json(
        { error: 'galleryItemId krävs.' },
        { status: 400 }
      )
    }

    const item = await likeGalleryItem(galleryItemId)

    return NextResponse.json({
      success: true,
      likes: item.likes,
    })
  } catch (error) {
    console.error('[gallery/list POST] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte gilla.' },
      { status: 500 }
    )
  }
}
