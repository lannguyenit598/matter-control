import { connection, NextResponse } from 'next/server'

import { currentPrincipal } from '@/lib/auth-provider'
import { McError } from '@/lib/mc/errors'

/**
 * Session currentness for the UI ("session rights and expiry"): display name and when the
 * session ends. Never a token, claim set or product permission; those come from the Go API.
 */
export async function GET() {
  // Opt into request-time rendering: without it this handler is prerendered at build time.
  await connection()
  let principal
  try {
    principal = await currentPrincipal()
  } catch (error) {
    if (!(error instanceof McError)) throw error
    return NextResponse.json(
      { error: 'session storage unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const res = NextResponse.json(
    principal
      ? {
          authenticated: true,
          name: principal.name,
          sessionEndsAt: new Date(principal.sessionEndsAt).toISOString(),
        }
      : { authenticated: false },
  )
  res.headers.set('Cache-Control', 'no-store')
  return res
}
