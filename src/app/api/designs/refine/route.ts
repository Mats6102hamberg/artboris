import { NextRequest, NextResponse } from 'next/server'
import { refinePreview } from '@/server/services/ai/refinePreview'
import { DesignControls } from '@/types/design'
import { getUserId } from '@/lib/auth/getUserId'
import { canSpend, getBalance } from '@/server/services/credits/canSpend'
import { spendCredits } from '@/server/services/credits/spend'

const REFINE_CREDIT_COST = 1
const MAX_VARIANTS_PER_DESIGN = 30
const RATE_LIMIT_MS = 3000

// In-memory rate limit map (per-user cooldown)
const lastRefineTime = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()

    // --- Rate limit: 3s cooldown ---
    const now = Date.now()
    const lastTime = lastRefineTime.get(userId) || 0
    if (now - lastTime < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000)
      return NextResponse.json(
        { error: `Please wait ${waitSec}s before shuffling again.`, rateLimited: true },
        { status: 429 }
      )
    }
    lastRefineTime.set(userId, now)

    const body = await request.json()
    const { originalPrompt, feedback, controls, designId, variantCount } = body as {
      originalPrompt: string
      feedback: string
      controls: DesignControls
      designId?: string
      variantCount?: number
    }

    if (!originalPrompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
    }

    // --- Variant cap: 30 max ---
    if (variantCount && variantCount >= MAX_VARIANTS_PER_DESIGN) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VARIANTS_PER_DESIGN} variants per design reached.`, variantCapReached: true },
        { status: 400 }
      )
    }

    // --- Credit check ---
    let balance = 0
    let creditCheckPassed = false
    try {
      balance = await getBalance(userId)
      creditCheckPassed = balance >= REFINE_CREDIT_COST
    } catch {
      // DB not available (demo mode) — allow without credits
      creditCheckPassed = true
      balance = 999
    }

    if (!creditCheckPassed) {
      return NextResponse.json(
        { error: 'Not enough credits.', insufficientCredits: true, balance, cost: REFINE_CREDIT_COST },
        { status: 402 }
      )
    }

    // --- Generate ---
    const result = await refinePreview({
      originalPrompt,
      feedback: feedback || '',
      controls,
    })

    if (!result.success) {
      // Refund rate limit on failure
      lastRefineTime.delete(userId)
      return NextResponse.json(
        { error: result.error || 'Refinement failed.' },
        { status: 500 }
      )
    }

    // --- Deduct credit after success ---
    let newBalance = balance
    try {
      const spendResult = await spendCredits(
        userId,
        REFINE_CREDIT_COST,
        `Shuffle: ${designId || 'unknown'}`,
        undefined
      )
      if (spendResult.success) {
        newBalance = spendResult.newBalance
      }
    } catch {
      // Demo mode — ignore credit deduction failure
    }

    return NextResponse.json({
      success: true,
      variant: result.variant,
      prompt: result.prompt,
      creditsRemaining: newBalance,
    })
  } catch (error) {
    console.error('[designs/refine] Error:', error)
    return NextResponse.json(
      { error: 'Refinement failed.' },
      { status: 500 }
    )
  }
}
