'use client'

import { useState, useEffect, useCallback } from 'react'

interface MarketOrderData {
  id: string
  listingId: string
  artistId: string
  buyerAnonId: string | null
  sizeCode: string
  frameColor: string
  artistShareCents: number
  platformShareCents: number
  frameCostCents: number
  shippingCents: number
  totalCents: number
  stripePaymentIntentId: string | null
  paidAt: string | null
  status: string
  trackingNumber: string | null
  trackingUrl: string | null
  buyerName: string
  buyerEmail: string
  buyerAddress: string
  buyerPostalCode: string
  buyerCity: string
  buyerCountry: string
  createdAt: string
  listing: {
    id: string
    title: string
    imageUrl: string
    thumbnailUrl: string
    isOriginal: boolean
  }
  artist: {
    id: string
    displayName: string
    email: string
    stripeAccountId: string | null
    stripeOnboardingDone: boolean
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  IN_PRODUCTION: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-800',
}

function formatCents(cents: number) {
  return `${(cents / 100).toFixed(0)} kr`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminMarketOrdersPage() {
  const [orders, setOrders] = useState<MarketOrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [trackingForm, setTrackingForm] = useState<{
    orderId: string
    trackingNumber: string
    trackingUrl: string
  } | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/market-orders')
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } catch (err) {
      console.error('Failed to fetch market orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleAction = async (marketOrderId: string, action: string, extra?: Record<string, string>) => {
    setActionLoading(marketOrderId)
    try {
      const res = await fetch('/api/admin/market-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketOrderId, action, ...extra }),
      })
      const data = await res.json()
      if (data.success) {
        setTrackingForm(null)
        await fetchOrders()
      } else {
        alert(data.error || 'Något gick fel')
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const paidCount = orders.filter(o => o.status === 'PAID').length
  const productionCount = orders.filter(o => o.status === 'IN_PRODUCTION').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/orders" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Ordrar</a>
            <h1 className="text-xl font-bold text-gray-900">Admin — Market Orders</h1>
            {paidCount > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {paidCount} betalda
              </span>
            )}
            {productionCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {productionCount} i produktion
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/reviews" className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors">
              Granskning
            </a>
            <button
              onClick={() => { setLoading(true); fetchOrders() }}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Uppdatera
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Inga market orders ännu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={order.listing.thumbnailUrl || order.listing.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">{order.id.slice(0, 10)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{order.listing.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCents(order.totalCents)}</p>
                      <p className="text-xs text-gray-400">{order.buyerName}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    <span className="text-gray-400">{expandedId === order.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === order.id && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* Grid: buyer + artist + pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Buyer */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Köpare</h4>
                        <p className="text-sm font-medium text-gray-900">{order.buyerName}</p>
                        <p className="text-xs text-gray-600">{order.buyerEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.buyerAddress}<br />
                          {order.buyerPostalCode} {order.buyerCity}, {order.buyerCountry}
                        </p>
                      </div>

                      {/* Artist */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Konstnär</h4>
                        <p className="text-sm font-medium text-gray-900">{order.artist.displayName}</p>
                        <p className="text-xs text-gray-600">{order.artist.email}</p>
                        <div className="mt-1">
                          {order.artist.stripeAccountId && order.artist.stripeOnboardingDone ? (
                            <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Stripe Connect ✓</span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">Manuell utbetalning</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Prisuppdelning</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Konstnärens del</span>
                            <span className="font-medium text-gray-900">{formatCents(order.artistShareCents)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Plattformsavgift</span>
                            <span className="font-medium text-gray-900">{formatCents(order.platformShareCents)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tryck + ram</span>
                            <span className="font-medium text-gray-900">{formatCents(order.frameCostCents)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Frakt</span>
                            <span className="font-medium text-gray-900">{formatCents(order.shippingCents)}</span>
                          </div>
                          <hr className="border-gray-200 !my-1" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-700">Totalt</span>
                            <span className="text-gray-900">{formatCents(order.totalCents)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Product details */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <div><span className="text-gray-400">Storlek:</span> <span className="font-medium">{order.sizeCode}</span></div>
                        <div><span className="text-gray-400">Ram:</span> <span className="font-medium">{order.frameColor}</span></div>
                        <div><span className="text-gray-400">Typ:</span> <span className="font-medium">{order.listing.isOriginal ? 'Original' : 'Print'}</span></div>
                        <div><span className="text-gray-400">Betald:</span> <span className="font-medium">{order.paidAt ? formatDate(order.paidAt) : '—'}</span></div>
                        <div><span className="text-gray-400">Stripe:</span> <span className="font-mono">{order.stripePaymentIntentId?.slice(0, 16) || '—'}</span></div>
                      </div>
                    </div>

                    {/* Tracking */}
                    {order.trackingNumber && (
                      <div className="bg-purple-50 rounded-lg p-3 text-sm">
                        <span className="text-xs text-purple-600 font-medium">Spårning: </span>
                        {order.trackingUrl ? (
                          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-purple-700 font-mono hover:underline">
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="font-mono text-purple-700">{order.trackingNumber}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PAID' && (
                        <button
                          onClick={() => handleAction(order.id, 'IN_PRODUCTION')}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === order.id ? '...' : '→ Produktion'}
                        </button>
                      )}

                      {order.status === 'IN_PRODUCTION' && (
                        <>
                          {trackingForm?.orderId === order.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Spårningsnummer"
                                value={trackingForm.trackingNumber}
                                onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                className="px-2 py-1.5 text-sm border rounded-lg w-36"
                              />
                              <input
                                type="text"
                                placeholder="Spårnings-URL"
                                value={trackingForm.trackingUrl}
                                onChange={e => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                                className="px-2 py-1.5 text-sm border rounded-lg w-48"
                              />
                              <button
                                onClick={() => handleAction(order.id, 'SHIPPED', {
                                  trackingNumber: trackingForm.trackingNumber,
                                  trackingUrl: trackingForm.trackingUrl,
                                })}
                                disabled={actionLoading === order.id}
                                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                              >
                                {actionLoading === order.id ? '...' : 'Markera skickad'}
                              </button>
                              <button onClick={() => setTrackingForm(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setTrackingForm({ orderId: order.id, trackingNumber: '', trackingUrl: '' })}
                              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              → Skickad
                            </button>
                          )}
                        </>
                      )}

                      {order.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleAction(order.id, 'DELIVERED')}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === order.id ? '...' : '→ Levererad'}
                        </button>
                      )}

                      {(order.status === 'PAID' || order.status === 'PENDING') && (
                        <button
                          onClick={() => {
                            if (confirm('Är du säker på att du vill avbryta denna order?')) {
                              handleAction(order.id, 'CANCELED')
                            }
                          }}
                          disabled={actionLoading === order.id}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Avbryt order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
