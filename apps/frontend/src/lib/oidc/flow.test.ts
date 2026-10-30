// @vitest-environment node
import { createHash, generateKeyPairSync } from 'node:crypto'

import { beforeEach, describe, expect, it } from 'vitest'

import { cfg, FakeIdp, ISSUER } from '@/test/fake-idp'

import {
  beginLogin,
  completeLogin,
  OidcError,
  refreshTokens,
  resetOidcState,
  resolveReturnTo,
  safeReturnTo,
} from './flow'

let idp: FakeIdp

beforeEach(() => {
  resetOidcState()
  idp = new FakeIdp()
  idp.install()
})

async function start() {
  const { url, state } = await beginLogin(cfg, '/matters/1')
  return { params: new URL(url).searchParams, state }
}

function respondWith(
  nonce: string,
  over: Record<string, unknown> = {},
  opts?: Parameters<FakeIdp['sign']>[1],
) {
  idp.tokenResponse = {
    access_token: 'ACCESS-TOKEN-OPAQUE',
    refresh_token: 'REFRESH-TOKEN',
    expires_in: 300,
    id_token: idp.idToken(nonce, over, opts),
  }
}

describe('beginLogin', () => {
  it('builds a PKCE S256 request with state, nonce and the project audience scope', async () => {
    const { params, state } = await start()
    expect(params.get('response_type')).toBe('code')
    expect(params.get('client_id')).toBe(cfg.clientId)
    expect(params.get('redirect_uri')).toBe(cfg.redirectUri)
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('state')).toBe(state)
    expect(params.get('nonce')).toBeTruthy()
    expect(params.get('scope')).toContain('openid')
    expect(params.get('scope')).toContain('offline_access')
    expect(params.get('scope')).toContain('urn:zitadel:iam:org:project:id:project-1:aud')
    expect(params.get('client_secret')).toBeNull()
  })

  it('refuses a discovery document for a different issuer (mix-up)', async () => {
    resetOidcState()
    await expect(beginLogin({ ...cfg, issuer: 'http://other.test' }, '/')).rejects.toMatchObject({
      code: 'invalid',
    })
  })

  it('reports an unreachable issuer as unavailable, not as a denial', async () => {
    resetOidcState()
    idp.down = true
    await expect(beginLogin(cfg, '/')).rejects.toMatchObject({ code: 'unavailable' })
  })
})

describe('completeLogin', () => {
  it('never uses the technical subject as the display name when profile claims are absent', async () => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!, { name: null, preferred_username: null, email: null })
    const out = await completeLogin(cfg, { code: 'c', state, cookieState: state })
    expect(out.tokens).toMatchObject({ sub: 'user-1', name: 'My account' })
  })
  it('exchanges the code with the matching PKCE verifier and returns verified identity', async () => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!)
    const out = await completeLogin(cfg, { code: 'c', state, cookieState: state })
    expect(out.returnTo).toBe('/matters/1')
    expect(out.tokens).toMatchObject({
      accessToken: 'ACCESS-TOKEN-OPAQUE',
      refreshToken: 'REFRESH-TOKEN',
      sub: 'user-1',
      name: 'Alice Tester',
    })
    const exchange = idp.requests.find((r) => r.url.endsWith('/oauth/v2/token'))!.body!
    expect(exchange.get('grant_type')).toBe('authorization_code')
    const verifier = exchange.get('code_verifier')!
    expect(createHash('sha256').update(verifier).digest('base64url')).toBe(
      params.get('code_challenge'),
    )
  })

  it.each([
    [
      'no state cookie (not bound to this browser)',
      (s: string) => ({ state: s, cookieState: undefined }),
    ],
    ['a different state cookie', (s: string) => ({ state: s, cookieState: s + 'x' })],
    ['an unknown state', () => ({ state: 'never-issued', cookieState: 'never-issued' })],
  ])('rejects %s', async (_n, mk) => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!)
    await expect(completeLogin(cfg, { code: 'c', ...mk(state) })).rejects.toBeInstanceOf(OidcError)
  })

  it('accepts a state exactly once (replay is refused)', async () => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!)
    await completeLogin(cfg, { code: 'c', state, cookieState: state })
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toBeInstanceOf(OidcError)
  })

  it('rejects a login state older than ten minutes', async () => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!)
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }, Date.now() + 11 * 60_000),
    ).rejects.toBeInstanceOf(OidcError)
  })

  const claimCases: [string, (n: string) => Record<string, unknown>][] = [
    ['a wrong nonce', () => ({ nonce: 'other' })],
    ['a wrong issuer', () => ({ iss: 'http://evil.test' })],
    ['an audience without this client', () => ({ aud: ['someone-else'] })],
    ['an expired token', () => ({ exp: Math.floor(Date.now() / 1000) - 3600 })],
    ['an empty subject', () => ({ sub: '' })],
  ]
  it.each(claimCases)('rejects %s', async (_n, over) => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!, over(params.get('nonce')!))
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('rejects a token signed with another key (signature is really verified)', async () => {
    const { params, state } = await start()
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 })
    respondWith(params.get('nonce')!, {}, { key: other.privateKey })
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('rejects alg=none and HS256 downgrade attempts', async () => {
    for (const alg of ['none', 'HS256']) {
      resetOidcState()
      const { params, state } = await start()
      respondWith(params.get('nonce')!, {}, { alg })
      await expect(
        completeLogin(cfg, { code: 'c', state, cookieState: state }),
      ).rejects.toMatchObject({ code: 'invalid' })
    }
  })

  it('rejects an unknown key id after exactly one JWKS refetch', async () => {
    const { params, state } = await start()
    respondWith(params.get('nonce')!, {}, { kid: 'rotated' })
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toMatchObject({ code: 'invalid' })
    expect(idp.requests.filter((r) => r.url.endsWith('/oauth/v2/keys'))).toHaveLength(2)
  })

  it('treats a refused code as invalid', async () => {
    const { state } = await start()
    idp.tokenStatus = 400
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })
})

describe('refreshTokens', () => {
  it('rotates tokens and keeps the old refresh token when none is returned', async () => {
    idp.tokenResponse = { access_token: 'AT2', expires_in: 60 }
    const out = await refreshTokens(cfg, 'RT1', 1000)
    expect(out).toEqual({ accessToken: 'AT2', accessExpiresAt: 61000, refreshToken: 'RT1' })
  })
  it('maps a rejected refresh token to invalid and an outage to unavailable', async () => {
    idp.refreshStatus = 400
    await expect(refreshTokens(cfg, 'RT')).rejects.toMatchObject({ code: 'invalid' })
    idp.refreshStatus = 503
    await expect(refreshTokens(cfg, 'RT')).rejects.toMatchObject({ code: 'unavailable' })
  })
})

describe('safeReturnTo', () => {
  const ORIGIN = 'http://app.test'
  it.each([
    ['/matters/1?x=1', '/matters/1?x=1'],
    ['/workspaces/a-b/c', '/workspaces/a-b/c'],
    ['/matters/1#frag', '/matters/1'],
    ['/a%2F%2Fb', '/a%2F%2Fb'], // an encoded slash stays inside the path
    ['/a/b/../c?x=1', '/a/c?x=1'], // normal dot segments are canonicalized as before
    ['/a/./b', '/a/b'],
    [null, '/workspaces'],
    [undefined, '/workspaces'],
    ['', '/workspaces'],
  ])('keeps a legitimate in-app target: %s', (input, expected) =>
    expect(safeReturnTo(input, ORIGIN)).toBe(expected),
  )

  it.each([
    ['slash TAB slash (reviewer repro)', '/\t/attacker.invalid'],
    ['slash LF slash', '/\n/attacker.invalid'],
    ['slash CR slash', '/\r/attacker.invalid'],
    ['TAB inside the path', '/a\tb'],
    ['NUL', '/a\u0000b'],
    ['C1 control', '/a\u0085b'],
    ['DEL', '/a\u007fb'],
    ['protocol-relative', '//attacker.invalid/'],
    ['triple slash', '///attacker.invalid'],
    ['backslash after slash', '/\\attacker.invalid'],
    ['leading backslash', '\\attacker.invalid'],
    ['backslash inside', '/a\\b'],
    ['absolute http', 'http://attacker.invalid/'],
    ['absolute https', 'https://attacker.invalid/'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/html,x'],
    ['leading space then slashes', ' //attacker.invalid'],
    ['relative path', 'workspaces'],
    ['auth route (loop)', '/api/auth/logout'],
    ['sign-in page (loop)', '/login'],
    ['sign-in page with query', '/login?returnTo=/x'],
    ['dot segments into the sign-in page', '/x/../login'],
    ['dot segments into the auth routes', '/matters/../api/auth/logout'],
    ['dot segments normalize to protocol-relative', '/..//attacker.invalid'],
    ['dot segments below a path', '/x/..//attacker.invalid'],
    ['dot segments, deeper', '/a/../..//attacker.invalid'],
    ['dot segments, triple slash', '/..///attacker.invalid'],
    ['encoded dot segments', '/%2e%2e//attacker.invalid'],
    ['single dot then slash', '/.//attacker.invalid'],
    ['too long', '/' + 'a'.repeat(3000)],
  ])('falls back for %s', (_name, input) => expect(safeReturnTo(input, ORIGIN)).toBe('/workspaces'))

  it('never yields something that leaves the configured origin once resolved', () => {
    const hostile = [
      '/\t/x.test',
      '/\n/x.test',
      '//x.test',
      '/\\x.test',
      'http://x.test',
      '/\r\n/x.test',
      '/ /x.test',
      '/..//x.test', // canonicalizes to //x.test
      '/a/../..//x.test',
      '/%2e%2e//x.test',
    ]
    for (const input of hostile) {
      expect(resolveReturnTo(input, ORIGIN).origin).toBe(ORIGIN)
    }
    expect(resolveReturnTo('/matters/1?a=b', ORIGIN).href).toBe('http://app.test/matters/1?a=b')
    expect(resolveReturnTo('/..//x.test', ORIGIN).href).toBe('http://app.test/workspaces')
  })

  it('canonicalizes with the configured origin, not a guessed one', () => {
    expect(safeReturnTo('/x', 'http://localhost:3000')).toBe('/x')
  })
})

it('pins the issuer used in tests', () => expect(ISSUER).toBe(cfg.issuer))
