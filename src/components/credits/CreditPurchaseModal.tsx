'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { CREDIT_PACKAGES, CREDIT_COSTS, FIRST_PURCHASE_BONUS } from '@/lib/pricing/credits'

interface CreditPurchaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  neededCredits?: number
  actionLabel?: string
  onPurchased?: () => void
  userId?: string
}

export default function CreditPurchaseModal({
  open,
  onOpenChange,
  neededCredits,
  actionLabel = 'Boris-analys',
  onPurchased,
  userId,
}: CreditPurchaseModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)

  useEffect(() => {
    if (open && userId) {
      fetch(`/api/credits/balance?userId=${userId}`)
        .then(r => r.json())
        .then(data => {
          // If they have totalPurchased > 0, not first purchase
          if (data.totalPurchased && data.totalPurchased > 0) {
            setIsFirstPurchase(false)
          }
        })
        .catch(() => {})
    }
  }, [open, userId])

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId)
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || t('creditModal.somethingWentWrong'))
      }
    } catch {
      alert(t('creditModal.networkError'))
    } finally {
      setLoading(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-900">
              {t('creditModal.title')}
            </h2>
            <p className="mt-2 text-gray-500">
              {t('creditModal.subtitle')}
            </p>
            {neededCredits && neededCredits > 0 && (
              <p className="mt-2 text-sm text-amber-600 font-medium">
                {t('creditModal.needMoreCredits')} {neededCredits} credits — {actionLabel}.
              </p>
            )}
          </div>

          {/* First purchase bonus */}
          {isFirstPurchase && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-3 mb-6 text-center">
              <p className="text-sm font-medium text-emerald-800">
+{FIRST_PURCHASE_BONUS} {t('creditModal.firstPurchaseBonus')}
              </p>
            </div>
          )}

          {/* Package cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {CREDIT_PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border-2 p-5 transition-all ${
                  pkg.popular
                    ? 'border-purple-500 bg-purple-50/30 shadow-lg shadow-purple-100/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.subtitle}</p>

                  <div className="mt-4">
                    <span className="text-3xl font-light text-gray-900">{pkg.credits}</span>
                    <span className="text-sm text-gray-500 ml-1">credits</span>
                  </div>

                  <div className="mt-1">
                    <span className="text-xl font-semibold text-gray-900">{pkg.priceSEK}</span>
                    <span className="text-sm text-gray-500 ml-1">kr</span>
                  </div>

                  {pkg.pricePerCredit && (
                    <p className="text-xs text-gray-400 mt-1">
                      {pkg.pricePerCredit.toFixed(2)} kr/credit
                    </p>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    ~{pkg.estAnalyses} {t('creditModal.borisAnalysis')}
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                      pkg.popular
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200/50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading === pkg.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
{t('creditModal.loading')}
                      </span>
                    ) : (
                      t('creditModal.buyCredits')
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Value explainer */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t('creditModal.whatCanCreditsDoTitle')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('creditModal.borisAnalysis')}</p>
                  <p className="text-xs text-gray-500">{CREDIT_COSTS.borisAnalysis} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('creditModal.roomAdvice')}</p>
                  <p className="text-xs text-gray-500">{CREDIT_COSTS.wallAdvice} credits</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('creditModal.aiArt')}</p>
                  <p className="text-xs text-gray-500">{CREDIT_COSTS.aiGenerate} credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Persuasion line */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {t('creditModal.persuasionLine1')}
              <br />
              <span className="font-medium text-gray-700">{t('creditModal.persuasionLine2')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
