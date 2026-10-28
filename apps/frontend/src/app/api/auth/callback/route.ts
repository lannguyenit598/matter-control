import { NextResponse, type NextRequest } from 'next/server'

import { oidcConfig } from '@/lib/oidc/config'
import { completeLogin, OidcError, resolveReturnTo } from '@/lib/oidc/flow'
import { createSession } from '@/lib/oidc/session-store'

export async function GET(request: NextRequest) {
  const cfg = oidcConfig()
  if (!cfg) return NextResponse.json({ error: 'sign-in is not configured' }, { status: 503 })
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${reason}`, cfg.appOrigin))
    res.cookies.delete(cfg.loginCookie)
    return res
  }
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const state = params.get('state')
  if (params.get('error') || !code || !state) return fail('denied')
  try {
    const { tokens, returnTo } = await completeLogin(cfg, {
      code,
      state,
      cookieState: request.cookies.get(cfg.loginCookie)?.value,
    })
    const handle = createSession(tokens)
    const res = NextResponse.redirect(resolveReturnTo(returnTo, cfg.appOrigin))
    res.cookies.delete(cfg.loginCookie)
    // The cookie carries ONLY the opaque handle: no token, no claim.
    res.cookies.set(cfg.sessionCookie, handle, {
      httpOnly: true,
      secure: cfg.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(cfg.absoluteMs / 1000),
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (error) {
    if (error instanceof OidcError)
      return fail(error.code === 'unavailable' ? 'unavailable' : 'invalid')
    throw error
  }
}
