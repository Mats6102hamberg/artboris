import { NextRequest, NextResponse } from 'next/server'
import { BorisArtAI } from '@/lib/borisArtAI'

export async function POST(request: NextRequest) {
  try {
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
