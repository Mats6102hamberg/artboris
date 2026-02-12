'use client'

import { useState, useEffect, useCallback } from 'react'

interface PrintAsset {
  id: string
  url: string
  role: string
  sizeCode: string | null
  productType: string | null
  widthPx: number | null
  heightPx: number | null
  dpi: number | null
  fileSize: number | null
  mimeType: string | null
  sourceWidthPx: number | null
  sourceHeightPx: number | null
  upscaleFactor: number | null
  upscaleProvider: string | null
  createdAt: string
}

interface FulfillmentData {
  id: string
  status: string
  partnerId: string | null
  partner: { name: string } | null
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

interface OrderItemData {
  id: string
  designId: string
  productType: string
  sizeCode: string
  frameColor: string
  paperType: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  design: { id: string; title: string; imageUrl: string }
  fulfillment: FulfillmentData | null
  printAsset: PrintAsset | null
  printFinalAsset: PrintAsset | null
}

interface PaymentData {
  id: string
  provider: string
  amountCents: number
  currency: string
  paidAt: string | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
}

interface OrderData {
  id: string
  anonId: string | null
  status: string
  currency: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  createdAt: string
  payment: PaymentData | null
  items: OrderItemData[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  AWAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  IN_PRODUCTION: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
}

const FULFILLMENT_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  QUEUED: 'bg-yellow-100 text-yellow-700',
  SENT_TO_PARTNER: 'bg-blue-100 text-blue-700',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELED: 'bg-red-100 text-red-600',
  FAILED: 'bg-red-200 text-red-800',
}

function formatCents(cents: number, currency = 'SEK') {
  return `${(cents / 100).toFixed(0)} ${currency}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [trackingForm, setTrackingForm] = useState<{
    fulfillmentId: string
    carrier: string
    trackingNumber: string
    trackingUrl: string
  } | null>(null)
  const [generateLoading, setGenerateLoading] = useState<string | null>(null)
  const [generateFinalLoading, setGenerateFinalLoading] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleGeneratePrint = async (orderItemId: string, fulfillmentId?: string) => {
    setGenerateLoading(orderItemId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_PRINT', orderItemId, fulfillmentId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchOrders()
      } else {
        alert(`Fel: ${data.error || 'Okänt fel'}`)
      }
    } catch (err) {
      console.error('Generate print failed:', err)
      alert('Kunde inte generera tryckfil.')
    } finally {
      setGenerateLoading(null)
    }
  }

  const handleGeneratePrintFinal = async (orderItemId: string, fulfillmentId?: string) => {
    setGenerateFinalLoading(orderItemId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GENERATE_PRINT_FINAL', orderItemId, fulfillmentId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchOrders()
      } else {
        alert(`Fel: ${data.error || 'Okänt fel'}`)
      }
    } catch (err) {
      console.error('Generate print final failed:', err)
      alert('Kunde inte generera slutgiltig tryckfil.')
    } finally {
      setGenerateFinalLoading(null)
    }
  }

  const handleAction = async (action: string, fulfillmentId: string, extra?: Record<string, string>) => {
    setActionLoading(fulfillmentId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fulfillmentId, ...extra }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchOrders()
        setTrackingForm(null)
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

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
            <a href="/" className="text-gray-400 hover:text-gray-600 text-sm">&larr;</a>
            <h1 className="text-xl font-bold text-gray-900">Admin — Ordrar</h1>
          </div>
          <button
            onClick={() => { setLoading(true); fetchOrders() }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Uppdatera
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Inga ordrar ännu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gray-500">{order.id.slice(0, 12)}…</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCents(order.totalCents, order.currency)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.items.length} artikel{order.items.length !== 1 ? 'ar' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    <span className="text-gray-400">{expandedOrder === order.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* Payment info */}
                    {order.payment && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <h4 className="font-medium text-gray-700 mb-1">Betalning</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                          <div><span className="text-gray-400">Provider:</span> {order.payment.provider}</div>
                          <div><span className="text-gray-400">Belopp:</span> {formatCents(order.payment.amountCents)}</div>
                          <div><span className="text-gray-400">Betald:</span> {order.payment.paidAt ? formatDate(order.payment.paidAt) : '—'}</div>
                          <div><span className="text-gray-400">PI:</span> <span className="font-mono">{order.payment.stripePaymentIntentId?.slice(0, 16) || '—'}…</span></div>
                        </div>
                      </div>
                    )}

                    {/* Order items */}
                    {order.items.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={item.design.imageUrl} alt={item.design.title} className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{item.design.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.productType} · {item.sizeCode} · {item.frameColor !== 'NONE' ? `Ram: ${item.frameColor}` : 'Utan ram'} · {item.paperType}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity}x {formatCents(item.unitPriceCents)} = <span className="font-medium">{formatCents(item.lineTotalCents)}</span>
                                </p>
                              </div>
                            </div>

                            {/* Print asset status */}
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400">Tryckfil:</span>
                                {item.printAsset && item.printAsset.upscaleFactor ? (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
                                    ✓ Klar
                                  </span>
                                ) : item.printAsset ? (
                                  <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                                    ⏳ Placeholder
                                  </span>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                    ✗ Saknas
                                  </span>
                                )}
                              </div>

                              {/* Detaljerad print-info */}
                              {item.printAsset && item.printAsset.upscaleFactor ? (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-xs bg-green-50/50 rounded p-1.5">
                                  <div><span className="text-gray-400">Factor:</span> <span className="font-medium">{item.printAsset.upscaleFactor}×</span></div>
                                  <div><span className="text-gray-400">Px:</span> <span className="font-mono">{item.printAsset.widthPx}×{item.printAsset.heightPx}</span></div>
                                  <div><span className="text-gray-400">DPI:</span> <span className="font-medium">{item.printAsset.dpi}</span></div>
                                  <div><span className="text-gray-400">Storlek:</span> {item.printAsset.fileSize ? `${(item.printAsset.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}</div>
                                  <div><span className="text-gray-400">Källa:</span> <span className="font-mono">{item.printAsset.sourceWidthPx}×{item.printAsset.sourceHeightPx}</span></div>
                                  <div><span className="text-gray-400">Skapad:</span> {formatDate(item.printAsset.createdAt)}</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGeneratePrint(item.id, item.fulfillment?.id)}
                                  disabled={generateLoading === item.id}
                                  className="mt-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                                >
                                  {generateLoading === item.id ? (
                                    <><span className="animate-spin">⏳</span> Genererar tryckfil…</>
                                  ) : (
                                    <>🖨️ Generera tryckfil</>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* PRINT_FINAL status */}
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400">Slutgiltig tryckfil:</span>
                                {item.printFinalAsset ? (
                                  <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                                    ✓ Klar
                                  </span>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                    ✗ Saknas
                                  </span>
                                )}
                              </div>

                              {item.printFinalAsset ? (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-xs bg-emerald-50/50 rounded p-1.5">
                                  <div><span className="text-gray-400">Px:</span> <span className="font-mono">{item.printFinalAsset.widthPx}×{item.printFinalAsset.heightPx}</span></div>
                                  <div><span className="text-gray-400">DPI:</span> <span className="font-medium">{item.printFinalAsset.dpi}</span></div>
                                  <div><span className="text-gray-400">Storlek:</span> {item.printFinalAsset.fileSize ? `${(item.printFinalAsset.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}</div>
                                  <div><span className="text-gray-400">Skapad:</span> {formatDate(item.printFinalAsset.createdAt)}</div>
                                  <div>
                                    <a href={item.printFinalAsset.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      Ladda ner
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGeneratePrintFinal(item.id, item.fulfillment?.id)}
                                  disabled={generateFinalLoading === item.id || !item.printAsset?.upscaleFactor}
                                  className="mt-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                  title={!item.printAsset?.upscaleFactor ? 'Generera tryckfil (PRINT) först' : ''}
                                >
                                  {generateFinalLoading === item.id ? (
                                    <><span className="animate-spin">⏳</span> Renderar slutgiltig…</>
                                  ) : (
                                    <>🎨 Rendera slutgiltig tryckfil</>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Fulfillment */}
                            {item.fulfillment && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FULFILLMENT_COLORS[item.fulfillment.status] || 'bg-gray-100'}`}>
                                      {item.fulfillment.status}
                                    </span>
                                    {item.fulfillment.partner && (
                                      <span className="text-xs text-gray-500">via {item.fulfillment.partner.name}</span>
                                    )}
                                    {item.fulfillment.trackingNumber && (
                                      <span className="text-xs font-mono text-gray-500">
                                        {item.fulfillment.trackingUrl ? (
                                          <a href={item.fulfillment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {item.fulfillment.trackingNumber}
                                          </a>
                                        ) : item.fulfillment.trackingNumber}
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    {item.fulfillment.status === 'QUEUED' && (
                                      <button
                                        onClick={() => handleAction('IN_PRODUCTION', item.fulfillment!.id)}
                                        disabled={actionLoading === item.fulfillment.id}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                      >
                                        {actionLoading === item.fulfillment.id ? '…' : '→ Produktion'}
                                      </button>
                                    )}

                                    {item.fulfillment.status === 'IN_PRODUCTION' && (
                                      <>
                                        {trackingForm?.fulfillmentId === item.fulfillment.id ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="text"
                                              placeholder="Transportör"
                                              value={trackingForm.carrier}
                                              onChange={e => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                                              className="w-20 px-1.5 py-1 text-xs border rounded"
                                            />
                                            <input
                                              type="text"
                                              placeholder="Spårningsnr"
                                              value={trackingForm.trackingNumber}
                                              onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                              className="w-24 px-1.5 py-1 text-xs border rounded"
                                            />
                                            <input
                                              type="text"
                                              placeholder="URL"
                                              value={trackingForm.trackingUrl}
                                              onChange={e => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                                              className="w-32 px-1.5 py-1 text-xs border rounded"
                                            />
                                            <button
                                              onClick={() => handleAction('SHIPPED', item.fulfillment!.id, {
                                                carrier: trackingForm.carrier,
                                                trackingNumber: trackingForm.trackingNumber,
                                                trackingUrl: trackingForm.trackingUrl,
                                              })}
                                              disabled={actionLoading === item.fulfillment!.id}
                                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                            >
                                              {actionLoading === item.fulfillment!.id ? '…' : 'Skicka'}
                                            </button>
                                            <button
                                              onClick={() => setTrackingForm(null)}
                                              className="px-1.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setTrackingForm({
                                              fulfillmentId: item.fulfillment!.id,
                                              carrier: '',
                                              trackingNumber: '',
                                              trackingUrl: '',
                                            })}
                                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                          >
                                            → Skickad
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {item.fulfillment.status === 'SHIPPED' && (
                                      <button
                                        onClick={() => handleAction('DELIVERED', item.fulfillment!.id)}
                                        disabled={actionLoading === item.fulfillment.id}
                                        className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                      >
                                        {actionLoading === item.fulfillment.id ? '…' : '→ Levererad'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
