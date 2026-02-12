import { NextRequest, NextResponse } from 'next/server'
import { spendCredits, addCredits } from '@/server/services/credits/spend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, amount, packageId, description } = body as {
      action: 'spend' | 'purchase'
      userId: string
      amount: number
      packageId?: string
      description?: string
    }

    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'userId och amount krävs.' },
        { status: 400 }
      )
    }

    if (action === 'purchase') {
      const result = await addCredits(
        userId,
        amount,
        description || `Köp: ${packageId || 'credits'}`
      )
      return NextResponse.json(result)
    }

    const result = await spendCredits(
      userId,
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
