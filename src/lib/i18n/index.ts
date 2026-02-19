import en from '@/i18n/en.json'
import sv from '@/i18n/sv.json'
import de from '@/i18n/de.json'
import fr from '@/i18n/fr.json'
import nl from '@/i18n/nl.json'

export type Locale = 'en' | 'sv' | 'de' | 'fr' | 'nl'

const dictionaries: Record<Locale, typeof en> = { en, sv, de, fr, nl }

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

export const SUPPORTED_LOCALES: Locale[] = ['en', 'sv', 'de', 'fr', 'nl']
export const DEFAULT_LOCALE: Locale = 'en'

const LANG_MAP: Record<string, Locale> = {
  sv: 'sv', 'sv-se': 'sv', 'sv-fi': 'sv',
  de: 'de', 'de-de': 'de', 'de-at': 'de', 'de-ch': 'de',
  fr: 'fr', 'fr-fr': 'fr', 'fr-be': 'fr', 'fr-ch': 'fr', 'fr-ca': 'fr',
  nl: 'nl', 'nl-nl': 'nl', 'nl-be': 'nl',
  en: 'en', 'en-us': 'en', 'en-gb': 'en', 'en-au': 'en',
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const stored = localStorage.getItem('wallcraft-locale') as Locale | null
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored

  const langs = navigator.languages ?? [navigator.language]
  for (const lang of langs) {
    const lower = lang.toLowerCase()
    if (LANG_MAP[lower]) return LANG_MAP[lower]
    const prefix = lower.split('-')[0]
    if (LANG_MAP[prefix]) return LANG_MAP[prefix]
  }

  return DEFAULT_LOCALE
}
