'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { type Locale, DEFAULT_LOCALE, getDictionary, getNestedValue } from '.'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  tArray: (key: string) => string[]
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallcraft-locale', newLocale)
    }
  }, [])

  const dict = getDictionary(locale)

  const t = useCallback((key: string): string => {
    return getNestedValue(dict as unknown as Record<string, unknown>, key)
  }, [dict])

  const tArray = useCallback((key: string): string[] => {
    const keys = key.split('.')
    let current: unknown = dict
    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') return []
      current = (current as Record<string, unknown>)[k]
    }
    return Array.isArray(current) ? current as string[] : []
  }, [dict])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tArray }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
