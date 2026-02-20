'use client'

import { useEffect, useRef } from 'react'
import { trackEvent, trackFunnel, trackError, trackSlowAction, FUNNEL_EVENTS, UX_EVENTS } from '@/lib/boris/telemetry'

/**
 * Hook for Boris M telemetry.
 * Auto-tracks PAGE_VIEW on mount. Returns helpers for funnel + error tracking.
 *
 * Usage:
 *   const { funnel, error, slow, track } = useTelemetry()
 *   funnel('ADD_TO_CART', { sizeId, frameId })
 *   error('STRIPE_FAIL', 'Card declined')
 *   slow('generate', 8500)
 */
export function useTelemetry() {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackEvent(UX_EVENTS.PAGE_VIEW)
  }, [])

  return {
    track: trackEvent,
    funnel: (event: keyof typeof FUNNEL_EVENTS, metadata?: Record<string, unknown>) =>
      trackFunnel(event, metadata),
    error: trackError,
    slow: trackSlowAction,
  }
}
