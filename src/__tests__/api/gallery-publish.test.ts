import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, DELETE } from '@/app/api/gallery/publish/route'
import { NextRequest } from 'next/server'

vi.mock('@/server/services/gallery/publish', () => ({
  publishToGallery: vi.fn(),
  unpublishFromGallery: vi.fn(),
}))

import { publishToGallery, unpublishFromGallery } from '@/server/services/gallery/publish'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/gallery/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/gallery/publish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when designId is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('designId')
  })

  it('calls publishToGallery with correct params', async () => {
    vi.mocked(publishToGallery).mockResolvedValue({ success: true, designId: 'd1' })
    const res = await POST(makeRequest({ designId: 'd1' }))
    const data = await res.json()

    expect(publishToGallery).toHaveBeenCalledWith({ designId: 'd1', userId: 'anon_test_123' })
    expect(data.success).toBe(true)
  })

  it('returns error from service', async () => {
    vi.mocked(publishToGallery).mockResolvedValue({ success: false, error: 'Not found' })
    const res = await POST(makeRequest({ designId: 'd1' }))
    const data = await res.json()

    expect(data.success).toBe(false)
    expect(data.error).toBe('Not found')
  })
})

describe('DELETE /api/gallery/publish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when designId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/gallery/publish', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('calls unpublishFromGallery with correct params', async () => {
    vi.mocked(unpublishFromGallery).mockResolvedValue({ success: true, designId: 'd1' })
    const req = new NextRequest('http://localhost:3000/api/gallery/publish', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId: 'd1' }),
    })
    const res = await DELETE(req)
    const data = await res.json()

    expect(unpublishFromGallery).toHaveBeenCalledWith('d1', 'anon_test_123')
    expect(data.success).toBe(true)
  })
})
