import { prisma } from '@/lib/prisma'
import { spendCredits } from '../credits/spend'
import { getCreditCost } from '@/lib/pricing/credits'

export interface CreateOrderInput {
  userId: string
  designId: string
  variantId: string
  frameId: string
  sizeId: string
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  error?: string
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const creditCost = getCreditCost('finalRender')

  // Spend credits first
  const spendResult = await spendCredits(
    input.userId,
    creditCost,
    `Order: design ${input.designId}, storlek ${input.sizeId}`,
  )

  if (!spendResult.success) {
    return {
      success: false,
      error: spendResult.error || 'Inte tillräckligt med credits.',
    }
  }

  try {
    const order = await prisma.posterOrder.create({
      data: {
        userId: input.userId,
        designId: input.designId,
        variantId: input.variantId,
        frameId: input.frameId,
        sizeId: input.sizeId,
        status: 'pending',
        creditsSpent: creditCost,
      },
    })

    return { success: true, orderId: order.id }
  } catch (error) {
    console.error('[createOrder] Error:', error)
    return {
      success: false,
      error: 'Kunde inte skapa ordern.',
    }
  }
}
