import { NextResponse } from 'next/server'
import { reportError } from '@/lib/crashcatcher'

/**
 * Client-side error reporting proxy.
 * Frontend POSTs errors here — server forwards to CrashCatcher
 * so API keys stay server-side.
 */
export async function POST(req: Request) {
  try {
    const { title, description, severity, source } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }

    await reportError({
      title: title.slice(0, 200),
      description: (description || '').slice(0, 2000),
      severity: severity || 'HIGH',
      incident_type: source === 'react_error' ? 'react_error' : 'client_error',
      target_system: 'artboris-frontend',
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to report' }, { status: 500 })
  }
}
