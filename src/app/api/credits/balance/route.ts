import { NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/server/services/credits/canSpend'
import { getUserId } from '@/lib/auth/getUserId'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || await getUserId()

    const account = await prisma.creditAccount.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      userId,
      balance: account?.balance ?? 0,
      totalPurchased: account?.totalPurchased ?? 0,
      totalSpent: account?.totalSpent ?? 0,
    })
  } catch (error) {
    console.error('[credits/balance] Error:', error)
    return NextResponse.json(
      { error: 'Could not fetch balance.' },
      { status: 500 }
    )
  }
}
