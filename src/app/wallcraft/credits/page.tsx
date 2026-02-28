'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import { CREDIT_PACKAGES, CREDIT_COSTS, FIRST_PURCHASE_BONUS } from '@/lib/pricing/credits'

export default function CreditsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)
  const [dailyLimit, setDailyLimit] = useState(50)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(data => {
        setBalance(data.balance ?? 0)
        if (data.totalPurchased && data.totalPurchased > 0) {
          setIsFirstPurchase(false)
        }
      })
      .catch(() => {})

    fetch('/api/usage')
      .then(r => r.json())
      .then(data => {
        setDailyRemaining(data.generationsRemaining ?? null)
        setDailyLimit(data.generationsLimit ?? 50)
      })
      .catch(() => {})
  }, [])

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
        alert(data.error || t('wc.somethingWentWrongShort'))
      }
    } catch {
      alert(t('wc.checkoutNetworkError'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <a href="/wallcraft" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
          {t('brand.name')}
        </a>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          {t('wc.back')}
        </Button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white mb-5 shadow-lg shadow-purple-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900">{t('wc.buyCredits')}</h1>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            {t('wc.creditsDesc')}
          </p>
        </div>

        {/* Current balance */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {balance !== null && (
            <div className="bg-white rounded-xl border border-gray-200/60 px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('wc.yourBalance')}</p>
                <p className="text-lg font-semibold text-gray-900">{balance} credits</p>
              </div>
            </div>
          )}
          {dailyRemaining !== null && (
            <div className="bg-white rounded-xl border border-gray-200/60 px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('wc.freeGenerationsToday')}</p>
                <p className="text-lg font-semibold text-gray-900">{dailyRemaining}/{dailyLimit}</p>
              </div>
            </div>
          )}
        </div>

        {/* First purchase bonus */}
        {isFirstPurchase && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-4 mb-8 text-center">
            <p className="text-sm font-medium text-emerald-800">
              🎁 +{FIRST_PURCHASE_BONUS} {t('wc.firstPurchaseBonus')}
            </p>
          </div>
        )}

        {/* Package cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {CREDIT_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                pkg.popular
                  ? 'border-purple-500 bg-purple-50/30 shadow-xl shadow-purple-100/50 scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {pkg.badge}
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{pkg.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{pkg.subtitle}</p>

                <div className="mt-5">
                  <span className="text-4xl font-light text-gray-900">{pkg.credits}</span>
                  <span className="text-sm text-gray-500 ml-1">credits</span>
                </div>

                <div className="mt-2">
                  <span className="text-2xl font-semibold text-gray-900">{pkg.priceSEK}</span>
                  <span className="text-sm text-gray-500 ml-1">kr</span>
                </div>

                {pkg.pricePerCredit && (
                  <p className="text-xs text-gray-400 mt-1">
                    {pkg.pricePerCredit.toFixed(2)} kr/credit
                  </p>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  ~{pkg.estAnalyses} {t('wc.borisAnalysesCount')}
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    pkg.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-200/50'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === pkg.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('wc.loading')}
                    </span>
                  ) : (
                    t('wc.buyCreditsBtn')
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* What can I use credits for */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{t('wc.whatCanIUse')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: t('wc.borisAnalysis'), cost: CREDIT_COSTS.borisAnalysis, icon: '🔍', color: 'purple' },
              { label: t('wc.roomAdvice'), cost: CREDIT_COSTS.wallAdvice, icon: '🏠', color: 'emerald' },
              { label: t('wc.aiGenerate'), cost: CREDIT_COSTS.aiGenerate, icon: '✨', color: 'blue' },
              { label: t('wc.previewVariants'), cost: CREDIT_COSTS.generatePreview, icon: '🎨', color: 'amber' },
              { label: t('wc.newVariant'), cost: CREDIT_COSTS.refineVariant, icon: '🔄', color: 'teal' },
              { label: t('wc.printFile'), cost: CREDIT_COSTS.finalRender, icon: '🖨️', color: 'rose' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2">
                <span className="text-lg w-8 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                </div>
                <span className="text-sm font-semibold text-gray-600">{item.cost} cr</span>
              </div>
            ))}
          </div>
        </div>

        {/* Free tier info */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{t('wc.freeEveryDay')}</h3>
          <p className="text-sm text-gray-500">
            {t('wc.freeGenerationsDesc').replace('{limit}', String(dailyLimit))}
            <br />
            {t('wc.creditsNeededFor')}
          </p>
        </div>

        {/* Persuasion */}
        <div className="text-center pb-12">
          <p className="text-sm text-gray-500">
            {t('wc.persuasionLine1')}
            <br />
            <span className="font-medium text-gray-700">{t('wc.persuasionLine2')}</span>
          </p>
        </div>
      </div>

      <footer className="border-t border-gray-200/60 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs text-gray-400">© {new Date().getFullYear()} Wallcraft by Artboris</span>
        </div>
      </footer>
    </div>
  )
}
