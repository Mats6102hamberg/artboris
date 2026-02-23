'use client'

import { useState, useEffect, useCallback } from 'react'

interface ListingReview {
  id: string
  title: string
  description: string
  technique: string
  category: string
  imageUrl: string
  thumbnailUrl: string
  artistPriceSEK: number
  isOriginal: boolean
  reviewStatus: string
  isPublic: boolean
  aiChecked: boolean
  faceDetected: boolean
  safetyFlag: boolean
  createdAt: string
  artist: {
    id: string
    displayName: string
    email: string
  }
}

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all'

const STATUS_COLORS: Record<string, string> = {
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  NEEDS_REVIEW: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminReviewsPage() {
  const [listings, setListings] = useState<ListingReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`)
      const data = await res.json()
      if (data.success) setListings(data.listings)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchListings()
  }, [fetchListings])

  const handleAction = async (listingId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(listingId)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          action,
          rejectReason: action === 'REJECT' ? rejectReason : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setRejectReason('')
        setExpandedId(null)
        await fetchListings()
      } else {
        alert(data.error || 'Något gick fel')
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleHardDelete = async (listingId: string) => {
    setActionLoading(listingId)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (data.success) {
        setDeleteConfirmId(null)
        await fetchListings()
      } else {
        alert(data.error || 'Kunde inte radera')
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = listings.length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/orders" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Ordrar</a>
            <h1 className="text-xl font-bold text-gray-900">Admin — Granskning</h1>
            {filter === 'pending' && pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {pendingCount} väntar
              </span>
            )}
          </div>
          <button
            onClick={() => { setLoading(true); fetchListings() }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Uppdatera
          </button>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                filter === s ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'pending' ? 'Väntar' : s === 'approved' ? 'Godkända' : s === 'rejected' ? 'Avvisade' : 'Alla'}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {filter === 'pending' ? 'Inga konstverk väntar på granskning.' : 'Inga konstverk att visa.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  <img
                    src={listing.thumbnailUrl || listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[listing.reviewStatus] || 'bg-gray-100'}`}>
                      {listing.reviewStatus}
                    </span>
                    {listing.isOriginal && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Original
                      </span>
                    )}
                  </div>
                  {/* Flags */}
                  {(listing.faceDetected || listing.safetyFlag) && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {listing.faceDetected && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Ansikten
                        </span>
                      )}
                      {listing.safetyFlag && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Flaggad
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    av {listing.artist.displayName} · {listing.technique} · {listing.category}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    {listing.artistPriceSEK.toLocaleString('sv-SE')} kr
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(listing.createdAt)}</p>

                  {listing.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{listing.description}</p>
                  )}

                  {/* Actions */}
                  {(listing.reviewStatus === 'PROCESSING' || listing.reviewStatus === 'NEEDS_REVIEW') && (
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(listing.id, 'APPROVE')}
                          disabled={actionLoading === listing.id}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {actionLoading === listing.id ? '...' : 'Godkänn'}
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === listing.id ? null : listing.id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          Avvisa
                        </button>
                      </div>

                      {expandedId === listing.id && (
                        <div className="space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Anledning (valfritt)..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-200"
                          />
                          <button
                            onClick={() => handleAction(listing.id, 'REJECT')}
                            disabled={actionLoading === listing.id}
                            className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {actionLoading === listing.id ? '...' : 'Bekräfta avvisning'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {listing.reviewStatus === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(listing.id, 'REJECT')}
                      disabled={actionLoading === listing.id}
                      className="mt-4 w-full px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors font-medium"
                    >
                      {actionLoading === listing.id ? '...' : 'Ta bort från galleri'}
                    </button>
                  )}

                  {listing.reviewStatus === 'REJECTED' && (
                    <button
                      onClick={() => handleAction(listing.id, 'APPROVE')}
                      disabled={actionLoading === listing.id}
                      className="mt-4 w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Ångra — Godkänn ändå
                    </button>
                  )}

                  {/* Hard delete — alla statusar */}
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    {deleteConfirmId === listing.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-600 font-medium">Radera permanent? Detta kan inte ångras.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleHardDelete(listing.id)}
                            disabled={actionLoading === listing.id}
                            className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {actionLoading === listing.id ? '...' : 'Ja, radera'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(listing.id)}
                        className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Radera permanent
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
