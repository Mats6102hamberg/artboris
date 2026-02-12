import { SizeOption, FrameOption } from '@/types/design'
import { POSTER_SIZES } from '@/lib/image/resize'

export const FRAME_OPTIONS: FrameOption[] = [
  { id: 'none', label: 'Ingen ram', imageUrl: '', color: 'transparent', width: 0, priceMultiplier: 1.0 },
  { id: 'black', label: 'Svart', imageUrl: '/assets/frames/black.png', color: '#1a1a1a', width: 20, priceMultiplier: 1.3 },
  { id: 'white', label: 'Vit', imageUrl: '/assets/frames/white.png', color: '#f5f5f5', width: 20, priceMultiplier: 1.3 },
  { id: 'oak', label: 'Ek', imageUrl: '/assets/frames/oak.png', color: '#C4A265', width: 25, priceMultiplier: 1.5 },
  { id: 'walnut', label: 'Valnöt', imageUrl: '/assets/frames/walnut.png', color: '#5C4033', width: 25, priceMultiplier: 1.5 },
  { id: 'gold', label: 'Guld', imageUrl: '/assets/frames/gold.png', color: '#D4AF37', width: 30, priceMultiplier: 1.8 },
]

export interface PrintPricing {
  sizeLabel: string
  basePriceSEK: number
  framePriceSEK: number
  totalPriceSEK: number
  creditsNeeded: number
}

const BASE_PRICES_SEK: Record<string, number> = {
  a5: 99,
  a4: 149,
  a3: 249,
  '30x40': 249,
  '40x50': 349,
  '50x70': 449,
  '61x91': 599,
  '70x100': 749,
}

export function calculatePrintPrice(sizeId: string, frameId: string): PrintPricing {
  const size = POSTER_SIZES.find(s => s.id === sizeId)
  const frame = FRAME_OPTIONS.find(f => f.id === frameId)

  const basePriceSEK = BASE_PRICES_SEK[sizeId] || 199
  const frameMultiplier = frame?.priceMultiplier || 1.0
  const framePriceSEK = Math.round(basePriceSEK * (frameMultiplier - 1))
  const totalPriceSEK = basePriceSEK + framePriceSEK

  return {
    sizeLabel: size?.label || sizeId,
    basePriceSEK,
    framePriceSEK,
    totalPriceSEK,
    creditsNeeded: size?.priceCredits || 10,
  }
}

export function getFrameById(id: string): FrameOption | undefined {
  return FRAME_OPTIONS.find(f => f.id === id)
}

export function formatSEK(amount: number): string {
  return `${amount.toLocaleString('sv-SE')} kr`
}
