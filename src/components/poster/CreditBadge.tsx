'use client'

import { useState, useEffect } from 'react'

interface CreditBadgeProps {
  balance?: number
  onClick?: () => void
}

export default function CreditBadge({ onClick }: CreditBadgeProps) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limit, setLimit] = useState(5)

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.json())
      .then((data) => {
        setRemaining(data.generationsRemaining ?? null)
        setLimit(data.generationsLimit ?? 5)
      })
      .catch(() => {})
  }, [])

  if (remaining === null) return null

  const isLow = remaining <= 1
  const isEmpty = remaining === 0

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all ${
        isEmpty
          ? 'bg-red-100 text-red-700 border border-red-200'
          : isLow
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      }`}
      title={`${remaining} av ${limit} gratis genereringar kvar idag`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>{remaining}/{limit}</span>
    </button>
  )
}
