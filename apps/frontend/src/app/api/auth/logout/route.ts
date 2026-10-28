import { NextResponse, type NextRequest } from 'next/server'

import { oidcConfig } from '@/lib/oidc/config'
import { revokeToken } from '@/lib/oidc/flow'
import { destroySession } from '@/lib/oidc/session-store'

/**
 * Logout distinguishes three things (contract §1): the session here is destroyed immediately
 * (the handle is dead at once); the refresh token is revoked at the issuer best-effort; product
 * membership is untouched. CSRF: a same-origin POST only.
 */
export async function POST(request: NextRequest) {
  const cfg = oidcConfig()
  if (!cfg) return NextResponse.json({ error: 'sign-in is not configured' }, { status: 503 })
  if (request.headers.get('origin') !== cfg.appOrigin) {
    return NextResponse.json({ error: 'cross-origin request refused' }, { status: 403 })
  }
  const handle = request.cookies.get(cfg.sessionCookie)?.value
  const record = handle ? destroySession(handle) : undefined
  if (record?.refreshToken) await revokeToken(cfg, record.refreshToken)
  const res = NextResponse.redirect(new URL('/login?signedOut=1', cfg.appOrigin), 303)
  res.cookies.delete(cfg.sessionCookie)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
