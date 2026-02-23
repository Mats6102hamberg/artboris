import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAdmin(): Promise<{ authorized: true } | NextResponse> {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }
  return { authorized: true }
}
