import { NextRequest, NextResponse } from 'next/server'
import { spendCredits } from '@/server/services/credits/spend'
import { getUserId } from '@/lib/auth/getUserId'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, description } = body as {
      userId?: string
      amount: number
      description?: string
    }

    // Use provided userId or fall back to anonId from cookie
    const resolvedUserId = userId || await getUserId()

    if (!resolvedUserId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'userId and positive amount are required.' },
        { status: 400 }
      )
    }

    const result = await spendCredits(
      resolvedUserId,
      amount,
      description || 'Credit spend'
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[credits/spend] Error:', error)
    return NextResponse.json(
      { error: 'Credit-transaktion misslyckades.' },
      { status: 500 }
    )
  }
}
