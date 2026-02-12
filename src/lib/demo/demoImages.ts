import { StylePreset } from '@/types/design'

const DEMO_IMAGES: Record<string, string[]> = {
  nordic: [
    '/assets/demo/nordic-1.svg',
    '/assets/demo/nordic-2.svg',
    '/assets/demo/nordic-1.svg',
    '/assets/demo/nordic-2.svg',
  ],
  retro: [
    '/assets/demo/retro-1.svg',
    '/assets/demo/retro-2.svg',
    '/assets/demo/retro-1.svg',
    '/assets/demo/retro-2.svg',
  ],
  minimal: [
    '/assets/demo/minimal-1.svg',
    '/assets/demo/minimal-2.svg',
    '/assets/demo/minimal-1.svg',
    '/assets/demo/minimal-2.svg',
  ],
  abstract: [
    '/assets/demo/abstract-1.svg',
    '/assets/demo/abstract-2.svg',
    '/assets/demo/abstract-1.svg',
    '/assets/demo/abstract-2.svg',
  ],
  botanical: [
    '/assets/demo/botanical-1.svg',
    '/assets/demo/botanical-2.svg',
    '/assets/demo/botanical-1.svg',
    '/assets/demo/botanical-2.svg',
  ],
  geometric: [
    '/assets/demo/abstract-1.svg',
    '/assets/demo/minimal-1.svg',
    '/assets/demo/abstract-2.svg',
    '/assets/demo/minimal-2.svg',
  ],
  watercolor: [
    '/assets/demo/botanical-1.svg',
    '/assets/demo/nordic-1.svg',
    '/assets/demo/botanical-2.svg',
    '/assets/demo/nordic-2.svg',
  ],
  'line-art': [
    '/assets/demo/minimal-1.svg',
    '/assets/demo/minimal-2.svg',
    '/assets/demo/botanical-1.svg',
    '/assets/demo/botanical-2.svg',
  ],
  photography: [
    '/assets/demo/nordic-1.svg',
    '/assets/demo/nordic-2.svg',
    '/assets/demo/retro-1.svg',
    '/assets/demo/retro-2.svg',
  ],
  typographic: [
    '/assets/demo/minimal-1.svg',
    '/assets/demo/retro-1.svg',
    '/assets/demo/minimal-2.svg',
    '/assets/demo/retro-2.svg',
  ],
  'pop-art': [
    '/assets/demo/retro-1.svg',
    '/assets/demo/abstract-1.svg',
    '/assets/demo/retro-2.svg',
    '/assets/demo/abstract-2.svg',
  ],
  japanese: [
    '/assets/demo/botanical-1.svg',
    '/assets/demo/minimal-1.svg',
    '/assets/demo/botanical-2.svg',
    '/assets/demo/minimal-2.svg',
  ],
}

export const DEMO_ROOM_IMAGE = '/assets/demo/room-sample.svg'

export function isDemoMode(): boolean {
  return !process.env.OPENAI_API_KEY
}

export function getDemoVariants(style: StylePreset) {
  const images = DEMO_IMAGES[style] || DEMO_IMAGES.minimal

  return images.map((url, i) => ({
    id: `demo-variant-${style}-${i + 1}`,
    imageUrl: url,
    thumbnailUrl: url,
    isSelected: false,
    seed: 1000 + i,
  }))
}

export function getDemoFinalRender(style: StylePreset): string {
  const images = DEMO_IMAGES[style] || DEMO_IMAGES.minimal
  return images[0]
}
