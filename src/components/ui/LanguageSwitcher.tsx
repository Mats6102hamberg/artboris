'use client'

import { useTranslation } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  sv: 'SV',
}

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex items-center gap-1 text-sm">
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`px-2 py-1 rounded-md transition-colors ${
            locale === loc
              ? 'bg-gray-900 text-white font-medium'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  )
}
