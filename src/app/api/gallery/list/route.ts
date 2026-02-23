import { NextRequest, NextResponse } from 'next/server'
import { listGallery } from '@/server/services/gallery/list'

const DEMO_GALLERY = [
  { id: 'g1', designId: 'gd1', title: 'Nordic Mountain View', description: 'Calm mountains in pastel tones', imageUrl: '/assets/demo/nordic-1.svg', style: 'nordic', likesCount: 47, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-10T12:00:00Z' },
  { id: 'g2', designId: 'gd2', title: 'Abstract Night', description: 'Deep colors and geometry', imageUrl: '/assets/demo/abstract-1.svg', style: 'abstract', likesCount: 83, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-09T15:30:00Z' },
  { id: 'g3', designId: 'gd3', title: 'Clean Line', description: 'Minimalist composition', imageUrl: '/assets/demo/minimal-1.svg', style: 'minimal', likesCount: 62, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-11T09:00:00Z' },
  { id: 'g4', designId: 'gd4', title: 'Botanical Dream', description: 'Flowers and leaves in watercolor', imageUrl: '/assets/demo/botanical-1.svg', style: 'botanical', likesCount: 91, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-08T18:00:00Z' },
  { id: 'g5', designId: 'gd5', title: 'Retro Sunset', description: 'Synthwave-inspired', imageUrl: '/assets/demo/retro-1.svg', style: 'retro', likesCount: 55, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-10T20:00:00Z' },
  { id: 'g6', designId: 'gd6', title: 'Forest Silence', description: 'Nordic forest in mist', imageUrl: '/assets/demo/nordic-2.svg', style: 'nordic', likesCount: 38, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-07T14:00:00Z' },
  { id: 'g7', designId: 'gd7', title: 'Golden Circles', description: 'Abstract with gold and blue', imageUrl: '/assets/demo/abstract-2.svg', style: 'abstract', likesCount: 74, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-06T11:00:00Z' },
  { id: 'g8', designId: 'gd8', title: 'Balance', description: 'Geometric minimalism', imageUrl: '/assets/demo/minimal-2.svg', style: 'minimal', likesCount: 29, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-11T16:00:00Z' },
  { id: 'g9', designId: 'gd9', title: 'Eucalyptus', description: 'Green branches in Scandinavian style', imageUrl: '/assets/demo/botanical-2.svg', style: 'botanical', likesCount: 66, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-09T08:00:00Z' },
  { id: 'g10', designId: 'gd10', title: 'Neon Triangle', description: 'Cyberpunk-inspired', imageUrl: '/assets/demo/retro-2.svg', style: 'retro', likesCount: 42, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-10T22:00:00Z' },
  { id: 'g11', designId: 'gd11', title: 'Morning Mist', description: 'Nordic landscape at dawn', imageUrl: '/assets/demo/nordic-1.svg', style: 'nordic', likesCount: 58, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-05T07:00:00Z' },
  { id: 'g12', designId: 'gd12', title: 'Flower Bouquet', description: 'Spring flowers in soft tones', imageUrl: '/assets/demo/botanical-1.svg', style: 'botanical', likesCount: 103, isAiGenerated: true, type: 'ai-variant', createdAt: '2026-02-04T13:00:00Z' },
]

function getDemoGallery(style?: string, sortBy?: string, aiOnly?: boolean) {
  let items = [...DEMO_GALLERY]
  if (style) items = items.filter(i => i.style === style)
  if (aiOnly) items = items.filter(i => i.isAiGenerated)
  if (sortBy === 'popular') items.sort((a, b) => b.likesCount - a.likesCount)
  else items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const style = searchParams.get('style') || undefined
    const limit = parseInt(searchParams.get('limit') || '60')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = (searchParams.get('sortBy') as 'recent' | 'popular') || 'recent'
    const aiOnly = searchParams.get('aiOnly') === 'true'

    let result
    try {
      result = await listGallery({ style, limit, offset, sortBy, aiOnly })
    } catch {
      // DB not migrated — use demo data
      const items = getDemoGallery(style, sortBy, aiOnly)
      result = { items: items.slice(offset, offset + limit), total: items.length }
    }

    // If DB returned empty, fall back to demo
    if (!result.items || result.items.length === 0) {
      const items = getDemoGallery(style, sortBy, aiOnly)
      result = { items: items.slice(offset, offset + limit), total: items.length }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[gallery/list] Error:', error)
    return NextResponse.json(
      { error: 'Could not load gallery.' },
      { status: 500 }
    )
  }
}
