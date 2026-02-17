/**
 * CrashCatcher client — reports errors to an external CrashCatcher instance.
 *
 * Fire-and-forget: never throws, never blocks.
 * If CRASHCATCHER_API_URL is not set, errors are only logged.
 * Debounce: max 1 identical error per minute to prevent flood.
 */

// ── Debounce ──
const recentErrors = new Map<string, number>()
const DEBOUNCE_MS = 60 * 1000

function shouldReport(key: string): boolean {
  const now = Date.now()
  const last = recentErrors.get(key) || 0
  if (now - last < DEBOUNCE_MS) return false
  recentErrors.set(key, now)
  return true
}

export interface CrashCatcherIncident {
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  incident_type: string
  target_system?: string
}

export async function reportError(incident: CrashCatcherIncident): Promise<void> {
  const apiUrl = process.env.CRASHCATCHER_API_URL
  if (!apiUrl) {
    console.warn(`[crashcatcher] CRASHCATCHER_API_URL not set — logging only: ${incident.title}`)
    return
  }

  const debounceKey = `${incident.incident_type}:${incident.title.slice(0, 80)}`
  if (!shouldReport(debounceKey)) return

  try {
    const res = await fetch(`${apiUrl}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CRASHCATCHER_API_KEY || '',
      },
      body: JSON.stringify({
        ...incident,
        target_system: incident.target_system || 'artboris',
        detected_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.error(`[crashcatcher] POST failed: ${res.status} ${res.statusText}`)
    }
  } catch (err) {
    console.error('[crashcatcher] Failed to report error:', err instanceof Error ? err.message : err)
  }
}

export interface ErrorContext {
  userId?: string
  orderId?: string
  designId?: string
  [key: string]: string | undefined
}

/**
 * Convenience: report an Error object from an API route.
 * Reports to both Sentry and CrashCatcher.
 *
 * Pass context to attach user.id, orderId, designId etc. to the Sentry event.
 */
export function reportApiError(
  route: string,
  error: unknown,
  severity: CrashCatcherIncident['severity'] = 'HIGH',
  context?: ErrorContext,
): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  // Sentry (primary)
  import('@sentry/nextjs').then(Sentry => {
    if (context?.userId) {
      Sentry.setUser({ id: context.userId })
    }
    Sentry.captureException(error, {
      tags: { route, ...context },
      extra: { severity },
    })
  }).catch(() => {})

  // CrashCatcher (optional, if configured)
  reportError({
    title: `API error: ${route}`,
    description: stack || message,
    severity,
    incident_type: 'application_error',
  }).catch(() => {})
}
