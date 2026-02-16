import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/designs/generate/route'
import { NextRequest } from 'next/server'

// Mock services
vi.mock('@/server/services/ai/generatePreview', () => ({
  generatePreview: vi.fn(),
}))

vi.mock('@/server/services/usage/dailyUsage', () => ({
  getUsage: vi.fn(),
  incrementGeneration: vi.fn(),
}))

vi.mock('@/lib/prompts/styles', () => ({
  getStyleDefinition: vi.fn(),
}))

import { generatePreview } from '@/server/services/ai/generatePreview'
import { getUsage, incrementGeneration } from '@/server/services/usage/dailyUsage'
import { getStyleDefinition } from '@/lib/prompts/styles'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/designs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/designs/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUsage).mockResolvedValue({
      generationsUsed: 0,
      generationsRemaining: 50,
      generationsLimit: 50,
      refinesUsed: 0,
      refinesLimit: 0,
      canGenerate: true,
      canRefine: false,
      date: '2026-02-16',
    })
    vi.mocked(incrementGeneration).mockResolvedValue({ allowed: true, remaining: 49 })
    vi.mocked(getStyleDefinition).mockReturnValue({
      id: 'nordic',
      label: 'Nordisk',
      description: 'Test',
      previewUrl: '',
      promptPrefix: 'nordic style',
      defaultMood: 'calm',
      defaultColors: ['#FFF', '#000'],
    })
  })

  it('returns 429 when quota is exceeded', async () => {
    vi.mocked(getUsage).mockResolvedValue({
      generationsUsed: 50,
      generationsRemaining: 0,
      generationsLimit: 50,
      refinesUsed: 0,
      refinesLimit: 0,
      canGenerate: false,
      canRefine: false,
      date: '2026-02-16',
    })

    const res = await POST(makeRequest({ style: 'nordic' }))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.quotaExceeded).toBe(true)
  })

  it('returns 400 when style is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Style is required')
  })

  it('returns 400 when style is unknown', async () => {
    vi.mocked(getStyleDefinition).mockReturnValue(undefined as any)
    const res = await POST(makeRequest({ style: 'unknown_style' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Unknown style')
  })

  it('calls generatePreview for txt2img (no inputImageUrl)', async () => {
    vi.mocked(generatePreview).mockResolvedValue({
      success: true,
      variants: [{ id: 'v1', imageUrl: 'http://img.test/1.webp', thumbnailUrl: 'http://img.test/1.webp', seed: 123, isSelected: false, createdAt: '' }],
      prompt: 'nordic style',
      designId: 'design_1',
    })

    const res = await POST(makeRequest({ style: 'nordic', userDescription: 'forest' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.designId).toBe('design_1')

    expect(generatePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'nordic',
        inputImageUrl: undefined,
      })
    )
  })

  it('passes inputImageUrl and promptStrength for img2img', async () => {
    vi.mocked(generatePreview).mockResolvedValue({
      success: true,
      variants: [{ id: 'v1', imageUrl: 'http://img.test/1.webp', thumbnailUrl: 'http://img.test/1.webp', seed: 123, isSelected: false, createdAt: '' }],
      prompt: 'nordic style',
      designId: 'design_2',
    })

    const res = await POST(makeRequest({
      style: 'nordic',
      inputImageUrl: 'https://blob.test/photo.jpg',
      promptStrength: 0.75,
    }))
    expect(res.status).toBe(200)

    expect(generatePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        inputImageUrl: 'https://blob.test/photo.jpg',
        promptStrength: 0.75,
      })
    )
  })

  it('returns 500 when generatePreview fails', async () => {
    vi.mocked(generatePreview).mockResolvedValue({
      success: false,
      variants: [],
      prompt: 'nordic style',
      error: 'Replicate API error',
    })

    const res = await POST(makeRequest({ style: 'nordic' }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('Replicate API error')
  })

  it('increments usage after successful generation', async () => {
    vi.mocked(generatePreview).mockResolvedValue({
      success: true,
      variants: [{ id: 'v1', imageUrl: 'http://test/1.webp', thumbnailUrl: 'http://test/1.webp', seed: 1, isSelected: false, createdAt: '' }],
      prompt: 'test',
      designId: 'design_3',
    })

    await POST(makeRequest({ style: 'nordic' }))
    expect(incrementGeneration).toHaveBeenCalledWith('anon_test_123')
  })
})
