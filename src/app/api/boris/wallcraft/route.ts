import { NextRequest, NextResponse } from 'next/server'
import { BorisWallcraftExpert } from '@/lib/boris/wallcraftExpert'
import { rateLimit, getClientIP } from '@/lib/boris/rateLimit'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck instanceof NextResponse) return adminCheck

    // Rate limit: 20 requests per minute per IP
    const ip = getClientIP(request)
    const limit = rateLimit(`boris-wallcraft:${ip}`, 20, 60_000)
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
