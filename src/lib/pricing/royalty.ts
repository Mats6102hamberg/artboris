/**
 * ArtBoris Creative Partnership — Royalty Calculator
 *
 * Kalkylmodell:
 * A = Försäljningspris inkl. moms (t.ex. 1500 kr)
 * B = Nettoomsättning (A / 1.25)
 * C = Produktionskostnad (Tryck + Ram + Frakt + Transaktionsavgift)
 * D = Administrationsavgift (fast 10 kr per order)
 * E = Nettovinst (B - C - D)
 * Kundens del = E * 0.30
 * ArtBoris del = E * 0.70
 */

const VAT_MULTIPLIER = 1.25
const ADMIN_FEE_SEK = 10
const DEFAULT_ROYALTY_RATE = 0.30
const STRIPE_FEE_RATE = 0.029
const STRIPE_FEE_FIXED_SEK = 1.80
const MIN_PAYOUT_SEK = 200

export interface RoyaltyInput {
  salePriceSEK: number       // Inkl. moms
  productionCostSEK: number  // Tryck + ram + passepartout + akrylglas
  shippingCostSEK: number    // Frakt
  royaltyRate?: number       // Default 0.30
}

export interface RoyaltyResult {
  salePriceSEK: number
  netRevenueSEK: number      // Exkl. moms
  productionCostSEK: number
  shippingCostSEK: number
  transactionFeeSEK: number  // Stripe-avgift
  adminFeeSEK: number
  totalCostsSEK: number
  netProfitSEK: number
  creatorShareSEK: number
  artborisShareSEK: number
  royaltyRate: number
  isProfitable: boolean
}

export function calculateRoyalty(input: RoyaltyInput): RoyaltyResult {
  const royaltyRate = input.royaltyRate ?? DEFAULT_ROYALTY_RATE

  // B = Nettoomsättning (exkl. moms)
  const netRevenueSEK = Math.round((input.salePriceSEK / VAT_MULTIPLIER) * 100) / 100

  // Stripe-avgift
  const transactionFeeSEK = Math.round((input.salePriceSEK * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_SEK) * 100) / 100

  // C = Totala kostnader
  const totalCostsSEK = input.productionCostSEK + input.shippingCostSEK + transactionFeeSEK + ADMIN_FEE_SEK

  // E = Nettovinst
  const netProfitSEK = Math.max(0, Math.round((netRevenueSEK - totalCostsSEK) * 100) / 100)

  // Fördelning
  const creatorShareSEK = Math.round(netProfitSEK * royaltyRate * 100) / 100
  const artborisShareSEK = Math.round(netProfitSEK * (1 - royaltyRate) * 100) / 100

  return {
    salePriceSEK: input.salePriceSEK,
    netRevenueSEK,
    productionCostSEK: input.productionCostSEK,
    shippingCostSEK: input.shippingCostSEK,
    transactionFeeSEK,
    adminFeeSEK: ADMIN_FEE_SEK,
    totalCostsSEK,
    netProfitSEK,
    creatorShareSEK,
    artborisShareSEK,
    royaltyRate,
    isProfitable: netProfitSEK > 0,
  }
}

export { MIN_PAYOUT_SEK, DEFAULT_ROYALTY_RATE, ADMIN_FEE_SEK }
