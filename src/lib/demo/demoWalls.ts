export interface DemoWall {
  id: string
  labelKey: string
  imageUrl: string
  thumbnailUrl: string
  wallCorners: { x: number; y: number }[]
  emoji: string
}

export const DEMO_WALLS: DemoWall[] = [
  {
    id: 'vardagsrum',
    labelKey: 'demoWalls.vardagsrum',
    imageUrl: '/assets/demo/room-sample.svg',
    thumbnailUrl: '/assets/demo/room-sample.svg',
    wallCorners: [
      { x: 0.07, y: 0.10 },
      { x: 0.93, y: 0.10 },
      { x: 0.93, y: 0.73 },
      { x: 0.07, y: 0.73 },
    ],
    emoji: '🛋️',
  },
  {
    id: 'sovrum',
    labelKey: 'demoWalls.sovrum',
    imageUrl: '/assets/demo/walls/sovrum.svg',
    thumbnailUrl: '/assets/demo/walls/sovrum.svg',
    wallCorners: [
      { x: 0.10, y: 0.08 },
      { x: 0.90, y: 0.08 },
      { x: 0.90, y: 0.65 },
      { x: 0.10, y: 0.65 },
    ],
    emoji: '🛏️',
  },
  {
    id: 'kok',
    labelKey: 'demoWalls.kok',
    imageUrl: '/assets/demo/walls/kok.svg',
    thumbnailUrl: '/assets/demo/walls/kok.svg',
    wallCorners: [
      { x: 0.15, y: 0.05 },
      { x: 0.85, y: 0.05 },
      { x: 0.85, y: 0.55 },
      { x: 0.15, y: 0.55 },
    ],
    emoji: '🍳',
  },
  {
    id: 'kontor',
    labelKey: 'demoWalls.kontor',
    imageUrl: '/assets/demo/walls/kontor.svg',
    thumbnailUrl: '/assets/demo/walls/kontor.svg',
    wallCorners: [
      { x: 0.05, y: 0.08 },
      { x: 0.95, y: 0.08 },
      { x: 0.95, y: 0.70 },
      { x: 0.05, y: 0.70 },
    ],
    emoji: '💼',
  },
  {
    id: 'hall',
    labelKey: 'demoWalls.hall',
    imageUrl: '/assets/demo/walls/hall.svg',
    thumbnailUrl: '/assets/demo/walls/hall.svg',
    wallCorners: [
      { x: 0.12, y: 0.06 },
      { x: 0.88, y: 0.06 },
      { x: 0.88, y: 0.68 },
      { x: 0.12, y: 0.68 },
    ],
    emoji: '🚪',
  },
  {
    id: 'barnrum',
    labelKey: 'demoWalls.barnrum',
    imageUrl: '/assets/demo/walls/barnrum.svg',
    thumbnailUrl: '/assets/demo/walls/barnrum.svg',
    wallCorners: [
      { x: 0.10, y: 0.10 },
      { x: 0.90, y: 0.10 },
      { x: 0.90, y: 0.70 },
      { x: 0.10, y: 0.70 },
    ],
    emoji: '🧸',
  },
  {
    id: 'matsal',
    labelKey: 'demoWalls.matsal',
    imageUrl: '/assets/demo/walls/matsal.svg',
    thumbnailUrl: '/assets/demo/walls/matsal.svg',
    wallCorners: [
      { x: 0.07, y: 0.08 },
      { x: 0.93, y: 0.08 },
      { x: 0.93, y: 0.68 },
      { x: 0.07, y: 0.68 },
    ],
    emoji: '🍽️',
  },
]

export function getDemoWallById(id: string): DemoWall | undefined {
  return DEMO_WALLS.find((w) => w.id === id)
}

export function detectDemoWallId(roomImageUrl: string | null): string | null {
  if (!roomImageUrl) return null
  const match = DEMO_WALLS.find((w) => w.imageUrl === roomImageUrl)
  return match?.id ?? null
}
