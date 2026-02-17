/**
 * AI Retry + Fallback utility.
 *
 * Wraps any AI call with:
 *   1. Exponential backoff retry (transient errors only)
 *   2. Optional cross-provider fallback
 *   3. Fire-and-forget admin email alert on fallback or failure
 */

import { sendAIAdminAlert } from '@/server/services/email/adminAlert'

// ─── Types ───────────────────────────────────────────────────

export interface AIRetryOptions<T> {
  /** Human-readable label for logs, e.g. "generatePreview variant 2" */
  label: string
  /** The primary AI call */
  primary: () => Promise<T>
  /** Optional fallback provider call (different API) */
  fallback?: () => Promise<T>
  /** Max retries for primary (default 3) */
  maxRetries?: number
  /** Max retries for fallback (default 2) */
  fallbackRetries?: number
  /** Base delay in ms (default 1000). Actual: baseDelay * 2^(attempt-1) */
  baseDelayMs?: number
  /** If true, don't send admin alerts (useful for batch calls where parent handles alerting) */
  suppressAlert?: boolean
}

export interface AIRetryResult<T> {
  data: T
  /** Which provider served the response */
  provider: 'primary' | 'fallback'
  /** Total attempts (primary + fallback) */
  totalAttempts: number
  /** The primary error, if fallback was used */
  primaryError?: Error
}

// ─── Helpers ─────────────────────────────────────────────────

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return true
  const msg = err.message.toLowerCase()
  const status = (err as any)?.status || (err as any)?.response?.status

  // Permanent — don't retry
  if (status === 400) return false
  if (status === 401) return false
  if (status === 403) return false
  if (msg.includes('safety') || msg.includes('content_policy')) return false
  if (msg.includes('billing') || msg.includes('quota exceeded')) return false
  if (msg.includes('invalid_api_key')) return false

  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Main ────────────────────────────────────────────────────

export async function withAIRetry<T>(opts: AIRetryOptions<T>): Promise<AIRetryResult<T>> {
  const {
    label,
    primary,
    fallback,
    maxRetries = 3,
    fallbackRetries = 2,
    baseDelayMs = 1000,
    suppressAlert = false,
  } = opts

  let lastPrimaryError: Error | undefined

  // ── Try primary ──
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await primary()
      return { data, provider: 'primary', totalAttempts: attempt }
    } catch (err: any) {
      lastPrimaryError = err instanceof Error ? err : new Error(String(err))
      const transient = isTransientError(err)

      console.warn(
        `[withAIRetry] ${label} primary attempt ${attempt}/${maxRetries} failed ` +
        `(${transient ? 'transient' : 'permanent'}): ${lastPrimaryError.message}`
      )

      if (!transient) break
      if (attempt < maxRetries) {
        await sleep(baseDelayMs * Math.pow(2, attempt - 1))
      }
    }
  }

  // ── Try fallback ──
  if (fallback) {
    console.warn(`[withAIRetry] ${label} primary exhausted, switching to fallback provider`)

    for (let attempt = 1; attempt <= fallbackRetries; attempt++) {
      try {
        const data = await fallback()

        if (!suppressAlert) {
          sendAIAdminAlert({
            type: 'fallback_triggered',
            service: label,
            error: lastPrimaryError?.message || 'Unknown primary error',
            timestamp: new Date().toISOString(),
          }).catch(() => {})
        }

        return {
          data,
          provider: 'fallback',
          totalAttempts: maxRetries + attempt,
          primaryError: lastPrimaryError,
        }
      } catch (err: any) {
        console.warn(
          `[withAIRetry] ${label} fallback attempt ${attempt}/${fallbackRetries} failed: ` +
          `${err?.message || err}`
        )
        if (attempt < fallbackRetries) {
          await sleep(baseDelayMs * Math.pow(2, attempt - 1))
        }
      }
    }
  }

  // ── Complete failure ──
  if (!suppressAlert) {
    sendAIAdminAlert({
      type: 'complete_failure',
      service: label,
      error: lastPrimaryError?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }).catch(() => {})
  }

  throw lastPrimaryError || new Error(`[withAIRetry] ${label} failed after all attempts`)
}
