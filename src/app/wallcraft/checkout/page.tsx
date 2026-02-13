'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/CartContext'
import { formatSEK } from '@/lib/pricing/prints'

const SHIPPING_COST = 99
const VAT_RATE = 0.25

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPriceSEK, clearCart } = useCart()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const subtotal = totalPriceSEK
  const shipping = items.length > 0 ? SHIPPING_COST : 0
  const totalBeforeVat = subtotal + shipping
  const vat = Math.round(totalBeforeVat * VAT_RATE)
  const grandTotal = totalBeforeVat + vat

  const isFormValid = form.firstName && form.lastName && form.email && form.address && form.postalCode && form.city

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePlaceOrder = async () => {
    if (!isFormValid || items.length === 0) return
    setIsProcessing(true)

    // Simulate order creation (Stripe integration placeholder)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const id = `ART-${Date.now().toString(36).toUpperCase()}`
    setOrderId(id)
    clearCart()
    setIsProcessing(false)
  }

  // --- Order Confirmation ---
  if (orderId) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center relative overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-5%',
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                background: ['#1a1a1a', '#C4A265', '#D4AF37', '#f5f5f5', '#5C4033', '#8b5cf6', '#10b981'][i % 7],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2.5 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-lg mx-auto text-center p-8 relative z-10">
          {/* Check icon */}
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounceIn">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-light text-gray-900 mb-2 animate-fadeUp">Tack för din beställning!</h1>
          <p className="text-gray-500 mb-6 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            Ordernummer: <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{orderId}</span>
          </p>

          {/* Delivery Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/60 mb-8 text-left animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-medium text-gray-700 mb-5">Leveransstatus</h3>
            <div className="space-y-0">
              {[
                { label: 'Order mottagen', desc: 'Vi har fått din beställning', active: true, done: true },
                { label: 'Tryck påbörjat', desc: 'Crimson förbereder ditt konstverk', active: true, done: false },
                { label: 'Inramning', desc: 'Professionell inramning med din valda ram', active: false, done: false },
                { label: 'På väg till dig', desc: `Leverans till ${form.address || 'din adress'}`, active: false, done: false },
              ].map((step, i, arr) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done ? 'bg-gray-900 text-white' : step.active ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-300'
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`w-0.5 h-8 ${step.done ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Trycks och ramas av <span className="font-medium text-gray-500">Crimson, Stockholm</span> — för högsta gallerikvalitet.
            </p>
          </div>

          <div className="flex flex-col gap-3 animate-fadeUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => router.push('/wallcraft/studio')}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Skapa fler konstverk
            </button>
            <button
              onClick={() => router.push('/wallcraft')}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Tillbaka till Wallcraft
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-confetti { animation: confettiFall 3s ease-in forwards; }
          @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.15); }
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

            {/* Payment (Stripe placeholder) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/60">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Betalning</h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Stripe-betalning</p>
                <p className="text-xs text-gray-400 mt-1">Kortbetalning aktiveras vid lansering</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">VISA</div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Mastercard</div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Swish</div>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-[10px] font-medium text-gray-500 border border-gray-100">Klarna</div>
                </div>
              </div>
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

              {/* Place order button */}
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
