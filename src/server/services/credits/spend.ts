import { prisma } from '@/lib/prisma'
import { canSpend } from './canSpend'

export interface SpendResult {
  success: boolean
  newBalance: number
  error?: string
}

export async function spendCredits(
  userId: string,
  amount: number,
  description: string,
  orderId?: string
): Promise<SpendResult> {
  const affordable = await canSpend(userId, amount)
  if (!affordable) {
    return {
      success: false,
      newBalance: 0,
      error: 'Inte tillräckligt med credits.',
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'spend',
          description,
          orderId: orderId || null,
        },
      })

      return account
    })

    return {
      success: true,
      newBalance: result.balance,
    }
  } catch (error) {
    console.error('[spendCredits] Error:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Kunde inte dra credits.',
    }
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string
): Promise<SpendResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Upsert: create account if it doesn't exist
      const account = await tx.creditAccount.upsert({
        where: { userId },
        create: {
          userId,
          balance: amount,
          totalPurchased: amount,
          totalSpent: 0,
        },
        update: {
          balance: { increment: amount },
          totalPurchased: { increment: amount },
        },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'purchase',
          description,
          orderId: null,
        },
      })

      return account
    })

    return {
      success: true,
      newBalance: result.balance,
    }
  } catch (error) {
    console.error('[addCredits] Error:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Kunde inte lägga till credits.',
    }
  }
}
