import { NextRequest, NextResponse } from 'next/server'

// Auto-run LOW severity fixes after scan
// Only runs fixes that have safety checks + verification
// If verification FAIL → FIX_FAILED issue is created by the fix runner
// Protected: requires ADMIN_SECRET via header or query param

const AUTO_FIX_ACTIONS = new Set([
  'MARK_ABANDONED',      // LOW: expired >24h, has Stripe safety check
  'REBUILD_THUMBNAIL',   // LOW: temp fix, non-destructive
])

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const headerKey = request.headers.get('x-admin-key')
  if (headerKey === secret) return true
  const urlSecret = new URL(request.url).searchParams.get('secret')
  return urlSecret === secret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const results: { issueId: string; action: string; result: Record<string, unknown> }[] = []

  try {
    // 1. Run scan to get current issues
    const scanRes = await fetch(`${baseUrl}/api/boris/fix/scan`, { cache: 'no-store' })
    if (!scanRes.ok) {
      return NextResponse.json({ error: 'Scan failed', status: scanRes.status }, { status: 500 })
    }
    const scanData = await scanRes.json()

    // 2. Filter LOW issues with auto-fixable actions
    const lowIssues = (scanData.issues || []).filter(
      (i: { severity: string; fixAction: string }) =>
        i.severity === 'low' && AUTO_FIX_ACTIONS.has(i.fixAction)
    )

    if (lowIssues.length === 0) {
      return NextResponse.json({
        autoFixedAt: new Date().toISOString(),
        message: 'Inga LOW issues att auto-fixa',
        attempted: 0,
        results: [],
      })
    }

    // 3. Run each fix (LIVE, not dry-run) — max 3 per auto-run
    const maxAutoFixes = 3
    const toFix = lowIssues.slice(0, maxAutoFixes)

    for (const issue of toFix) {
      try {
        const fixRes = await fetch(`${baseUrl}/api/boris/fix/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: issue.fixAction,
            entityId: issue.entityId,
            dryRun: false,
          }),
        })
        const fixResult = await fixRes.json()

        // If verification FAIL, the fix runner already creates FIX_FAILED issue
        results.push({
          issueId: issue.id,
          action: issue.fixAction,
          result: fixResult,
        })

        // Stop if verification failed — don't continue auto-fixing
        if (fixResult.verification?.status === 'FAIL') {
          console.warn(`[boris/fix/auto] Stopping: ${issue.fixAction} on ${issue.entityId} verification FAIL`)
          break
        }
      } catch (err) {
        console.error(`[boris/fix/auto] Fix failed for ${issue.id}:`, err)
        results.push({
          issueId: issue.id,
          action: issue.fixAction,
          result: { error: err instanceof Error ? err.message : 'unknown' },
        })
      }
    }

    const passed = results.filter(r => (r.result as Record<string, unknown>)?.verification && ((r.result as Record<string, unknown>).verification as Record<string, unknown>)?.status === 'PASS').length
    const failed = results.filter(r => (r.result as Record<string, unknown>)?.verification && ((r.result as Record<string, unknown>).verification as Record<string, unknown>)?.status === 'FAIL').length

    return NextResponse.json({
      autoFixedAt: new Date().toISOString(),
      attempted: results.length,
      passed,
      failed,
      skipped: lowIssues.length - toFix.length,
      results,
    })
  } catch (err) {
    console.error('[boris/fix/auto] Auto-fix failed:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Auto-fix failed',
    }, { status: 500 })
  }
}
