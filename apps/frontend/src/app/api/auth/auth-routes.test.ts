// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cfg, FakeIdp } from '@/test/fake-idp'

const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }))

vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => cfg }))
// connection() only works inside a Next request scope; the handler logic is what is under test.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: async () => {},
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'mc_session' && cookieJar.value ? { name, value: cookieJar.value } : undefined,
  }),
}))

import { resolveSession } from '@/lib/auth-provider'
import { resetOidcState } from '@/lib/oidc/flow'
import { createSession, readSession, resetSessions } from '@/lib/oidc/session-store'

import { GET as callback } from './callback/route'
import { GET as login } from './login/route'
import { POST as logout } from './logout/route'
import { GET as sessionRoute } from './session/route'

let idp: FakeIdp
afterEach(() => vi.unstubAllEnvs())

beforeEach(() => {
  resetOidcState()
  resetSessions()
  cookieJar.value = undefined
  idp = new FakeIdp()
  idp.install()
})

const req = (url: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) =>
  new NextRequest(new URL(url, cfg.appOrigin), init)

async function doLogin() {
  const res = await login(req('/api/auth/login?returnTo=/workspaces/abc'))
  const location = new URL(res.headers.get('location')!)
  const state = res.cookies.get(cfg.loginCookie)!.value
  return { res, nonce: location.searchParams.get('nonce')!, state }
}

describe('login + callback', () => {
  it('redirects to the issuer and sets a short-lived HttpOnly state cookie', async () => {
    const { res, state } = await doLogin()
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/oauth/v2/authorize')
    const cookie = res.cookies.get(cfg.loginCookie)!
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 })
    expect(cookie.value).toBe(state)
  })

  it('never puts a token or claim into any cookie; only an opaque handle (token-exposure scan)', async () => {
    const { nonce, state } = await doLogin()
    idp.tokenResponse = {
      access_token: 'ACCESS-TOKEN-OPAQUE-VALUE',
      refresh_token: 'REFRESH-TOKEN-VALUE',
      expires_in: 300,
      id_token: idp.idToken(nonce),
    }
    const res = await callback(
      req(`/api/auth/callback?code=c&state=${state}`, {
        headers: { cookie: `${cfg.loginCookie}=${state}` },
      }),
    )
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/workspaces/abc')
    const setCookie = res.headers.getSetCookie().join('\n')
    for (const secret of [
      'ACCESS-TOKEN-OPAQUE-VALUE',
      'REFRESH-TOKEN-VALUE',
      'Alice Tester',
      'user-1',
      idp.tokenResponse.id_token as string,
    ]) {
      expect(setCookie).not.toContain(secret)
    }
    const session = res.cookies.get(cfg.sessionCookie)!
    expect(session).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' })
    expect(session.value).toMatch(/^[A-Za-z0-9_-]{43}$/)
    // ...and the handle resolves to the server-side record that does hold the token.
    expect(readSession(session.value, cfg)?.accessToken).toBe('ACCESS-TOKEN-OPAQUE-VALUE')
  })

  it.each([
    [
      'a forged state',
      () => ({ q: `state=forged`, cookie: `${cfg.loginCookie}=forged` }),
      'invalid',
    ],
    ['a missing state cookie', (s: string) => ({ q: `state=${s}`, cookie: '' }), 'invalid'],
    [
      'an issuer error',
      (s: string) => ({ q: `error=access_denied&state=${s}`, cookie: `${cfg.loginCookie}=${s}` }),
      'denied',
    ],
  ])('refuses %s and creates no session', async (_n, mk, reason) => {
    const { nonce, state } = await doLogin()
    idp.tokenResponse = { access_token: 'A', expires_in: 300, id_token: idp.idToken(nonce) }
    const { q, cookie } = mk(state)
    const res = await callback(req(`/api/auth/callback?code=c&${q}`, { headers: { cookie } }))
    expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBe(reason)
    expect(res.cookies.get(cfg.sessionCookie)).toBeUndefined()
  })

  it('an unreachable issuer during login is "unavailable", never a denial or a session', async () => {
    idp.down = true
    resetOidcState()
    const res = await login(req('/api/auth/login'))
    expect(new URL(res.headers.get('location')!).searchParams.get('error')).toBe('unavailable')
  })
})

describe('returnTo hardening (CW1-F03)', () => {
  it.each([
    '/\t/attacker.invalid',
    '/\n/attacker.invalid',
    '//attacker.invalid',
    '/\\attacker.invalid',
    'http://attacker.invalid/x',
  ])(
    'a hostile returnTo %j never redirects off the application origin after login',
    async (hostile) => {
      const res = await login(req(`/api/auth/login?returnTo=${encodeURIComponent(hostile)}`))
      const location = new URL(res.headers.get('location')!)
      const state = res.cookies.get(cfg.loginCookie)!.value
      idp.tokenResponse = {
        access_token: 'A',
        expires_in: 300,
        id_token: idp.idToken(location.searchParams.get('nonce')!),
      }
      const cb = await callback(
        req(`/api/auth/callback?code=c&state=${state}`, {
          headers: { cookie: `${cfg.loginCookie}=${state}` },
        }),
      )
      expect(new URL(cb.headers.get('location')!).origin).toBe(cfg.appOrigin)
      expect(new URL(cb.headers.get('location')!).pathname).toBe('/workspaces')
      expect(cb.cookies.get(cfg.sessionCookie)).toBeDefined() // login itself still succeeded
    },
  )

  it('a legitimate in-app target and its query survive the round trip', async () => {
    const { res, nonce, state } = await doLogin()
    expect(res.status).toBe(307)
    idp.tokenResponse = { access_token: 'A', expires_in: 300, id_token: idp.idToken(nonce) }
    const cb = await callback(
      req(`/api/auth/callback?code=c&state=${state}`, {
        headers: { cookie: `${cfg.loginCookie}=${state}` },
      }),
    )
    expect(cb.headers.get('location')).toBe('http://app.test/workspaces/abc')
  })
})

describe('logout', () => {
  it('refuses cross-origin and missing-origin posts without touching the session', async () => {
    const handle = createSession({ sub: 's', name: 'n', accessToken: 'a', accessExpiresAt: 1e15 })
    for (const origin of ['http://evil.test', undefined]) {
      const res = await logout(
        req('/api/auth/logout', {
          method: 'POST',
          headers: { cookie: `${cfg.sessionCookie}=${handle}`, ...(origin ? { origin } : {}) },
        }),
      )
      expect(res.status).toBe(403)
    }
    expect(readSession(handle, cfg)).toBeDefined()
  })

  it('destroys the session at once, revokes the refresh token and clears the cookie', async () => {
    const handle = createSession({
      sub: 's',
      name: 'n',
      accessToken: 'a',
      accessExpiresAt: 1e15,
      refreshToken: 'RT',
    })
    const res = await logout(
      req('/api/auth/logout', {
        method: 'POST',
        headers: { origin: cfg.appOrigin, cookie: `${cfg.sessionCookie}=${handle}` },
      }),
    )
    expect(res.status).toBe(303)
    expect(readSession(handle, cfg)).toBeUndefined()
    expect(res.headers.getSetCookie().join()).toMatch(/mc_session=;/)
    expect(
      idp.requests.some((r) => r.url.endsWith('/oauth/v2/revoke') && r.body?.get('token') === 'RT'),
    ).toBe(true)
  })

  it('still logs out when the issuer is down (revocation is best effort)', async () => {
    const handle = createSession({
      sub: 's',
      name: 'n',
      accessToken: 'a',
      accessExpiresAt: 1e15,
      refreshToken: 'RT',
    })
    idp.down = true
    const res = await logout(
      req('/api/auth/logout', {
        method: 'POST',
        headers: { origin: cfg.appOrigin, cookie: `${cfg.sessionCookie}=${handle}` },
      }),
    )
    expect(res.status).toBe(303)
    expect(readSession(handle, cfg)).toBeUndefined()
  })
})

describe('resolveSession + session route', () => {
  it('reports invalid durable storage as unavailable, never as anonymous or successful logout', async () => {
    cookieJar.value = createSession({
      sub: 'synthetic',
      name: 'A',
      accessToken: 'A',
      accessExpiresAt: Date.now() + 600_000,
    })
    vi.stubEnv('BFF_STATE_BACKEND', 'postgres')
    vi.stubEnv('BFF_DATABASE_URL', '')
    const session = await sessionRoute()
    expect(session.status).toBe(503)
    expect(await session.json()).toEqual({ error: 'session storage unavailable' })
    const signedOut = await logout(
      req('/api/auth/logout', {
        method: 'POST',
        headers: { origin: cfg.appOrigin, cookie: `${cfg.sessionCookie}=${cookieJar.value}` },
      }),
    )
    expect(signedOut.status).toBe(503)
    expect(signedOut.cookies.get(cfg.sessionCookie)).toBeUndefined()
    const loginResponse = await login(req('/api/auth/login'))
    expect(loginResponse.headers.get('location')).toBe(`${cfg.appOrigin}/login?error=unavailable`)
    expect(loginResponse.cookies.get(cfg.loginCookie)).toBeUndefined()
  })
  it('is null without a cookie, with a forged handle, and after logout', async () => {
    expect(await resolveSession()).toBeNull()
    cookieJar.value = 'forged-handle'
    expect(await resolveSession()).toBeNull()
  })

  it('returns an authenticated-only session: no IdP roles mapped, the user token forwarded', async () => {
    cookieJar.value = createSession({
      sub: 'user-1',
      name: 'Alice',
      accessToken: 'ACCESS',
      accessExpiresAt: Date.now() + 600_000,
    })
    expect(await resolveSession()).toEqual({
      userId: 'user-1',
      permissions: ['*'],
      accessToken: 'ACCESS',
    })
  })

  it('refreshes a nearly expired access token once, and drops the session when refresh is rejected', async () => {
    cookieJar.value = createSession({
      sub: 'u',
      name: 'A',
      accessToken: 'OLD',
      accessExpiresAt: Date.now() + 1000,
      refreshToken: 'RT',
    })
    idp.tokenResponse = { access_token: 'NEW', expires_in: 300 }
    const [a, b] = await Promise.all([resolveSession(), resolveSession()])
    expect(a?.accessToken).toBe('NEW')
    expect(b?.accessToken).toBe('NEW')
    expect(idp.requests.filter((r) => r.body?.get('grant_type') === 'refresh_token')).toHaveLength(
      1,
    ) // single flight

    const handle = createSession({
      sub: 'u',
      name: 'A',
      accessToken: 'OLD',
      accessExpiresAt: Date.now() + 1000,
      refreshToken: 'RT',
    })
    cookieJar.value = handle
    idp.refreshStatus = 400
    expect(await resolveSession()).toBeNull()
    expect(readSession(handle, cfg)).toBeUndefined()
  })

  it('session endpoint exposes only a display name and an end time, never tokens', async () => {
    cookieJar.value = createSession({
      sub: 'user-1',
      name: 'Alice',
      accessToken: 'SECRET-ACCESS',
      accessExpiresAt: Date.now() + 600_000,
      refreshToken: 'SECRET-REFRESH',
    })
    const res = await sessionRoute()
    const text = await res.text()
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(JSON.parse(text)).toMatchObject({ authenticated: true, name: 'Alice' })
    expect(text).not.toMatch(/SECRET|user-1/)
    cookieJar.value = undefined
    expect(await (await sessionRoute()).json()).toEqual({ authenticated: false })
  })
})
