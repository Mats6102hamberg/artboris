import { NextRequest, NextResponse } from 'next/server'
import { BorisWallcraftExpert } from '@/lib/boris/wallcraftExpert'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, message, context } = body as {
      action: 'style' | 'variant' | 'editor' | 'print' | 'chat'
      message: string
      context?: Record<string, any>
    }

    if (!action || !message) {
      return NextResponse.json(
        { error: 'action and message are required' },
        { status: 400 }
      )
    }

    const boris = BorisWallcraftExpert.getInstance()
    let response

    switch (action) {
      case 'style':
        response = await boris.getStyleAdvice(message, context)
        break
      case 'variant':
        response = await boris.getVariantAdvice(message, context?.style, context?.roomType)
        break
      case 'editor':
        response = await boris.getEditorAdvice(message, context)
        break
      case 'print':
        response = await boris.getPrintAdvice(message, context)
        break
      case 'chat':
      default:
        response = await boris.chat(message)
        break
    }

    return NextResponse.json({ success: true, response })
  } catch (error) {
    console.error('[boris/wallcraft] Error:', error)
    return NextResponse.json(
      { error: 'Boris kunde inte svara just nu.' },
      { status: 500 }
    )
  }
}
