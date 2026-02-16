import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/designs/create-from-upload/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/designs/create-from-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/designs/create-from-upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when imageUrl is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Image URL')
  })

  it('creates design with user-upload style and nested variant', async () => {
    vi.mocked(prisma.design.create).mockResolvedValue({ id: 'design_upload_1' } as any)

    const res = await POST(makeRequest({
      imageUrl: 'https://blob.test/photo.jpg',
      roomImageUrl: 'https://blob.test/room.jpg',
      wallCorners: JSON.stringify([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]),
    }))
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.designId).toBe('design_upload_1')
    expect(prisma.design.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        style: 'user-upload',
        userId: 'anon_test_123',
        imageUrl: 'https://blob.test/photo.jpg',
        variants: {
          create: expect.objectContaining({
            imageUrl: 'https://blob.test/photo.jpg',
          }),
        },
      }),
    })
  })

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.design.create).mockRejectedValue(new Error('DB error'))

    const res = await POST(makeRequest({ imageUrl: 'https://test.com/img.jpg' }))
    expect(res.status).toBe(500)
  })
})
