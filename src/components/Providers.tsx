'use client'

import { SessionProvider } from 'next-auth/react'
import ErrorBoundary from '@/components/ErrorBoundary'
import SentryUserSync from '@/components/SentryUserSync'
import { I18nProvider } from '@/lib/i18n/context'
import { detectLocale } from '@/lib/i18n'
import LocaleWelcome from '@/components/ui/LocaleWelcome'
import LocaleSync from '@/components/LocaleSync'

export default function Providers({ children }: { children: React.ReactNode }) {
  const initialLocale = typeof window !== 'undefined' ? detectLocale() : undefined

  return (
    <SessionProvider>
      <I18nProvider initialLocale={initialLocale}>
        <SentryUserSync />
        <LocaleSync />
        <LocaleWelcome />
        <ErrorBoundary>{children}</ErrorBoundary>
      </I18nProvider>
    </SessionProvider>
  )
}
