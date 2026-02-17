import { prisma } from '@/lib/prisma'

/**
 * Migrates data associated with an anonId to a real user ID.
 * Called on first login after registration.
 */
export async function migrateAnonData(userId: string, anonId: string) {
  await prisma.$transaction([
    prisma.design.updateMany({
      where: { userId: anonId },
      data: { userId },
    }),
    prisma.like.updateMany({
      where: { anonId },
      data: { anonId: userId },
    }),
    prisma.order.updateMany({
      where: { anonId },
      data: { anonId: userId },
    }),
    prisma.marketOrder.updateMany({
      where: { buyerAnonId: anonId },
      data: { buyerAnonId: userId },
    }),
    prisma.creditAccount.updateMany({
      where: { userId: anonId },
      data: { userId },
    }),
    prisma.creditTransaction.updateMany({
      where: { userId: anonId },
      data: { userId },
    }),
    prisma.dailyUsage.updateMany({
      where: { anonId },
      data: { anonId: userId },
    }),
    prisma.scannerPortfolioItem.updateMany({
      where: { userId: anonId },
      data: { userId },
    }),
  ])
}
