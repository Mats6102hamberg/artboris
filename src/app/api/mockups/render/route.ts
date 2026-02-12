import { NextRequest, NextResponse } from 'next/server'
import { composeMockupCSS } from '@/server/services/mockup/composeMockup'
import { MockupConfig } from '@/types/design'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomImageUrl, designImageUrl, config } = body as {
      roomImageUrl: string
      designImageUrl: string
      config: MockupConfig
    }

    if (!roomImageUrl || !designImageUrl) {
      return NextResponse.json(
        { error: 'Rum- och designbild krävs.' },
        { status: 400 }
      )
    }

    const result = composeMockupCSS({
      roomImageUrl,
      designImageUrl,
      config,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Mockup-rendering misslyckades.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cssOverlay: result.cssOverlay,
    })
  } catch (error) {
    console.error('[mockups/render] Error:', error)
    return NextResponse.json(
      { error: 'Mockup-rendering misslyckades.' },
      { status: 500 }
    )
  }
}
