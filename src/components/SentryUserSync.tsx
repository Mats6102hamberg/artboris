'use client'

import { useSession } from 'next-auth/react'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Syncs the current user session to Sentry so every error
 * includes user.id and user.email.
 */
export default function SentryUserSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email ?? undefined,
      })
    } else {
      Sentry.setUser(null)
    }
  }, [session])

  return null
}
