/**
 * Simple in-memory rate limiter for Boris API routes.
 *
 * Limits requests per IP to prevent abuse of the AI endpoints.
 * Uses a sliding window approach — no external dependencies.
 *
 * In production with multiple serverless instances this is per-instance,
 * which is fine: it still blocks rapid-fire abuse from a single client
 * hitting the same instance, and Vercel's edge already rate-limits at infra level.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInMs: number
}

/**
 * Check and consume a rate limit token for the given key (usually IP).
 *
 * @param key       — unique identifier (IP address, user ID, etc.)
 * @param maxHits   — max requests allowed in the window (default: 20)
 * @param windowMs  — sliding window duration in ms (default: 60_000 = 1 min)
 */
export function rateLimit(
  key: string,
  maxHits: number = 20,
  windowMs: number = 60_000,
): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff)

  if (entry.timestamps.length >= maxHits) {
    const oldestInWindow = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldestInWindow + windowMs - now,
    }
  }

  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: maxHits - entry.timestamps.length,
    resetInMs: windowMs,
  }
}

/**
 * Extract a stable client identifier from a Next.js request.
 * Uses x-forwarded-for (Vercel sets this), falls back to x-real-ip, then 'unknown'.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}
