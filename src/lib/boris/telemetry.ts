'use client'

// ─── Boris M — Telemetry Client ─────────────────────────
// Lightweight event tracker for funnel analysis + UX monitoring.
// Events are batched and sent in the background.

const BATCH_INTERVAL_MS = 3000
const MAX_BATCH_SIZE = 20

interface TelemetryPayload {
  event: string
  path: string
  metadata?: Record<string, unknown>
}

interface QueuedEvent extends TelemetryPayload {
  sessionId: string
  userId: string | null
  device: string
  locale: string | null
  timestamp: string
}

// ─── Funnel Events ──────────────────────────────────────
export const FUNNEL_EVENTS = {
  VIEW_PRODUCT: 'VIEW_PRODUCT',
  CLICK_TRY_ON_WALL: 'CLICK_TRY_ON_WALL',
  UPLOAD_ROOM: 'UPLOAD_ROOM',
  MARK_WALL: 'MARK_WALL',
  SELECT_STYLE: 'SELECT_STYLE',
  GENERATE_ART: 'GENERATE_ART',
  SELECT_VARIANT: 'SELECT_VARIANT',
  SELECT_SIZE: 'SELECT_SIZE',
  SELECT_FRAME: 'SELECT_FRAME',
  ADD_TO_CART: 'ADD_TO_CART',
  START_CHECKOUT: 'START_CHECKOUT',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAIL: 'PAYMENT_FAIL',
} as const

export const UX_EVENTS = {
  UI_ERROR_SHOWN: 'UI_ERROR_SHOWN',
  API_ERROR: 'API_ERROR',
  SLOW_ACTION: 'SLOW_ACTION',
  PAGE_VIEW: 'PAGE_VIEW',
  UPLOAD_OWN_ARTWORK: 'UPLOAD_OWN_ARTWORK',
  DELETE_DESIGN: 'DELETE_DESIGN',
} as const

// ─── Session & Device Detection ─────────────────────────

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('boris_session')
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem('boris_session', sid)
  }
  return sid
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith('ab_anon_id='))
    ?.split('=')[1] ?? null
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getLocale(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('wallcraft-locale') ?? null
}

// ─── Event Queue & Batching ─────────────────────────────

let queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, BATCH_INTERVAL_MS)
}

async function flush() {
  if (queue.length === 0) return
  const batch = queue.splice(0, MAX_BATCH_SIZE)

  try {
    await fetch('/api/boris/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    })
  } catch {
    // Silent fail — telemetry should never break UX
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

// ─── Public API ─────────────────────────────────────────

export function trackEvent(event: string, metadata?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  const entry: QueuedEvent = {
    event,
    path: window.location.pathname,
    sessionId: getSessionId(),
    userId: getUserId(),
    device: getDevice(),
    locale: getLocale(),
    metadata: metadata ?? undefined,
    timestamp: new Date().toISOString(),
  }

  queue.push(entry)
  scheduleFlush()
}

export function trackFunnel(
  event: keyof typeof FUNNEL_EVENTS,
  metadata?: Record<string, unknown>
) {
  trackEvent(FUNNEL_EVENTS[event], metadata)
}

export function trackError(errorCode: string, message: string, extra?: Record<string, unknown>) {
  trackEvent(UX_EVENTS.UI_ERROR_SHOWN, { errorCode, message, ...extra })
}

export function trackSlowAction(action: string, durationMs: number, extra?: Record<string, unknown>) {
  if (durationMs > 3000) {
    trackEvent(UX_EVENTS.SLOW_ACTION, { action, durationMs, ...extra })
  }
}
