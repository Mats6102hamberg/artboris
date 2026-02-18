export interface Design {
  id: string
  roomId: string
  userId: string
  style: StylePreset
  prompt: string
  variants: DesignVariant[]
  selectedVariantIndex: number | null
  controls: DesignControls
  createdAt: string
  updatedAt: string
}

export interface DesignVariant {
  id: string
  designId: string
  imageUrl: string
  thumbnailUrl: string
  seed: number
  isSelected: boolean
  createdAt: string
}

export interface DesignControls {
  colorPalette: string[]
  mood: MoodType
  contrast: number       // 0–100
  brightness: number     // 0–100
  saturation: number     // 0–100
  zoom: number           // 100–200 (100 = normal, 200 = 2× inzoomad)
  textOverlay: string
  textFont: string
  textPosition: 'top' | 'center' | 'bottom' | 'none'
}

export type MoodType =
  | 'calm'
  | 'energetic'
  | 'dramatic'
  | 'playful'
  | 'elegant'
  | 'cozy'
  | 'bold'
  | 'dreamy'

export type StylePreset =
  | 'nordic'
  | 'retro'
  | 'minimal'
  | 'abstract'
  | 'botanical'
  | 'geometric'
  | 'watercolor'
  | 'line-art'
  | 'photography'
  | 'typographic'
  | 'pop-art'
  | 'japanese'
  | 'art-deco'
  | 'surreal'
  | 'graffiti'
  | 'pastel'
  | 'dark-moody'
  | 'mid-century'
  | 'boris-silence'
  | 'boris-between'
  | 'boris-awakening'

export interface StyleDefinition {
  id: StylePreset
  label: string
  description: string
  previewUrl: string
  promptPrefix: string
  defaultMood: MoodType
  defaultColors: string[]
  negativePrompt?: string
  printModifier?: string
  variationHints?: string[]
}

export interface FrameOption {
  id: string
  label: string
  imageUrl: string
  color: string
  width: number         // mm
  priceMultiplier: number
}

export interface SizeOption {
  id: string
  label: string
  widthCm: number
  heightCm: number
  dpi: number
  priceCredits: number
}

export interface MockupConfig {
  designVariantId: string
  roomId: string
  wallCorners: WallCorner[]
  frameId: string
  sizeId: string
  positionX: number     // 0–1 relative
  positionY: number     // 0–1 relative
  scale: number         // 0.5–2.0
  rotation: number      // degrees
}

export interface WallCorner {
  x: number
  y: number
}

export interface GalleryItem {
  id: string
  userId: string
  title: string
  description: string
  imageUrl: string
  mockupUrl: string
  roomType?: string
  style: StylePreset
  colorMood?: string
  likesCount: number
  isPublic: boolean
  createdAt: string
}
