'use client'

import { useCart } from '@/lib/cart/CartContext'
import { formatSEK } from '@/lib/pricing/prints'
import { useRouter } from 'next/navigation'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalItems, totalPriceSEK } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/wallcraft/checkout')
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Kundvagn {totalItems > 0 && <span className="text-gray-400 font-normal">({totalItems})</span>}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Din kundvagn är tom</p>
              <p className="text-gray-400 text-xs mt-1">Designa konst och lägg till här</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {/* Mini mockup */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 relative">
                  {item.frameId !== 'none' && (
                    <div
                      className="absolute inset-1 rounded-sm"
                      style={{ border: `3px solid ${item.frameColor}` }}
                    />
                  )}
                  <img
                    src={item.imageUrl}
                    alt="Konstverk"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{item.style || 'Eget foto'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.sizeLabel} — {item.widthCm}×{item.heightCm} cm</p>
                      <p className="text-xs text-gray-400">{item.frameLabel}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 disabled:opacity-30 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatSEK(item.totalPriceSEK * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Delsumma</span>
              <span className="text-lg font-bold text-gray-900">{formatSEK(totalPriceSEK)}</span>
            </div>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Trycks och ramas av <span className="font-medium text-gray-500">Crimson, Stockholm</span> — för högsta gallerikvalitet.
            </p>

            <button
              onClick={handleCheckout}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Till kassan — {formatSEK(totalPriceSEK)}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
