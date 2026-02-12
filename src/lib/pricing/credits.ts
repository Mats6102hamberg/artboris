import { CreditPackage } from '@/types/order'

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', label: 'Starter', credits: 10, priceSEK: 49, popular: false },
  { id: 'creator', label: 'Creator', credits: 30, priceSEK: 99, popular: true },
  { id: 'pro', label: 'Pro', credits: 75, priceSEK: 199, popular: false },
  { id: 'studio', label: 'Studio', credits: 200, priceSEK: 449, popular: false },
]

export const CREDIT_COSTS = {
  generatePreview: 2,      // 4 variants = 2 credits
  refineVariant: 1,        // 1 new variant = 1 credit
  finalRender: 5,          // high-res print file
  mockupRender: 0,         // free
  publishToGallery: 0,     // free
} as const

export type CreditAction = keyof typeof CREDIT_COSTS

export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action]
}

export function canAfford(balance: number, action: CreditAction): boolean {
  return balance >= CREDIT_COSTS[action]
}

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id)
}

export function formatCredits(amount: number): string {
  return `${amount} credit${amount !== 1 ? 's' : ''}`
}
