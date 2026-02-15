import { calculatePrintPrice } from './prints'

export interface MarketPricing {
  artistPriceSEK: number      // What the artist set
  artistShareSEK: number      // 50% of artist price → to artist
  platformShareSEK: number    // 50% of artist price → to Artboris
  printCostSEK: number        // Print + frame cost (Artboris keeps 100%)
  shippingSEK: number
  totalBuyerSEK: number       // What the buyer pays
}

const SHIPPING_SEK = 79

export function calculateMarketPrice(
  artistPriceSEK: number,
  sizeId: string,
  frameId: string
): MarketPricing {
  const printPricing = calculatePrintPrice(sizeId, frameId)

  const artistShareSEK = Math.round(artistPriceSEK / 2)
  const platformShareSEK = artistPriceSEK - artistShareSEK
  const printCostSEK = printPricing.totalPriceSEK

  const totalBuyerSEK = artistPriceSEK + printCostSEK + SHIPPING_SEK

  return {
    artistPriceSEK,
    artistShareSEK,
    platformShareSEK,
    printCostSEK,
    shippingSEK: SHIPPING_SEK,
    totalBuyerSEK,
  }
}

export function formatPriceSEK(amount: number): string {
  return `${amount.toLocaleString('sv-SE')} kr`
}

export const MARKET_CATEGORIES = [
  { id: 'painting', label: 'Målning' },
  { id: 'photo', label: 'Fotografi' },
  { id: 'print', label: 'Grafik / Tryck' },
  { id: 'digital', label: 'Digital konst' },
  { id: 'mixed', label: 'Blandteknik' },
] as const

export const MARKET_TECHNIQUES = [
  'Olja på duk',
  'Akryl',
  'Akvarell',
  'Fotografi',
  'Digital konst',
  'Blyerts',
  'Kol',
  'Pastell',
  'Gouache',
  'Blandteknik',
  'Linoleumsnitt',
  'Litografi',
  'Serigrafi',
  'Annat',
] as const
