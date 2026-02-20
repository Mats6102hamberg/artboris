import { NextRequest, NextResponse } from 'next/server'

// TEMPORARY debug endpoint — remove after fixing auth
export async function GET(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  const sentKey = request.headers.get('x-admin-key')

  return NextResponse.json({
    hasEnvVar: !!adminSecret,
    envVarLength: adminSecret?.length ?? 0,
    envVarFirst3: adminSecret?.slice(0, 3) ?? null,
    envVarLast3: adminSecret?.slice(-3) ?? null,
    sentKeyLength: sentKey?.length ?? 0,
    sentKeyFirst3: sentKey?.slice(0, 3) ?? null,
    sentKeyLast3: sentKey?.slice(-3) ?? null,
    match: sentKey === adminSecret,
    // Check for whitespace issues
    envTrimmed: adminSecret?.trim() === adminSecret,
    sentTrimmed: sentKey?.trim() === sentKey,
    matchTrimmed: sentKey?.trim() === adminSecret?.trim(),
  })
}
