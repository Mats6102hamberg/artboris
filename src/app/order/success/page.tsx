'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

function SuccessContent() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const orderId = searchParams.get('orderId')
  const [showConfetti, setShowConfetti] = useState(true)

  // Email state
  const [orderEmail, setOrderEmail] = useState('')
  const [emailChoice, setEmailChoice] = useState<'same' | 'other'>('same')
  const [otherEmail, setOtherEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  // Fetch order email on mount
  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/send-receipt?orderId=${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.email) setOrderEmail(data.email)
      })
      .catch(() => {})
  }, [orderId])

  const handleSendReceipt = async () => {
    if (!orderId) return
    const targetEmail = emailChoice === 'same' ? orderEmail : otherEmail
    if (!targetEmail || !targetEmail.includes('@')) {
      setSendError(t('common.error'))
      return
    }

    setSending(true)
    setSendError(null)

    try {
      const res = await fetch('/api/orders/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email: targetEmail }),
      })
      const data = await res.json()
      if (data.ok) {
        setSent(true)
      } else {
        setSendError(data.error || t('common.error'))
      }
    } catch {
      setSendError(t('market.networkError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
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

      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tack för din beställning!
        </h1>
        <p className="text-gray-600 mb-6">
          Din poster är på väg till tryckeriet.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Ordernummer</p>
            <p className="font-mono text-sm text-gray-800">{orderId}</p>
          </div>
        )}

        {/* Order confirmation email section */}
        {orderId && !sent && (
          <div className="bg-gray-50/80 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">Orderbekräftelse</h3>
            </div>

            <div className="space-y-2.5">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  emailChoice === 'same'
                    ? 'border-gray-900 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  checked={emailChoice === 'same'}
                  onChange={() => setEmailChoice('same')}
                  className="w-3.5 h-3.5 accent-gray-900"
                />
                <div className="min-w-0">
                  <span className="text-sm text-gray-900">Skicka till min e-post</span>
                  {orderEmail && (
                    <span className="block text-xs text-gray-400 truncate">{orderEmail}</span>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  emailChoice === 'other'
                    ? 'border-gray-900 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  checked={emailChoice === 'other'}
                  onChange={() => setEmailChoice('other')}
                  className="w-3.5 h-3.5 accent-gray-900 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-900">Skicka till annan e-post</span>
                  {emailChoice === 'other' && (
                    <input
                      type="email"
                      value={otherEmail}
                      onChange={e => setOtherEmail(e.target.value)}
                      placeholder="annan@example.com"
                      className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    />
                  )}
                </div>
              </label>
            </div>

            {sendError && (
              <p className="text-xs text-red-600 mt-2">{sendError}</p>
            )}

            <button
              onClick={handleSendReceipt}
              disabled={sending || (emailChoice === 'other' && !otherEmail)}
              className="w-full mt-3 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('order.sending')}
                </span>
              ) : (
                t('order.sendConfirmation')
              )}
            </button>
          </div>
        )}

        {/* Sent confirmation */}
        {sent && (
          <div className="flex items-center gap-2 justify-center bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-800 font-medium">
              Bekräftelse skickad till {emailChoice === 'same' ? orderEmail : otherEmail}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/wallcraft/gallery"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
          >
            Utforska galleriet
          </Link>
          <Link
            href="/wallcraft"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
          >
            Skapa mer konst
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
