import { NextResponse, type NextRequest } from 'next/server'

import { oidcConfig } from '@/lib/oidc/config'
import { beginLogin, OidcError, safeReturnTo } from '@/lib/oidc/flow'

/** Starts Authorization Code + PKCE. The state cookie binds the callback to this browser. */
export async function GET(request: NextRequest) {
  const cfg = oidcConfig()
  if (!cfg) return NextResponse.json({ error: 'sign-in is not configured' }, { status: 503 })
  try {
    const { url, state } = await beginLogin(
      cfg,
      safeReturnTo(request.nextUrl.searchParams.get('returnTo'), cfg.appOrigin),
    )
    const response = NextResponse.redirect(url)
    response.cookies.set(cfg.loginCookie, state, {
      httpOnly: true,
      secure: cfg.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    if (error instanceof OidcError) {
      return NextResponse.redirect(new URL('/login?error=unavailable', cfg.appOrigin))
    }
    throw error
  }
}
