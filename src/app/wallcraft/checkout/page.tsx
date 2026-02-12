'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import Button from '@/components/ui/Button'
import CreditBadge from '@/components/poster/CreditBadge'
import { CREDIT_PACKAGES } from '@/lib/pricing/credits'
import { formatSEK } from '@/lib/pricing/prints'

function CheckoutContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const designId = searchParams.get('designId') || ''
  const variantId = searchParams.get('variantId') || ''
  const designImageUrl = searchParams.get('designImageUrl') || ''
  const frameId = searchParams.get('frameId') || 'none'
  const sizeId = searchParams.get('sizeId') || '50x70'
  const style = searchParams.get('style') || 'minimal'
  const prompt = searchParams.get('prompt') || ''
  const seed = parseInt(searchParams.get('seed') || '0')
  const publish = searchParams.get('publish') === '1'
  const totalSEK = parseInt(searchParams.get('totalSEK') || '0')
  const creditsNeeded = parseInt(searchParams.get('creditsNeeded') || '0')

  const [credits, setCredits] = useState(28)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [showBuyCredits, setShowBuyCredits] = useState(false)

  const hasEnoughCredits = credits >= creditsNeeded

  const handleBuyCredits = async (packageId: string, creditAmount: number) => {
    try {
      const res = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          userId: 'demo-user',
          amount: creditAmount,
          packageId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCredits(data.newBalance)
        setShowBuyCredits(false)
      }
    } catch (err) {
      console.error('Buy credits error:', err)
    }
  }

  const handlePlaceOrder = async () => {
    if (!hasEnoughCredits) {
      setShowBuyCredits(true)
      return
    }

    setIsProcessing(true)
    try {
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          designId,
          variantId,
          frameId,
          sizeId,
        }),
      })
      const orderData = await orderRes.json()

      if (!orderData.success) {
        alert(orderData.error || t('common.error'))
        return
      }

      setOrderId(orderData.orderId)

      await fetch('/api/renders/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          originalPrompt: prompt,
          controls: null,
          sizeId,
          variantSeed: seed,
        }),
      })

      if (publish) {
        await fetch('/api/gallery/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designId,
            userId: 'demo-user',
            title: `${style} poster`,
            description: '',
            imageUrl: designImageUrl,
            mockupUrl: '',
            style,
          }),
        })
      }

      setCredits(prev => prev - creditsNeeded)
      setOrderComplete(true)
    } catch (err) {
      console.error('Order error:', err)
      alert(t('common.error'))
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                background: ['#1a1a1a', '#6b7280', '#d1d5db', '#f59e0b', '#10b981', '#8b5cf6'][i % 6],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-md mx-auto text-center p-8 relative z-10">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounceIn">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-3 animate-fadeUp">Order placed</h1>
          <p className="text-gray-500 mb-2 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{orderId}</span>
          </p>
          <p className="text-gray-400 text-sm mb-8 animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            Your artwork is being rendered in high resolution. We&apos;ll notify you when it&apos;s ready for print.
          </p>
          <div className="flex flex-col gap-3 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" onClick={() => router.push('/wallcraft/studio')}>
              Create another design
            </Button>
            <Button variant="ghost" onClick={() => router.push('/wallcraft/gallery')}>
              {t('nav.gallery')}
            </Button>
          </div>
        </div>

        <style jsx>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .confetti-piece { animation: confettiFall 3s ease-in forwards; }
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-bounceIn { animation: bounceIn 0.6s ease-out; }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeUp { animation: fadeUp 0.5s ease-out both; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold tracking-widest uppercase text-gray-900">
              {t('brand.name')}
            </span>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-light text-gray-900 mb-8">{t('checkout.title')}</h1>

        <div className="space-y-5">
          {/* Order summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
            <h2 className="text-sm font-medium text-gray-700 mb-4">{t('checkout.orderSummary')}</h2>

            <div className="flex gap-4 mb-6">
              {designImageUrl && (
                <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/60">
                  <img src={designImageUrl} alt="Poster" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium text-gray-900 capitalize">{style} poster</p>
                <p className="text-sm text-gray-500">{sizeId} · {frameId}</p>
                {publish && (
                  <p className="text-xs text-green-600 mt-2">Published to gallery</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Print</span>
                <span className="font-medium text-gray-900">{formatSEK(totalSEK)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Render credits</span>
                <span className="font-medium text-gray-900">{creditsNeeded} credits</span>
              </div>
              <hr className="border-gray-100 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{formatSEK(totalSEK)}</span>
              </div>
            </div>
          </div>

          {/* Credits warning */}
          {!hasEnoughCredits && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-800">Not enough credits</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You need {creditsNeeded} credits but only have {credits}. Buy more below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buy credits */}
          {(showBuyCredits || !hasEnoughCredits) && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h3 className="text-sm font-medium text-gray-700 mb-4">{t('credits.buy')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {CREDIT_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuyCredits(pkg.id, pkg.credits)}
                    className={`
                      relative rounded-xl p-4 border-2 text-left transition-all hover:shadow-md
                      ${pkg.popular
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-3 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Popular
                      </span>
                    )}
                    <p className="font-medium text-gray-900">{pkg.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{pkg.credits} <span className="text-sm font-normal text-gray-500">credits</span></p>
                    <p className="text-sm text-gray-500 mt-1">{formatSEK(pkg.priceSEK)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Place order */}
          <Button
            size="lg"
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Processing...
              </span>
            ) : hasEnoughCredits ? (
              `${t('checkout.pay')} — ${formatSEK(totalSEK)}`
            ) : (
              t('credits.buy')
            )}
          </Button>
          <p className="text-center text-xs text-gray-400">{t('checkout.secure')}</p>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
