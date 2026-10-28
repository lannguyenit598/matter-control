import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto'

import { vi } from 'vitest'

import type { OidcConfig } from '@/lib/oidc/config'

/** Test double of the issuer: discovery, JWKS and a token endpoint, wired into global fetch. */
export const ISSUER = 'http://idp.test'

export const cfg: OidcConfig = {
  issuer: ISSUER,
  clientId: 'web-client',
  projectId: 'project-1',
  appOrigin: 'http://app.test',
  redirectUri: 'http://app.test/api/auth/callback',
  cookieSecure: false,
  sessionCookie: 'mc_session',
  loginCookie: 'mc_login',
  idleMs: 8 * 3600_000,
  absoluteMs: 24 * 3600_000,
}

const b64 = (v: unknown) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url')

export class FakeIdp {
  readonly key: { privateKey: KeyObject; publicKey: KeyObject }
  readonly kid = 'k1'
  tokenResponse: Record<string, unknown> = {}
  tokenStatus = 200
  refreshStatus = 200
  jwksKeys: unknown[]
  requests: { url: string; body: URLSearchParams | undefined }[] = []
  down = false

  constructor() {
    this.key = generateKeyPairSync('rsa', { modulusLength: 2048 })
    this.jwksKeys = [
      { ...this.key.publicKey.export({ format: 'jwk' }), kid: this.kid, use: 'sig', alg: 'RS256' },
    ]
  }

  sign(
    claims: Record<string, unknown>,
    opts: { alg?: string; kid?: string; key?: KeyObject } = {},
  ): string {
    const header = b64({ alg: opts.alg ?? 'RS256', kid: opts.kid ?? this.kid, typ: 'JWT' })
    const payload = b64(claims)
    const sig = createSign('RSA-SHA256')
      .update(`${header}.${payload}`)
      .sign(opts.key ?? this.key.privateKey)
    return `${header}.${payload}.${sig.toString('base64url')}`
  }

  idToken(
    nonce: string,
    over: Record<string, unknown> = {},
    opts: Parameters<FakeIdp['sign']>[1] = {},
  ) {
    const now = Math.floor(Date.now() / 1000)
    return this.sign(
      {
        iss: ISSUER,
        aud: [cfg.clientId, 'project-1'],
        sub: 'user-1',
        name: 'Alice Tester',
        exp: now + 300,
        iat: now,
        nonce,
        ...over,
      },
      opts,
    )
  }

  install() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = String(input)
        const body = init?.body instanceof URLSearchParams ? init.body : undefined
        this.requests.push({ url, body })
        if (this.down) throw new TypeError('connect ECONNREFUSED')
        const json = (status: number, data: unknown) =>
          new Response(JSON.stringify(data), { status })
        if (url.endsWith('/.well-known/openid-configuration')) {
          return json(200, {
            issuer: ISSUER,
            authorization_endpoint: `${ISSUER}/oauth/v2/authorize`,
            token_endpoint: `${ISSUER}/oauth/v2/token`,
            jwks_uri: `${ISSUER}/oauth/v2/keys`,
            revocation_endpoint: `${ISSUER}/oauth/v2/revoke`,
          })
        }
        if (url.endsWith('/oauth/v2/keys')) return json(200, { keys: this.jwksKeys })
        if (url.endsWith('/oauth/v2/token')) {
          const refresh = body?.get('grant_type') === 'refresh_token'
          return json(refresh ? this.refreshStatus : this.tokenStatus, this.tokenResponse)
        }
        if (url.endsWith('/oauth/v2/revoke')) return json(200, {})
        return json(404, {})
      }),
    )
  }
}
