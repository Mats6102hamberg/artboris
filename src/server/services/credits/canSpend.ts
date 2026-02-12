import { prisma } from '@/lib/prisma'

export async function canSpend(userId: string, amount: number): Promise<boolean> {
  const user = await prisma.creditAccount.findUnique({
    where: { userId },
  })

  if (!user) return false
  return user.balance >= amount
}

export async function getBalance(userId: string): Promise<number> {
  const account = await prisma.creditAccount.findUnique({
    where: { userId },
  })

  return account?.balance ?? 0
}
