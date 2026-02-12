'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CreditBadge from '@/components/poster/CreditBadge'
import { CREDIT_PACKAGES } from '@/lib/pricing/credits'
import { formatSEK } from '@/lib/pricing/prints'

function CheckoutContent() {
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
      // 1. Create order
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
        alert(orderData.error || 'Kunde inte skapa order.')
        return
      }

      setOrderId(orderData.orderId)

      // 2. Trigger final render
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

      // 3. Publish to gallery if requested
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
      alert('Något gick fel vid beställningen.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                background: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-md mx-auto text-center p-8 relative z-10">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounceIn">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 animate-fadeUp">Beställning lagd!</h1>
          <p className="text-gray-600 mb-2 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            Order-ID: <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{orderId}</span>
          </p>
          <p className="text-gray-500 mb-8 animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            Din poster renderas nu i hög upplösning. Du får ett meddelande när den är klar för tryck.
          </p>
          <div className="flex flex-col gap-3 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => router.push('/poster-lab')}
              className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg shadow-purple-200 hover:shadow-xl transition-all hover:scale-105"
            >
              Skapa en till poster
            </button>
            <button
              onClick={() => router.push('/poster-lab/gallery')}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Utforska galleriet
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .confetti-piece {
            animation: confettiFall 3s ease-in forwards;
          }
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-bounceIn {
            animation: bounceIn 0.6s ease-out;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeUp {
            animation: fadeUp 0.5s ease-out both;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
              &larr; Tillbaka
            </button>
            <h1 className="text-xl font-bold text-gray-900">Kassa</h1>
          </div>
          <CreditBadge />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Order summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Din beställning</h2>

            <div className="flex gap-4 mb-6">
              {designImageUrl && (
                <div className="w-24 h-36 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={designImageUrl} alt="Poster" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium text-gray-900 capitalize">{style} poster</p>
                <p className="text-sm text-gray-500">Storlek: {sizeId}</p>
                <p className="text-sm text-gray-500">Ram: {frameId}</p>
                {publish && (
                  <p className="text-xs text-green-600 mt-2">Delas i galleriet</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Poster + tryck</span>
                <span className="font-medium">{formatSEK(totalSEK)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slutrender (credits)</span>
                <span className="font-medium">{creditsNeeded} credits</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Totalt</span>
                <span className="font-bold text-gray-900">{formatSEK(totalSEK)}</span>
              </div>
            </div>
          </div>

          {/* Credits check */}
          {!hasEnoughCredits && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-800">Inte tillräckligt med credits</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Du behöver {creditsNeeded} credits men har bara {credits}. Köp fler nedan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buy credits */}
          {(showBuyCredits || !hasEnoughCredits) && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Köp credits</h3>
              <div className="grid grid-cols-2 gap-3">
                {CREDIT_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleBuyCredits(pkg.id, pkg.credits)}
                    className={`
                      relative rounded-xl p-4 border-2 text-left transition-all hover:shadow-md
                      ${pkg.popular
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Populär
                      </span>
                    )}
                    <p className="font-semibold text-gray-900">{pkg.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{pkg.credits} <span className="text-sm font-normal text-gray-500">credits</span></p>
                    <p className="text-sm text-gray-600 mt-1">{formatSEK(pkg.priceSEK)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Place order */}
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg shadow-green-200"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Bearbetar...
              </span>
            ) : hasEnoughCredits ? (
              `Beställ — ${formatSEK(totalSEK)}`
            ) : (
              'Köp credits först'
            )}
          </button>
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
