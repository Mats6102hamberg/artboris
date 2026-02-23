import { NextRequest, NextResponse } from 'next/server'
import { BorisArtAI } from '@/lib/borisArtAI'
import { rateLimit, getClientIP } from '@/lib/boris/rateLimit'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck instanceof NextResponse) return adminCheck

    // Rate limit: 20 requests per minute per IP
    const ip = getClientIP(request)
    const limit = rateLimit(`boris-ai:${ip}`, 20, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'För många förfrågningar. Vänta en stund.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(limit.resetInMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const { action, data } = await request.json()
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const borisAI = BorisArtAI.getInstance()
    let response

    switch (action) {
      case 'generate-story':
        if (!data?.artwork) {
          return NextResponse.json(
            { error: 'Artwork data is required for story generation' },
            { status: 400 }
          )
        }
        response = await borisAI.generateArtStory(data.artwork)
        break

      case 'analyze-artworks':
        if (!data?.artworks) {
          return NextResponse.json(
            { error: 'Artworks data is required for analysis' },
            { status: 400 }
          )
        }
        response = await borisAI.analyzeArtworks(data.artworks)
        break

      case 'get-trends':
        response = await borisAI.getCurrentTrends()
        break

      case 'get-opinion':
        if (!data?.topic) {
          return NextResponse.json(
            { error: 'Topic is required for opinion' },
            { status: 400 }
          )
        }
        response = await borisAI.getArtOpinion(data.topic)
        break

      case 'analyze-my-artwork':
        if (!data?.artwork) {
          return NextResponse.json(
            { error: 'Artwork data is required for analysis' },
            { status: 400 }
          )
        }
        response = await borisAI.analyzeMyArtwork(data.artwork)
        break

      case 'chat':
        if (!data?.message) {
          return NextResponse.json(
            { error: 'Message is required for chat' },
            { status: 400 }
          )
        }
        response = await borisAI.chatWithBoris(data.message, {
          scannedItems: data.scannedItems,
          portfolio: data.portfolio,
          selectedArtwork: data.selectedArtwork
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      response
    })

  } catch (error) {
    console.error('BorisArt AI error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process BorisArt AI request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
