import { CreditPackage } from '@/types/order'

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter100',
    label: 'Start',
    credits: 100,
    priceSEK: 129,
    popular: false,
    subtitle: 'Perfekt för att testa Boris',
    pricePerCredit: 1.29,
    estAnalyses: 6,
  },
  {
    id: 'popular300',
    label: 'Populär',
    credits: 300,
    priceSEK: 299,
    popular: true,
    badge: 'Mest vald',
    subtitle: 'Bäst värde',
    pricePerCredit: 0.99,
    estAnalyses: 20,
  },
  {
    id: 'pro1000',
    label: 'Pro',
    credits: 1000,
    priceSEK: 799,
    popular: false,
    subtitle: 'För samlare & power users',
    pricePerCredit: 0.79,
    estAnalyses: 66,
  },
]

export const CREDIT_COSTS = {
  borisAnalysis: 15,       // Boris konstanalys
  wallAdvice: 10,          // Se tavlan i ditt rum + rådgivning
  aiGenerate: 5,           // Skapa egen AI-konst
  generatePreview: 2,      // 4 variants = 2 credits
  refineVariant: 1,        // 1 new variant = 1 credit
  finalRender: 5,          // high-res print file
  mockupRender: 0,         // free
  publishToGallery: 0,     // free
} as const

export const FIRST_PURCHASE_BONUS = 20

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
