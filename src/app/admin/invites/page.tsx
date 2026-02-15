'use client'

import { useState, useEffect } from 'react'

interface Invite {
  id: string
  code: string
  type: 'ARTIST' | 'PHOTOGRAPHER'
  note: string
  maxUses: number
  usedCount: number
  redeemedById: string | null
  redeemedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function AdminInvitesPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)

  // Create form
  const [createForm, setCreateForm] = useState({
    type: 'ARTIST' as 'ARTIST' | 'PHOTOGRAPHER',
    note: '',
    maxUses: 1,
    count: 1,
    expiresInDays: 30,
  })
  const [creating, setCreating] = useState(false)

  const fetchInvites = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invites', {
        headers: { 'x-admin-key': adminKey },
      })
      const data = await res.json()
      if (data.invites) {
        setInvites(data.invites)
        setAuthenticated(true)
      } else {
        alert('Fel admin-nyckel.')
      }
    } catch {
      alert('Nätverksfel.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (data.success) {
        fetchInvites()
        setCreateForm({ type: 'ARTIST', note: '', maxUses: 1, count: 1, expiresInDays: 30 })
      } else {
        alert(data.error || 'Kunde inte skapa.')
      }
    } catch {
      alert('Nätverksfel.')
    } finally {
      setCreating(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <h1 className="text-2xl font-light text-gray-900 text-center mb-6">Admin — Inbjudningar</h1>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              placeholder="Admin-nyckel"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
              onKeyDown={e => e.key === 'Enter' && fetchInvites()}
            />
            <button
              onClick={fetchInvites}
              disabled={loading || !adminKey}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Laddar...' : 'Logga in'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const unused = invites.filter(i => i.usedCount < i.maxUses)
  const used = invites.filter(i => i.usedCount >= i.maxUses)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Inbjudningskoder</h1>
          <a href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900">
            Ordrar →
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Create new */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Skapa nya inbjudningskoder</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Typ</label>
              <select
                value={createForm.type}
                onChange={e => setCreateForm({ ...createForm, type: e.target.value as 'ARTIST' | 'PHOTOGRAPHER' })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              >
                <option value="ARTIST">Konstnär</option>
                <option value="PHOTOGRAPHER">Fotograf</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notering</label>
              <input
                type="text"
                value={createForm.note}
                onChange={e => setCreateForm({ ...createForm, note: e.target.value })}
                placeholder="T.ex. namn"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Antal koder</label>
              <input
                type="number"
                min={1}
                max={50}
                value={createForm.count}
                onChange={e => setCreateForm({ ...createForm, count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Giltig (dagar)</label>
              <input
                type="number"
                min={1}
                value={createForm.expiresInDays}
                onChange={e => setCreateForm({ ...createForm, expiresInDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {creating ? 'Skapar...' : 'Skapa'}
              </button>
            </div>
          </div>
        </div>

        {/* Active codes */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Aktiva koder ({unused.length})
          </h2>
          {unused.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga aktiva koder.</p>
          ) : (
            <div className="grid gap-3">
              {unused.map(invite => (
                <div
                  key={invite.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <code className="text-lg font-mono font-bold text-gray-900 tracking-wider select-all">
                      {invite.code}
                    </code>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      invite.type === 'PHOTOGRAPHER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {invite.type === 'PHOTOGRAPHER' ? 'Fotograf' : 'Konstnär'}
                    </span>
                    {invite.note && (
                      <span className="text-sm text-gray-500">{invite.note}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{invite.usedCount}/{invite.maxUses} använd</span>
                    {invite.expiresAt && (
                      <span>
                        Utgår {new Date(invite.expiresAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invite.code)
                        alert(`Kopierad: ${invite.code}`)
                      }}
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                      title="Kopiera kod"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Used codes */}
        {used.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-500 mb-4">
              Använda koder ({used.length})
            </h2>
            <div className="grid gap-2">
              {used.map(invite => (
                <div
                  key={invite.id}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-between opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <code className="text-sm font-mono text-gray-500 line-through">
                      {invite.code}
                    </code>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      invite.type === 'PHOTOGRAPHER'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {invite.type === 'PHOTOGRAPHER' ? 'Fotograf' : 'Konstnär'}
                    </span>
                    {invite.note && (
                      <span className="text-sm text-gray-400">{invite.note}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {invite.redeemedAt && `Använd ${new Date(invite.redeemedAt).toLocaleDateString('sv-SE')}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
