'use client'

import { useState, useEffect, useRef } from 'react'
import { MARKET_CATEGORIES, MARKET_TECHNIQUES, formatPriceSEK } from '@/lib/pricing/market'

interface ArtistData {
  id: string
  email: string
  displayName: string
  accessToken: string
}

interface Listing {
  id: string
  title: string
  imageUrl: string
  artistPriceSEK: number
  isPublished: boolean
  isSold: boolean
  views: number
  tryOnWallCount: number
  printsSold: number
  createdAt: string
}

type View = 'login' | 'register' | 'dashboard'

export default function ArtistPage() {
  const [view, setView] = useState<View>('login')
  const [artist, setArtist] = useState<ArtistData | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  // Registration form
  const [regForm, setRegForm] = useState({
    email: '',
    displayName: '',
    bio: '',
    website: '',
    instagram: '',
    phone: '',
    bankAccount: '',
    orgNumber: '',
  })

  // Login form
  const [loginEmail, setLoginEmail] = useState('')

  // Upload form
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    technique: '',
    category: 'painting',
    year: '',
    widthCm: '',
    heightCm: '',
    artistPriceSEK: '',
    isOriginal: false,
    maxPrints: '',
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('artboris_artist_token')
    const savedArtist = localStorage.getItem('artboris_artist_data')
    if (savedToken && savedArtist) {
      try {
        setArtist(JSON.parse(savedArtist))
        setView('dashboard')
      } catch {
        localStorage.removeItem('artboris_artist_token')
        localStorage.removeItem('artboris_artist_data')
      }
    }
  }, [])

  // Fetch listings when on dashboard
  useEffect(() => {
    if (view === 'dashboard' && artist) {
      fetchListings()
    }
  }, [view, artist])

  const fetchListings = async () => {
    if (!artist) return
    setLoading(true)
    try {
      const res = await fetch(`/api/market/listings?artistId=${artist.id}`)
      const data = await res.json()
      setListings(data.listings || [])
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/market/artist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      })
      const data = await res.json()
      if (data.success) {
        const artistData = data.artist
        setArtist(artistData)
        localStorage.setItem('artboris_artist_token', artistData.accessToken)
        localStorage.setItem('artboris_artist_data', JSON.stringify(artistData))
        setView('dashboard')
      } else {
        alert(data.error || 'Registrering misslyckades')
        if (data.accessToken) {
          // Already exists — auto-login
          const artistData = { id: '', email: regForm.email, displayName: regForm.displayName, accessToken: data.accessToken }
          setArtist(artistData)
          localStorage.setItem('artboris_artist_token', data.accessToken)
          localStorage.setItem('artboris_artist_data', JSON.stringify(artistData))
          setView('dashboard')
        }
      }
    } catch (err) {
      alert('Nätverksfel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/market/artist/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })
      const data = await res.json()
      if (data.success) {
        const artistData = data.artist
        setArtist(artistData)
        localStorage.setItem('artboris_artist_token', artistData.accessToken)
        localStorage.setItem('artboris_artist_data', JSON.stringify(artistData))
        setView('dashboard')
      } else {
        alert(data.error || 'Inloggning misslyckades')
      }
    } catch (err) {
      alert('Nätverksfel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      setUploadPreview(URL.createObjectURL(file))
    }
  }

  const handleUploadListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artist || !uploadFile) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', uploadFile)
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('technique', uploadForm.technique)
      formData.append('category', uploadForm.category)
      if (uploadForm.year) formData.append('year', uploadForm.year)
      if (uploadForm.widthCm) formData.append('widthCm', uploadForm.widthCm)
      if (uploadForm.heightCm) formData.append('heightCm', uploadForm.heightCm)
      formData.append('artistPriceSEK', uploadForm.artistPriceSEK)
      formData.append('isOriginal', String(uploadForm.isOriginal))
      if (uploadForm.maxPrints) formData.append('maxPrints', uploadForm.maxPrints)

      const res = await fetch('/api/market/listings', {
        method: 'POST',
        headers: { 'x-artist-token': artist.accessToken },
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setShowUpload(false)
        setUploadFile(null)
        setUploadPreview(null)
        setUploadForm({
          title: '', description: '', technique: '', category: 'painting',
          year: '', widthCm: '', heightCm: '', artistPriceSEK: '',
          isOriginal: false, maxPrints: '',
        })
        fetchListings()
      } else {
        alert(data.error || 'Uppladdning misslyckades')
      }
    } catch (err) {
      alert('Nätverksfel. Försök igen.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!artist || !confirm('Vill du verkligen ta bort detta konstverk?')) return
    try {
      const res = await fetch(`/api/market/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'x-artist-token': artist.accessToken },
      })
      if (res.ok) {
        fetchListings()
      }
    } catch (err) {
      alert('Kunde inte ta bort.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('artboris_artist_token')
    localStorage.removeItem('artboris_artist_data')
    setArtist(null)
    setView('login')
  }

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <a href="/market" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
              Artboris
            </a>
            <h1 className="text-3xl font-light text-gray-900 mt-4">Konstnärsportal</h1>
            <p className="text-gray-500 mt-2">Logga in för att hantera dina konstverk</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                placeholder="din@email.se"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Ny konstnär?{' '}
              <button onClick={() => setView('register')} className="text-gray-900 font-medium hover:underline">
                Registrera dig
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- REGISTER VIEW ---
  if (view === 'register') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <a href="/market" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
              Artboris
            </a>
            <h1 className="text-3xl font-light text-gray-900 mt-4">Bli konstnär på Artboris</h1>
            <p className="text-gray-500 mt-2">Sälj din konst direkt till köpare som kan prova verket på sin vägg</p>
          </div>

          {/* Terms box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-amber-900 mb-2">Villkor — 50/50 vinstdelning</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Du sätter priset för ditt konstverk</li>
              <li>• 50% av konstverkspriset går till dig, 50% till Artboris</li>
              <li>• Artboris hanterar tryck, ramsättning och leverans</li>
              <li>• Tryck- och ramkostnad läggs på köparens pris (du behöver inte betala)</li>
              <li>• Utbetalning sker månadsvis till ditt bankkonto</li>
            </ul>
          </div>

          <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Visningsnamn *</label>
                <input
                  type="text"
                  required
                  value={regForm.displayName}
                  onChange={e => setRegForm({ ...regForm, displayName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="Ditt konstnärsnamn"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="din@email.se"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Om dig</label>
                <textarea
                  value={regForm.bio}
                  onChange={e => setRegForm({ ...regForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 resize-none"
                  placeholder="Berätta kort om dig och din konst..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hemsida</label>
                <input
                  type="url"
                  value={regForm.website}
                  onChange={e => setRegForm({ ...regForm, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  value={regForm.instagram}
                  onChange={e => setRegForm({ ...regForm, instagram: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="@dittnamn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="070-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bankkonto (för utbetalning)</label>
                <input
                  type="text"
                  value={regForm.bankAccount}
                  onChange={e => setRegForm({ ...regForm, bankAccount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  placeholder="Clearingnr + kontonr"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <input type="checkbox" required className="mt-1 w-4 h-4 accent-gray-900" />
              <p className="text-sm text-gray-600">
                Jag godkänner <strong>50/50 vinstdelning</strong> och att Artboris hanterar tryck, ramsättning och leverans mot en separat kostnad som läggs på köparens pris.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registrerar...' : 'Registrera mig'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => setView('login')} className="text-gray-500 text-sm hover:text-gray-900">
              Redan registrerad? Logga in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- DASHBOARD VIEW ---
  const totalViews = listings.reduce((s, l) => s + l.views, 0)
  const totalTryOns = listings.reduce((s, l) => s + l.tryOnWallCount, 0)
  const totalSold = listings.reduce((s, l) => s + l.printsSold, 0)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/market" className="text-lg font-semibold tracking-widest uppercase text-gray-900">
            Artboris
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{artist?.displayName}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900">
              Logga ut
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Konstverk', value: listings.length },
            { label: 'Visningar', value: totalViews },
            { label: 'Provat på vägg', value: totalTryOns },
            { label: 'Sålda', value: totalSold },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-900">Mina konstverk</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ladda upp konstverk
          </button>
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-lg">Du har inga konstverk ännu.</p>
            <p className="text-gray-400 text-sm mt-2">Ladda upp ditt första konstverk för att börja sälja!</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Ladda upp konstverk
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-100 relative">
                  <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate text-sm">{listing.title}</h3>
                  <p className="text-sm text-gray-500">{formatPriceSEK(listing.artistPriceSEK)}</p>
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>{listing.views} visn.</span>
                    <span>{listing.tryOnWallCount} vägg</span>
                    <span>{listing.printsSold} sålda</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={`/market/${listing.id}`}
                      className="flex-1 text-center text-xs py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Visa
                    </a>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="text-xs py-1.5 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-gray-900">Ladda upp konstverk</h2>
                <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                  &times;
                </button>
              </div>

              <form onSubmit={handleUploadListing} className="space-y-4">
                {/* Image upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {uploadPreview ? (
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium">Byt bild</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-gray-400 transition-colors"
                    >
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-gray-500">Välj bild (max 50 MB)</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      value={uploadForm.category}
                      onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    >
                      {MARKET_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teknik</label>
                    <select
                      value={uploadForm.technique}
                      onChange={e => setUploadForm({ ...uploadForm, technique: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    >
                      <option value="">Välj...</option>
                      {MARKET_TECHNIQUES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pris (SEK) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={uploadForm.artistPriceSEK}
                    onChange={e => setUploadForm({ ...uploadForm, artistPriceSEK: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    placeholder="Ditt pris för konstverket"
                  />
                  {uploadForm.artistPriceSEK && (
                    <p className="text-xs text-gray-500 mt-1">
                      Du får {formatPriceSEK(Math.round(parseInt(uploadForm.artistPriceSEK) / 2))} per försäljning (50%)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bredd (cm)</label>
                    <input
                      type="number"
                      value={uploadForm.widthCm}
                      onChange={e => setUploadForm({ ...uploadForm, widthCm: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Höjd (cm)</label>
                    <input
                      type="number"
                      value={uploadForm.heightCm}
                      onChange={e => setUploadForm({ ...uploadForm, heightCm: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">År</label>
                    <input
                      type="number"
                      value={uploadForm.year}
                      onChange={e => setUploadForm({ ...uploadForm, year: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={uploadForm.isOriginal}
                    onChange={e => setUploadForm({ ...uploadForm, isOriginal: e.target.checked })}
                    className="w-4 h-4 accent-gray-900"
                  />
                  <label className="text-sm text-gray-700">Detta är ett original (säljs bara 1 gång)</label>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadForm.title || !uploadForm.artistPriceSEK}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Laddar upp...' : 'Publicera konstverk'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
