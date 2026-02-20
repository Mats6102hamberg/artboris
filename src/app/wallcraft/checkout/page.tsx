'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import { formatSEK, getAddonPrice, calculatePrintPrice } from '@/lib/pricing/prints'
import { useTelemetry } from '@/hooks/useTelemetry'

const SHIPPING_COST = 99
const VAT_RATE = 0.25

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPriceSEK, clearCart, updateItemAddons } = useCart()
  const { funnel, error: trackErr } = useTelemetry()

  const toggleAddon = (itemId: string, addon: 'mat' | 'acrylic') => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newMat = addon === 'mat' ? !item.matEnabled : item.matEnabled
    const newAcrylic = addon === 'acrylic' ? !item.acrylicGlass : item.acrylicGlass
    const pricing = calculatePrintPrice(item.sizeId, item.frameId, { matEnabled: newMat, acrylicGlass: newAcrylic })
    updateItemAddons(itemId, {
      matEnabled: newMat,
      acrylicGlass: newAcrylic,
      matPriceSEK: pricing.matPriceSEK,
      acrylicPriceSEK: pricing.acrylicPriceSEK,
      totalPriceSEK: pricing.totalPriceSEK,
    })
  }

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

  const subtotal = totalPriceSEK
  const shipping = items.length > 0 ? SHIPPING_COST : 0
  const totalBeforeVat = subtotal + shipping
  const vat = Math.round(totalBeforeVat * VAT_RATE)
  const grandTotal = totalBeforeVat + vat

  const isFormValid = form.firstName && form.lastName && form.email && form.address && form.postalCode && form.city && (confirmationChoice === 'same' || confirmationEmail)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handlePlaceOrder = async () => {
    if (!isFormValid || items.length === 0) return
    funnel('START_CHECKOUT', { itemCount: items.length, totalSEK: grandTotal })
    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const checkoutItems = items.map(item => ({
        designId: item.designId,
        productType: 'POSTER' as const,
        sizeCode: item.sizeId,
        frameColor: item.frameId === 'none' ? 'NONE' : item.frameId.toUpperCase(),
        matEnabled: item.matEnabled,
        acrylicGlass: item.acrylicGlass,
        quantity: item.quantity,
        unitPriceCents: item.totalPriceSEK * 100,
      }))

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          shipping: {
            ...form,
            confirmationEmail: confirmationChoice === 'other' ? confirmationEmail : undefined,
          },
          returnPath: '/wallcraft',
        }),
      })

      const data = await res.json()

      if (data.url) {
        clearCart()
        window.location.href = data.url
      } else {
        trackErr('CHECKOUT_FAIL', data.error || 'Unknown error')
        setCheckoutError(data.error || 'Något gick fel. Försök igen.')
      }
    } catch (err) {
      trackErr('CHECKOUT_NETWORK', 'Network error')
      setCheckoutError('Nätverksfel. Kontrollera din anslutning och försök igen.')
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Empty cart ---
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Din kundvagn är tom</h2>
          <p className="text-gray-500 text-sm mb-6">Designa konst och lägg till i kundvagnen först.</p>
          <button
            onClick={() => router.push('/wallcraft')}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Utforska Wallcraft
          </button>
        </div>
      </div>
    )
  }

  // --- Checkout form ---
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
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
            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Leveransuppgifter</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Förnamn *</label>
                  <input
                    name="firstName" value={form.firstName} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="Mats"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Efternamn *</label>
                  <input
                    name="lastName" value={form.lastName} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="Hamberg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">E-post *</label>
                  <input
                    name="email" value={form.email} onChange={handleChange} type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="mats@example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefon</label>
                  <input
                    name="phone" value={form.phone} onChange={handleChange} type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="070-123 45 67"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Adress *</label>
                  <input
                    name="address" value={form.address} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="Vindragarvägen 4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Postnummer *</label>
                  <input
                    name="postalCode" value={form.postalCode} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="117 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Stad *</label>
                  <input
                    name="city" value={form.city} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                    placeholder="Stockholm"
                  />
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

            {/* Addons — Akrylglas & Passepartout */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Förhöj din beställning</h2>
              <p className="text-xs text-gray-500 mb-5">Lägg till tillval för en ännu bättre upplevelse.</p>

              {items.map((item) => (
                <div key={item.id} className="mb-5 last:mb-0">
                  {items.length > 1 && (
                    <p className="text-xs font-medium text-gray-500 mb-3">{item.style || 'Eget foto'} — {item.sizeLabel}</p>
                  )}

                  {/* Akrylglas toggle */}
                  <button
                    type="button"
                    onClick={() => toggleAddon(item.id, 'acrylic')}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all mb-3 text-left ${
                      item.acrylicGlass
                        ? 'border-emerald-400 bg-emerald-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      item.acrylicGlass ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}>
                      {item.acrylicGlass && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Akrylglas</span>
                        <span className="text-sm font-medium text-gray-900">+{formatSEK(getAddonPrice('acrylic', item.sizeId))}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Splittersäkert, ultralätt och UV-skydd som bevarar färgerna. Optisk klarhet som får motivet att lysa.
                      </p>
                    </div>
                  </button>

                  {/* Passepartout toggle */}
                  <button
                    type="button"
                    onClick={() => toggleAddon(item.id, 'mat')}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                      item.matEnabled
                        ? 'border-emerald-400 bg-emerald-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      item.matEnabled ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}>
                      {item.matEnabled && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Passepartout</span>
                        <span className="text-sm font-medium text-gray-900">+{formatSEK(getAddonPrice('mat', item.sizeId))}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Skapar gallerikänsla med visuellt djup. Skyddar motivet och ger en lyxig, professionell inramning.
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Support info block */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/60">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Vi hjälper dig hela vägen</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Osäker på storlek, ram eller kombination? Vårt team av inredningsexperter ger dig personlig rådgivning.
                  </p>
                  <a href="mailto:support@artboris.se" className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 mt-2 hover:text-amber-900 transition-colors">
                    support@artboris.se
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
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

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 relative">
                      {item.frameId !== 'none' && (
                        <div className="absolute inset-0.5 rounded-sm" style={{ border: `2px solid ${item.frameColor}` }} />
                      )}
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.style || 'Eget foto'}</p>
                      <p className="text-xs text-gray-500">{item.widthCm}×{item.heightCm} cm · {item.frameLabel}</p>
                      {(item.matEnabled || item.acrylicGlass) && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {[item.acrylicGlass && 'Akrylglas', item.matEnabled && 'Passepartout'].filter(Boolean).join(' + ')}
                        </p>
                      )}
                      <p className="text-xs font-medium text-gray-900 mt-1">{item.quantity} st — {formatSEK(item.totalPriceSEK * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
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

              {/* Boris enhancement assurance */}
              <div className="mt-4 flex items-start gap-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl px-3.5 py-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Vår Boris-motor har gått igenom din bild och säkerställt att upplösning och geometri är perfekt för inramning.
                </p>
              </div>

              {/* AI terms notice (Nivå 4) */}
              <p className="text-[10px] text-gray-400 text-center mt-5 leading-relaxed">
                AI-motiv säljs som tryck för privat bruk enligt våra{' '}
                <a href="/terms" target="_blank" className="underline underline-offset-2 hover:text-gray-500">villkor</a>.
              </p>

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!isFormValid || isProcessing}
                className="w-full mt-3 bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
