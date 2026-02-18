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
  'art-deco': [
    '/assets/demo/art-deco-1.svg',
    '/assets/demo/abstract-1.svg',
    '/assets/demo/art-deco-1.svg',
    '/assets/demo/minimal-1.svg',
  ],
  surreal: [
    '/assets/demo/surreal-1.svg',
    '/assets/demo/abstract-2.svg',
    '/assets/demo/surreal-1.svg',
    '/assets/demo/botanical-1.svg',
  ],
  graffiti: [
    '/assets/demo/graffiti-1.svg',
    '/assets/demo/retro-2.svg',
    '/assets/demo/graffiti-1.svg',
    '/assets/demo/abstract-1.svg',
  ],
  pastel: [
    '/assets/demo/pastel-1.svg',
    '/assets/demo/botanical-1.svg',
    '/assets/demo/pastel-1.svg',
    '/assets/demo/minimal-2.svg',
  ],
  'dark-moody': [
    '/assets/demo/dark-moody-1.svg',
    '/assets/demo/retro-2.svg',
    '/assets/demo/dark-moody-1.svg',
    '/assets/demo/nordic-2.svg',
  ],
  'mid-century': [
    '/assets/demo/mid-century-1.svg',
    '/assets/demo/retro-1.svg',
    '/assets/demo/mid-century-1.svg',
    '/assets/demo/abstract-2.svg',
  ],
}

export const DEMO_ROOM_IMAGE = '/assets/demo/room-sample.svg'

/**
 * Pre-defined wall corners for the demo room SVG.
 * Matches the back wall area (above sofa, below crown molding).
 * Coordinates are normalized 0–1 relative to the SVG viewBox (150 60 900 480).
 * Order: [topLeft, topRight, bottomRight, bottomLeft]
 */
export const DEMO_WALL_CORNERS = [
  { x: 0.07, y: 0.10 },   // top-left  (wall x=200 → (200-150)/900 ≈ 0.056, y=108 → (108-60)/480 ≈ 0.10)
  { x: 0.93, y: 0.10 },   // top-right (wall x=1000 → (1000-150)/900 ≈ 0.944)
  { x: 0.93, y: 0.73 },   // bottom-right (sofa top y=370 → (370-60)/480 ≈ 0.646, with margin ≈ 0.73)
  { x: 0.07, y: 0.73 },   // bottom-left
]

export function isDemoMode(): boolean {
  return !process.env.REPLICATE_API_TOKEN && !process.env.OPENAI_API_KEY
}

export function getDemoVariants(style: StylePreset) {
  const images = DEMO_IMAGES[style] || DEMO_IMAGES.minimal
  const ts = Date.now()

  return images.map((url, i) => ({
    id: `demo-var-${ts}-${style}-${i}`,
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
