import { SizeOption, FrameOption } from '@/types/design'
import { POSTER_SIZES } from '@/lib/image/resize'

// ── Static fallback (used client-side and as default) ──

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
  matPriceSEK: number
  acrylicPriceSEK: number
  totalPriceSEK: number
  creditsNeeded: number
}

// ── Addon pricing per size tier ──

export const ACRYLIC_PRICES_SEK: Record<string, number> = {
  a5: 149,
  a4: 149,
  a3: 199,
  '30x40': 199,
  '40x50': 199,
  '50x70': 249,
  '61x91': 349,
  '70x100': 349,
}

export const MAT_PRICES_SEK: Record<string, number> = {
  a5: 79,
  a4: 79,
  a3: 99,
  '30x40': 99,
  '40x50': 99,
  '50x70': 129,
  '61x91': 149,
  '70x100': 149,
}

export const ACCESSORY_PRICES_SEK: Record<string, number> = {
  screws: 49,
  screwdriver: 79,
}

export function getAddonPrice(addon: 'acrylic' | 'mat', sizeId: string): number {
  if (addon === 'acrylic') return ACRYLIC_PRICES_SEK[sizeId] || 199
  return MAT_PRICES_SEK[sizeId] || 99
}

export function getAccessoryPrice(accessory: 'screws' | 'screwdriver'): number {
  return ACCESSORY_PRICES_SEK[accessory] || 0
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

// ── Client-side: synkron beräkning med hårdkodade fallback-priser ──

export function calculatePrintPrice(
  sizeId: string,
  frameId: string,
  options?: { matEnabled?: boolean; acrylicGlass?: boolean },
): PrintPricing {
  const size = POSTER_SIZES.find(s => s.id === sizeId)
  const frame = FRAME_OPTIONS.find(f => f.id === frameId)

  const basePriceSEK = BASE_PRICES_SEK[sizeId] || 199
  const frameMultiplier = frame?.priceMultiplier || 1.0
  const framePriceSEK = Math.round(basePriceSEK * (frameMultiplier - 1))
  const matPriceSEK = options?.matEnabled ? getAddonPrice('mat', sizeId) : 0
  const acrylicPriceSEK = options?.acrylicGlass ? getAddonPrice('acrylic', sizeId) : 0
  const totalPriceSEK = basePriceSEK + framePriceSEK + matPriceSEK + acrylicPriceSEK

  return {
    sizeLabel: size?.label || sizeId,
    basePriceSEK,
    framePriceSEK,
    matPriceSEK,
    acrylicPriceSEK,
    totalPriceSEK,
    creditsNeeded: size?.priceCredits || 10,
  }
}

// ── Server-side: DB-driven pricing with in-memory cache ──

export interface PricingConfigData {
  sizes: Array<{ id: string; label: string; widthCm: number; heightCm: number; baseSEK: number; costSEK: number }>
  frames: Array<{ id: string; label: string; color: string; width: number; costSEK: number; priceSEK: number }>
  papers: Array<{ id: string; label: string; costSEK: number; priceSEK: number }>
  shippingSEK: number
  marketShippingSEK: number
  vatRate: number
}

let cachedConfig: PricingConfigData | null = null
let cacheExpiry = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getPricingConfig(): Promise<PricingConfigData> {
  if (cachedConfig && Date.now() < cacheExpiry) {
    return cachedConfig
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const config = await prisma.pricingConfig.findUnique({ where: { id: 'current' } })

    if (config) {
      cachedConfig = {
        sizes: config.sizes as PricingConfigData['sizes'],
        frames: config.frames as PricingConfigData['frames'],
        papers: config.papers as PricingConfigData['papers'],
        shippingSEK: config.shippingSEK,
        marketShippingSEK: config.marketShippingSEK,
        vatRate: config.vatRate,
      }
      cacheExpiry = Date.now() + CACHE_TTL_MS
      return cachedConfig
    }
  } catch (err) {
    console.warn('[pricing] DB fetch failed, using fallback:', err)
  }

  // Fallback to hardcoded prices
  return {
    sizes: Object.entries(BASE_PRICES_SEK).map(([id, baseSEK]) => {
      const size = POSTER_SIZES.find(s => s.id === id)
      return { id, label: size?.label || id, widthCm: size?.widthCm || 0, heightCm: size?.heightCm || 0, baseSEK, costSEK: 0 }
    }),
    frames: FRAME_OPTIONS.map(f => ({
      id: f.id, label: f.label, color: f.color, width: f.width, costSEK: 0, priceSEK: 0,
    })),
    papers: [
      { id: 'DEFAULT', label: 'Standard', costSEK: 0, priceSEK: 0 },
      { id: 'MATTE', label: 'Matt', costSEK: 0, priceSEK: 0 },
      { id: 'SEMI_GLOSS', label: 'Semi-gloss', costSEK: 0, priceSEK: 0 },
      { id: 'FINE_ART', label: 'Fine Art', costSEK: 0, priceSEK: 0 },
    ],
    shippingSEK: 99,
    marketShippingSEK: 79,
    vatRate: 0.25,
  }
}

// Clear cache (called after admin updates pricing)
export function invalidatePricingCache() {
  cachedConfig = null
  cacheExpiry = 0
}

// Server-side price calculation using DB config
export function calculateServerPrice(
  config: PricingConfigData,
  sizeId: string,
  frameId: string,
  paperType?: string,
  options?: { matEnabled?: boolean; acrylicGlass?: boolean },
): PrintPricing {
  const sizeConfig = config.sizes.find(s => s.id === sizeId)
  const frameConfig = config.frames.find(f => f.id === frameId)
  const paperConfig = paperType ? config.papers.find(p => p.id === paperType) : null

  const basePriceSEK = sizeConfig?.baseSEK || BASE_PRICES_SEK[sizeId] || 199
  const framePriceSEK = frameConfig?.priceSEK || 0
  const paperPriceSEK = paperConfig?.priceSEK || 0
  const matPriceSEK = options?.matEnabled ? getAddonPrice('mat', sizeId) : 0
  const acrylicPriceSEK = options?.acrylicGlass ? getAddonPrice('acrylic', sizeId) : 0
  const totalPriceSEK = basePriceSEK + framePriceSEK + paperPriceSEK + matPriceSEK + acrylicPriceSEK

  const size = POSTER_SIZES.find(s => s.id === sizeId)

  return {
    sizeLabel: sizeConfig?.label || size?.label || sizeId,
    basePriceSEK,
    framePriceSEK: framePriceSEK + paperPriceSEK,
    matPriceSEK,
    acrylicPriceSEK,
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
