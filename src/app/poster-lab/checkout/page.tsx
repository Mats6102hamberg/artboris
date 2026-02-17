'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { formatSEK } from '@/lib/pricing/prints'

const SHIPPING_COST = 99
const VAT_RATE = 0.25

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const designId = searchParams.get('designId') || ''
  const designImageUrl = searchParams.get('designImageUrl') || ''
  const frameId = searchParams.get('frameId') || 'none'
  const sizeId = searchParams.get('sizeId') || '50x70'
  const style = searchParams.get('style') || 'minimal'
  const totalSEK = parseInt(searchParams.get('totalSEK') || '0')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  })
  const [confirmationChoice, setConfirmationChoice] = useState<'same' | 'other'>('same')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const subtotal = totalSEK
  const shipping = SHIPPING_COST
  const totalBeforeVat = subtotal + shipping
  const vat = Math.round(totalBeforeVat * VAT_RATE)
  const grandTotal = totalBeforeVat + vat

  const isFormValid = form.firstName && form.lastName && form.email && form.address && form.postalCode && form.city && (confirmationChoice === 'same' || confirmationEmail)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePlaceOrder = async () => {
    if (!isFormValid || !designId) return
    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            designId,
            productType: 'POSTER',
            sizeCode: sizeId,
            frameColor: frameId === 'none' ? 'NONE' : frameId.toUpperCase(),
            quantity: 1,
            unitPriceCents: totalSEK * 100,
          }],
          shipping: {
            ...form,
            confirmationEmail: confirmationChoice === 'other' ? confirmationEmail : undefined,
          },
          returnPath: '/poster-lab',
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Något gick fel. Försök igen.')
      }
    } catch (err) {
      setCheckoutError('Nätverksfel. Kontrollera din anslutning och försök igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold tracking-widest uppercase text-gray-900">Kassa</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Säker betalning
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Shipping form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Leveransuppgifter</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Förnamn *</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Efternamn *</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">E-post *</label>
                  <input name="email" value={form.email} onChange={handleChange} type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefon</label>
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Adress *</label>
                  <input name="address" value={form.address} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Postnummer *</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Stad *</label>
                  <input name="city" value={form.city} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors" />
                </div>
              </div>
            </div>

            {/* Order confirmation email */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Orderbekräftelse</h2>
              <p className="text-xs text-gray-500 mb-4">Vart vill du att orderbekräftelsen skickas?</p>
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    confirmationChoice === 'same'
                      ? 'border-gray-900 bg-gray-50/80'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="confirmationChoice"
                    checked={confirmationChoice === 'same'}
                    onChange={() => setConfirmationChoice('same')}
                    className="w-4 h-4 text-gray-900 accent-gray-900"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Skicka till min e-post</span>
                    {form.email && (
                      <span className="block text-xs text-gray-400 mt-0.5">{form.email}</span>
                    )}
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    confirmationChoice === 'other'
                      ? 'border-gray-900 bg-gray-50/80'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="confirmationChoice"
                    checked={confirmationChoice === 'other'}
                    onChange={() => setConfirmationChoice('other')}
                    className="w-4 h-4 text-gray-900 accent-gray-900 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">Skicka till annan e-post</span>
                    {confirmationChoice === 'other' && (
                      <input
                        type="email"
                        value={confirmationEmail}
                        onChange={(e) => setConfirmationEmail(e.target.value)}
                        placeholder="annan@example.com"
                        className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Betalning</h2>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Säker kortbetalning via Stripe</p>
                  <p className="text-xs text-gray-400">Du skickas till Stripe för att slutföra betalningen</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">VISA</div>
                <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Mastercard</div>
                <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Klarna</div>
              </div>

              {checkoutError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{checkoutError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60 lg:sticky lg:top-24">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Ordersammanfattning</h2>

              <div className="flex gap-3 mb-6">
                {designImageUrl && (
                  <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    <img src={designImageUrl} alt="Poster" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 capitalize">{style} poster</p>
                  <p className="text-xs text-gray-500">Storlek: {sizeId}</p>
                  <p className="text-xs text-gray-500">Ram: {frameId === 'none' ? 'Ingen' : frameId}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Delsumma</span>
                  <span className="text-gray-900">{formatSEK(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frakt</span>
                  <span className="text-gray-900">{formatSEK(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Moms (25%)</span>
                  <span className="text-gray-900">{formatSEK(vat)}</span>
                </div>
                <hr className="border-gray-100 !my-3" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Totalt</span>
                  <span className="font-bold text-gray-900">{formatSEK(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!isFormValid || isProcessing}
                className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bearbetar...
                  </span>
                ) : (
                  `Slutför köp — ${formatSEK(grandTotal)}`
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                Trycks och ramas av <span className="font-medium text-gray-500">Crimson, Stockholm</span> — för högsta gallerikvalitet.
              </p>
            </div>
          </div>
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
