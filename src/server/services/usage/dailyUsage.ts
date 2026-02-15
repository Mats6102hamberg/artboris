import { prisma } from '@/lib/prisma'

const FREE_GENERATIONS_PER_DAY = 50
const FREE_REFINES_PER_DAY = 0 // No free refines

function todayDate(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function getUsage(anonId: string) {
  const date = todayDate()
  const usage = await prisma.dailyUsage.findUnique({
    where: { anonId_date: { anonId, date } },
  })

  const generationsUsed = usage?.generationsUsed ?? 0
  const refinesUsed = usage?.refinesUsed ?? 0

  return {
    generationsUsed,
    generationsRemaining: Math.max(0, FREE_GENERATIONS_PER_DAY - generationsUsed),
    generationsLimit: FREE_GENERATIONS_PER_DAY,
    refinesUsed,
    refinesLimit: FREE_REFINES_PER_DAY,
    canGenerate: generationsUsed < FREE_GENERATIONS_PER_DAY,
    canRefine: false, // Always blocked for free tier
    date,
  }
}

export async function incrementGeneration(anonId: string): Promise<{
  allowed: boolean
  remaining: number
}> {
  const date = todayDate()

  const usage = await prisma.dailyUsage.upsert({
    where: { anonId_date: { anonId, date } },
    create: { anonId, date, generationsUsed: 1 },
    update: { generationsUsed: { increment: 1 } },
  })

  const remaining = Math.max(0, FREE_GENERATIONS_PER_DAY - usage.generationsUsed)

  if (usage.generationsUsed > FREE_GENERATIONS_PER_DAY) {
    // Rolled back: decrement since we already incremented
    await prisma.dailyUsage.update({
      where: { anonId_date: { anonId, date } },
      data: { generationsUsed: { decrement: 1 } },
    })
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining }
}

export { FREE_GENERATIONS_PER_DAY, FREE_REFINES_PER_DAY }
