export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  // Edge runtime skipped — middleware is a simple auth check
  // and Sentry SDK exceeds Vercel's 1MB edge function limit
}

export const onRequestError = async (
  err: { digest: string } & Error,
  request: {
    path: string
    method: string
    headers: { [key: string]: string }
  },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) => {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
