import { NextRequest, NextResponse } from 'next/server'
import { BorisWallcraftExpert } from '@/lib/boris/wallcraftExpert'
import { rateLimit, getClientIP } from '@/lib/boris/rateLimit'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { type Locale, SUPPORTED_LOCALES } from '@/lib/i18n'

export const maxDuration = 30

const RATE_LIMIT_MSG: Record<string, string> = {
  sv: 'För många förfrågningar. Vänta en stund.',
  en: 'Too many requests. Please wait a moment.',
  de: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
}

const ERROR_MSG: Record<string, string> = {
  sv: 'Boris kunde inte svara just nu.',
  en: 'Boris could not respond right now.',
  de: 'Boris konnte gerade nicht antworten.',
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (adminCheck instanceof NextResponse) return adminCheck

    const body = await request.json()
    const { action, message, context, locale: rawLocale } = body as {
      action: 'style' | 'variant' | 'editor' | 'print' | 'chat'
      message: string
      context?: Record<string, any>
      locale?: string
    }

    const locale: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(rawLocale || '') ? rawLocale as Locale : 'en'

    // Rate limit: 20 requests per minute per IP
    const ip = getClientIP(request)
    const limit = rateLimit(`boris-wallcraft:${ip}`, 20, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MSG[locale] || RATE_LIMIT_MSG['en'] },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(limit.resetInMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
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
        response = await boris.getStyleAdvice(message, context, locale)
        break
      case 'variant':
        response = await boris.getVariantAdvice(message, context?.style, context?.roomType, locale)
        break
      case 'editor':
        response = await boris.getEditorAdvice(message, context, locale)
        break
      case 'print':
        response = await boris.getPrintAdvice(message, context, locale)
        break
      case 'chat':
      default:
        response = await boris.chat(message, locale)
        break
    }

    return NextResponse.json({ success: true, response })
  } catch (error) {
    console.error('[boris/wallcraft] Error:', error)
    return NextResponse.json(
      { error: ERROR_MSG['en'] },
      { status: 500 }
    )
  }
}
