import { connection, NextResponse } from 'next/server'

import { currentPrincipal } from '@/lib/auth-provider'

/**
 * Session currentness for the UI ("session rights and expiry"): display name and when the
 * session ends. Never a token, claim set or product permission; those come from the Go API.
 */
export async function GET() {
  // Opt into request-time rendering: without it this handler is prerendered at build time.
  await connection()
  const principal = await currentPrincipal()
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
