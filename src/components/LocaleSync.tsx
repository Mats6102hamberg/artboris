'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'

/**
 * Syncs the <html lang> attribute with the current i18n locale.
 * Must be rendered inside I18nProvider.
 */
export default function LocaleSync() {
  const { locale } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
