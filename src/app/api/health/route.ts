import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, boolean> = {}
  let status: 'ok' | 'degraded' = 'ok'

  // DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = true
  } catch {
    checks.db = false
    status = 'degraded'
  }

  // Critical env vars
  checks.stripe = !!process.env.STRIPE_SECRET_KEY
  checks.openai = !!process.env.OPENAI_API_KEY
  checks.replicate = !!process.env.REPLICATE_API_TOKEN

  const statusCode = status === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    },
    { status: statusCode }
  )
}
