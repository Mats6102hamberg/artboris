'use client'

import { useEffect, useState } from 'react'

export default function CreditsSuccessPage() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    // Fetch updated balance
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(data => {
        if (data.balance !== undefined) setBalance(data.balance)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-light text-gray-900">Credits laddade!</h1>
        <p className="mt-3 text-gray-500">
          Ditt köp har genomförts. Credits har lagts till på ditt konto.
        </p>

        {balance !== null && (
          <div className="mt-6 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-6 py-3">
            <span className="text-2xl font-semibold text-gray-900">{balance}</span>
            <span className="text-sm text-gray-500">credits</span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/wallcraft/studio"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Skapa konst
          </a>
          <a
            href="/market"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            Bläddra i galleriet
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            Startsidan
          </a>
        </div>
      </div>
    </div>
  )
}
