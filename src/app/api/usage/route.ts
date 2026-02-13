import { NextResponse } from 'next/server'
import { getOrCreateAnonId } from '@/lib/anonId'
import { getUsage } from '@/server/services/usage/dailyUsage'

export async function GET() {
  try {
    const anonId = await getOrCreateAnonId()
    const usage = await getUsage(anonId)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('[usage] Error:', error)
    return NextResponse.json(
      { error: 'Could not fetch usage.' },
      { status: 500 }
    )
  }
}
