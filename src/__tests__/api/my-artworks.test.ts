import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, PUT, DELETE } from '@/app/api/my-artworks/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function makeRequest(method: string, body?: unknown) {
  return new NextRequest('http://localhost:3000/api/my-artworks', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/my-artworks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns all artworks', async () => {
    const mockArtworks = [
      { id: '1', title: 'Art 1', price: 5000, status: 'tillgänglig' },
      { id: '2', title: 'Art 2', price: 8000, status: 'tillgänglig' },
    ]
    vi.mocked(prisma.artwork.findMany).mockResolvedValue(mockArtworks as any)

    const res = await GET()
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.artworks).toHaveLength(2)
    expect(data.total).toBe(2)
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.artwork.findMany).mockRejectedValue(new Error('DB down'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/my-artworks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates artwork with status tillgänglig', async () => {
    const newArtwork = {
      id: '3',
      title: 'New Art',
      artist: 'Test',
      description: 'A test',
      price: 3000,
      category: 'målning',
      year: 2026,
      status: 'tillgänglig',
    }
    vi.mocked(prisma.artwork.create).mockResolvedValue(newArtwork as any)

    const res = await POST(makeRequest('POST', {
      title: 'New Art',
      artist: 'Test',
      description: 'A test',
      price: 3000,
      category: 'målning',
      year: 2026,
    }))
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(prisma.artwork.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'tillgänglig' }),
    })
  })
})

describe('PUT /api/my-artworks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates artwork successfully', async () => {
    vi.mocked(prisma.artwork.update).mockResolvedValue({ id: '1', title: 'Updated' } as any)

    const res = await PUT(makeRequest('PUT', { id: '1', title: 'Updated' }))
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 404 when artwork not found (P2025)', async () => {
    const error = new Error('Not found') as any
    error.code = 'P2025'
    vi.mocked(prisma.artwork.update).mockRejectedValue(error)

    const res = await PUT(makeRequest('PUT', { id: 'nonexistent', title: 'X' }))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/my-artworks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes artwork successfully', async () => {
    vi.mocked(prisma.artwork.delete).mockResolvedValue({} as any)

    const res = await DELETE(makeRequest('DELETE', { id: '1' }))
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 404 when artwork not found (P2025)', async () => {
    const error = new Error('Not found') as any
    error.code = 'P2025'
    vi.mocked(prisma.artwork.delete).mockRejectedValue(error)

    const res = await DELETE(makeRequest('DELETE', { id: 'nonexistent' }))
    expect(res.status).toBe(404)
  })
})
