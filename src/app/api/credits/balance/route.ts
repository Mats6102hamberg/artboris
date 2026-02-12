import { NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/server/services/credits/canSpend'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from auth session
    const userId = request.nextUrl.searchParams.get('userId') || 'demo-user'

    const balance = await getBalance(userId)

    return NextResponse.json({
      success: true,
      userId,
      balance,
    })
  } catch (error) {
    console.error('[credits/balance] Error:', error)
    return NextResponse.json(
      { error: 'Kunde inte hämta saldo.' },
      { status: 500 }
    )
  }
}
