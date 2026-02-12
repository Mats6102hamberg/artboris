import { prisma } from '@/lib/prisma'
import { spendCredits } from '../credits/spend'
import { getCreditCost } from '@/lib/pricing/credits'
import type { PrintProductType, FrameColor, PaperType } from '@prisma/client'

export interface CreateOrderInput {
  anonId?: string
  designId: string
  productType: PrintProductType
  sizeCode: string
  frameColor?: FrameColor
  paperType?: PaperType
  quantity?: number
  unitPriceCents: number
}

export interface CreateOrderResult {
  success: boolean
  orderId?: string
  orderItemId?: string
  error?: string
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const creditCost = getCreditCost('finalRender')
  const quantity = input.quantity ?? 1
  const lineTotalCents = input.unitPriceCents * quantity

  // Spend credits for final render
  if (input.anonId) {
    const spendResult = await spendCredits(
      input.anonId,
      creditCost,
      `Order: design ${input.designId}, storlek ${input.sizeCode}`,
    )

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Inte tillräckligt med credits.',
      }
    }
  }

  try {
    const order = await prisma.order.create({
      data: {
        anonId: input.anonId,
        status: 'DRAFT',
        subtotalCents: lineTotalCents,
        totalCents: lineTotalCents,
        items: {
          create: {
            designId: input.designId,
            productType: input.productType,
            sizeCode: input.sizeCode,
            frameColor: input.frameColor ?? 'NONE',
            paperType: input.paperType ?? 'DEFAULT',
            quantity,
            unitPriceCents: input.unitPriceCents,
            lineTotalCents,
          },
        },
      },
      include: { items: true },
    })

    return {
      success: true,
      orderId: order.id,
      orderItemId: order.items[0]?.id,
    }
  } catch (error) {
    console.error('[createOrder] Error:', error)
    return {
      success: false,
      error: 'Kunde inte skapa ordern.',
    }
  }
}
