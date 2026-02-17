'use client'

import { SessionProvider } from 'next-auth/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import SentryUserSync from '@/components/SentryUserSync'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserSync />
      <ErrorBoundary>{children}</ErrorBoundary>
    </SessionProvider>
  )
}
