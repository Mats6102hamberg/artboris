/**
 * API route error wrapper — centralized error reporting for critical routes.
 *
 * Wraps a Next.js route handler and reports unhandled errors to
 * CrashCatcher + admin email alert.
 */

import { NextResponse } from 'next/server'
import { reportApiError } from '@/lib/crashcatcher'
import { sendErrorAdminAlert } from '@/server/services/email/adminAlert'

type RouteHandler = (req: Request, ctx?: any) => Promise<Response>

export function withErrorReporting(routeName: string, handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: any) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      console.error(`[${routeName}] Unhandled error:`, error)

      // Report to CrashCatcher (fire-and-forget)
      reportApiError(routeName, error, 'CRITICAL')

      // Send admin email alert (fire-and-forget)
      sendErrorAdminAlert({
        route: routeName,
        error: error instanceof Error ? error.message : String(error),
        statusCode: 500,
        timestamp: new Date().toISOString(),
      }).catch(() => {})

      return NextResponse.json(
        { error: 'Ett oväntat serverfel inträffade.' },
        { status: 500 }
      )
    }
  }
}
