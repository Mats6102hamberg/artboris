import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must use vi.hoisted so the variable is available inside vi.mock (which gets hoisted)
const { mockRun } = vi.hoisted(() => ({
  mockRun: vi.fn(),
}))

vi.mock('replicate', () => {
  return {
    default: class MockReplicate {
      run = mockRun
    },
  }
})

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
}))

vi.mock('@/lib/demo/demoImages', () => ({
  isDemoMode: vi.fn(),
  getDemoVariants: vi.fn(),
}))

vi.mock('@/lib/prompts/templates', () => ({
  buildGeneratePrompt: vi.fn(),
}))

vi.mock('@/lib/prompts/safety', () => ({
  checkPromptSafety: vi.fn(),
}))

import { generatePreview } from '@/server/services/ai/generatePreview'
import { isDemoMode, getDemoVariants } from '@/lib/demo/demoImages'
import { checkPromptSafety } from '@/lib/prompts/safety'
import { buildGeneratePrompt } from '@/lib/prompts/templates'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

describe('generatePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildGeneratePrompt).mockReturnValue({ prompt: 'test prompt for art', negativePrompt: undefined })
  })

  it('returns demo variants in demo mode', async () => {
    vi.mocked(isDemoMode).mockReturnValue(true)
    vi.mocked(getDemoVariants).mockReturnValue([
      { id: 'demo_1', imageUrl: '/assets/demo/nordic-1.svg', thumbnailUrl: '/assets/demo/nordic-1.svg', seed: 0, isSelected: false },
      { id: 'demo_2', imageUrl: '/assets/demo/nordic-2.svg', thumbnailUrl: '/assets/demo/nordic-2.svg', seed: 0, isSelected: false },
    ])
    vi.mocked(prisma.design.create).mockResolvedValue({ id: 'design_demo' } as any)

    const result = await generatePreview({
      style: 'nordic',
      controls: { colorPalette: ['#FFF'], mood: 'calm', contrast: 50, brightness: 50, saturation: 50, zoom: 100, textOverlay: '', textFont: '', textPosition: 'none' },
    })

    expect(result.success).toBe(true)
    expect(result.variants).toHaveLength(2)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('returns error when prompt safety check fails', async () => {
    vi.mocked(isDemoMode).mockReturnValue(false)
    vi.mocked(checkPromptSafety).mockReturnValue({
      safe: false,
      reason: 'Blocked content',
      blockedTerm: 'violence',
    })

    const result = await generatePreview({
      style: 'nordic',
      controls: { colorPalette: ['#FFF'], mood: 'calm', contrast: 50, brightness: 50, saturation: 50, zoom: 100, textOverlay: '', textFont: '', textPosition: 'none' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Blocked content')
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('uses flux-schnell for txt2img (no inputImageUrl)', async () => {
    vi.mocked(isDemoMode).mockReturnValue(false)
    vi.mocked(checkPromptSafety).mockReturnValue({ safe: true })
    mockRun.mockResolvedValue(['https://replicate.delivery/test.webp'])
    vi.mocked(put).mockResolvedValue({ url: 'https://blob.test/preview.webp' } as any)
    vi.mocked(prisma.design.create).mockResolvedValue({ id: 'design_txt2img' } as any)

    const result = await generatePreview({
      style: 'nordic',
      controls: { colorPalette: ['#FFF'], mood: 'calm', contrast: 50, brightness: 50, saturation: 50, zoom: 100, textOverlay: '', textFont: '', textPosition: 'none' },
      count: 1,
    })

    expect(result.success).toBe(true)
    expect(mockRun).toHaveBeenCalledWith(
      'black-forest-labs/flux-schnell',
      expect.objectContaining({
        input: expect.not.objectContaining({ image: expect.anything() }),
      })
    )
  })

  it('uses flux-dev for img2img with image and prompt_strength', async () => {
    vi.mocked(isDemoMode).mockReturnValue(false)
    vi.mocked(checkPromptSafety).mockReturnValue({ safe: true })
    mockRun.mockResolvedValue(['https://replicate.delivery/transformed.webp'])
    vi.mocked(put).mockResolvedValue({ url: 'https://blob.test/transformed.webp' } as any)
    vi.mocked(prisma.design.create).mockResolvedValue({ id: 'design_img2img' } as any)

    const result = await generatePreview({
      style: 'nordic',
      controls: { colorPalette: ['#FFF'], mood: 'calm', contrast: 50, brightness: 50, saturation: 50, zoom: 100, textOverlay: '', textFont: '', textPosition: 'none' },
      count: 1,
      inputImageUrl: 'https://blob.test/photo.jpg',
      promptStrength: 0.75,
    })

    expect(result.success).toBe(true)
    expect(mockRun).toHaveBeenCalledWith(
      'black-forest-labs/flux-dev',
      expect.objectContaining({
        input: expect.objectContaining({
          image: 'https://blob.test/photo.jpg',
          prompt_strength: 0.75,
        }),
      })
    )
  })

  it('uses default promptStrength 0.65 when not specified', async () => {
    vi.mocked(isDemoMode).mockReturnValue(false)
    vi.mocked(checkPromptSafety).mockReturnValue({ safe: true })
    mockRun.mockResolvedValue(['https://replicate.delivery/test.webp'])
    vi.mocked(put).mockResolvedValue({ url: 'https://blob.test/out.webp' } as any)
    vi.mocked(prisma.design.create).mockResolvedValue({ id: 'd1' } as any)

    await generatePreview({
      style: 'nordic',
      controls: { colorPalette: ['#FFF'], mood: 'calm', contrast: 50, brightness: 50, saturation: 50, zoom: 100, textOverlay: '', textFont: '', textPosition: 'none' },
      count: 1,
      inputImageUrl: 'https://blob.test/photo.jpg',
    })

    expect(mockRun).toHaveBeenCalledWith(
      'black-forest-labs/flux-dev',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt_strength: 0.65,
        }),
      })
    )
  })
})
