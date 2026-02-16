'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const marketOrderId = searchParams.get('marketOrderId')
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${16 + Math.random() * 16}px`,
              }}
            >
              {['🎉', '🎨', '✨', '🖼️', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-light text-gray-900">Tack för ditt köp!</h1>
        <p className="mt-3 text-gray-500">
          Din beställning har mottagits. Konstverket trycks och ramas av Crimson i Stockholm.
        </p>

        {marketOrderId && (
          <div className="mt-6 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-6 py-3">
            <span className="text-xs text-gray-400">Order:</span>
            <span className="font-mono text-sm text-gray-900">{marketOrderId.slice(0, 12)}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/market"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Utforska fler konstverk
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            Startsidan
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function MarketOrderSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
