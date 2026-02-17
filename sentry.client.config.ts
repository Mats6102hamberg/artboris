import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Sample rate for error events (1.0 = 100%)
  sampleRate: 1.0,

  // Performance monitoring (10% of transactions)
  tracesSampleRate: 0.1,

  // Session replay for debugging (1% normal, 100% on error)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
})
