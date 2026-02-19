'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n'

const LOCALE_INFO: Record<Locale, { flag: string; label: string; welcome: string }> = {
  sv: { flag: '🇸🇪', label: 'Svenska', welcome: 'Välkommen till Artboris' },
  en: { flag: '🇬🇧', label: 'English', welcome: 'Welcome to Artboris' },
  de: { flag: '🇩🇪', label: 'Deutsch', welcome: 'Willkommen bei Artboris' },
  fr: { flag: '🇫🇷', label: 'Français', welcome: 'Bienvenue sur Artboris' },
  nl: { flag: '🇳🇱', label: 'Nederlands', welcome: 'Welkom bij Artboris' },
}

export default function LocaleWelcome() {
  const { locale, setLocale } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasChosen = localStorage.getItem('wallcraft-locale')
    if (!hasChosen) {
      setShow(true)
    }
  }, [])

  const handleSelect = (loc: Locale) => {
    setLocale(loc)
    localStorage.setItem('wallcraft-locale', loc)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {LOCALE_INFO[locale]?.welcome || 'Welcome to Artboris'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">Choose your language / Välj språk</p>
        </div>

        {/* Language buttons */}
        <div className="p-6 space-y-2">
          {SUPPORTED_LOCALES.map((loc) => {
            const info = LOCALE_INFO[loc]
            const isDetected = loc === locale
            return (
              <button
                key={loc}
                onClick={() => handleSelect(loc)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                  isDetected
                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{info.flag}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">{info.label}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{info.welcome}</span>
                </div>
                {isDetected && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    Auto
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-gray-400">
            You can change this later in the menu
          </p>
        </div>
      </div>
    </div>
  )
}
