import en from '@/i18n/en.json'
import sv from '@/i18n/sv.json'

export type Locale = 'en' | 'sv'

const dictionaries: Record<Locale, typeof en> = { en, sv }

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.en
}

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

export const SUPPORTED_LOCALES: Locale[] = ['en', 'sv']
export const DEFAULT_LOCALE: Locale = 'en'
