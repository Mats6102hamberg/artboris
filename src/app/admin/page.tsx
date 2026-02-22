'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  orders: { total: number; pending: number; revenue: number }
  marketOrders: { total: number; pending: number; revenue: number }
  listings: { total: number; pendingReview: number; published: number }
  users: { total: number; artists: number }
  recentErrors: number
}

function StatCard({ label, value, sub, color = 'gray' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-white border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color] || colors.gray}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function formatSEK(cents: number) {
  return `${Math.round(cents / 100).toLocaleString('sv-SE')} kr`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Översikt av allt som händer i Artboris</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Laddar statistik...</span>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Revenue */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Intäkter</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Poster Lab"
                value={formatSEK(stats.orders.revenue)}
                sub={`${stats.orders.total} ordrar`}
                color="green"
              />
              <StatCard
                label="Art Market"
                value={formatSEK(stats.marketOrders.revenue)}
                sub={`${stats.marketOrders.total} ordrar`}
                color="blue"
              />
              <StatCard
                label="Totalt"
                value={formatSEK(stats.orders.revenue + stats.marketOrders.revenue)}
                color="purple"
              />
              <StatCard
                label="Väntande ordrar"
                value={stats.orders.pending + stats.marketOrders.pending}
                sub="Behöver åtgärd"
                color={stats.orders.pending + stats.marketOrders.pending > 0 ? 'amber' : 'gray'}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Innehåll</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Publicerade verk" value={stats.listings.published} color="green" />
              <StatCard
                label="Väntar granskning"
                value={stats.listings.pendingReview}
                color={stats.listings.pendingReview > 0 ? 'amber' : 'gray'}
              />
              <StatCard label="Totalt verk" value={stats.listings.total} />
              <StatCard
                label="Fel (24h)"
                value={stats.recentErrors}
                color={stats.recentErrors > 0 ? 'red' : 'gray'}
              />
            </div>
          </div>

          {/* Users */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Användare</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Totalt användare" value={stats.users.total} />
              <StatCard label="Konstnärer" value={stats.users.artists} color="purple" />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Snabblänkar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Granska verk', href: '/admin/reviews', count: stats.listings.pendingReview },
                { label: 'Poster-ordrar', href: '/admin/orders', count: stats.orders.pending },
                { label: 'Market-ordrar', href: '/admin/market-orders', count: stats.marketOrders.pending },
                { label: 'Art Scanner', href: '/admin/scanner', count: null },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-sm"
                >
                  <span className="font-medium text-gray-700">{link.label}</span>
                  {link.count != null && link.count > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      {link.count}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Kunde inte ladda statistik.</p>
      )}
    </div>
  )
}
