import 'server-only'

import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto'

import type { OidcConfig } from './config'

/**
 * Authorization Code + PKCE (S256) with state and nonce against one pinned issuer. The ID token
 * signature is verified against the issuer's JWKS; iss, aud, exp and nonce are checked. Nothing
 * here parses an opaque access token: it is stored and forwarded as received.
 */

const TIMEOUT_MS = 8000
const LOGIN_TTL_MS = 10 * 60 * 1000
const CLOCK_SKEW_S = 60

export class OidcError extends Error {
  constructor(
    readonly code: 'unavailable' | 'invalid',
    message: string,
  ) {
    super(message)
    this.name = 'OidcError'
  }
}

type Discovery = {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  revocation_endpoint?: string
}

const g = globalThis as typeof globalThis & {
  __mcDiscovery?: Map<string, Discovery>
  __mcLogins?: Map<string, PendingLogin>
}
const discoveryCache = (g.__mcDiscovery ??= new Map())
const pendingLogins = (g.__mcLogins ??= new Map())

type PendingLogin = { verifier: string; nonce: string; returnTo: string; expiresAt: number }

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  let res: Response
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
  } catch {
    throw new OidcError('unavailable', 'identity provider unreachable')
  }
  const text = await res.text()
  try {
    return { status: res.status, body: text ? JSON.parse(text) : undefined }
  } catch {
    // skip: a non-JSON body from the issuer is treated as an unavailable provider
    throw new OidcError('unavailable', 'identity provider returned a non-JSON response')
  }
}

export async function discover(cfg: OidcConfig): Promise<Discovery> {
  const cached = discoveryCache.get(cfg.issuer)
  if (cached) return cached
  const { status, body } = await fetchJson(`${cfg.issuer}/.well-known/openid-configuration`)
  const doc = body as Partial<Discovery> | undefined
  if (status !== 200 || !doc || doc.issuer !== cfg.issuer) {
    throw new OidcError('invalid', 'discovery document does not match the pinned issuer')
  }
  const origin = new URL(cfg.issuer).origin
  for (const key of ['authorization_endpoint', 'token_endpoint', 'jwks_uri'] as const) {
    const value = doc[key]
    if (typeof value !== 'string' || new URL(value).origin !== origin) {
      throw new OidcError('invalid', `discovery ${key} is missing or outside the issuer origin`)
    }
  }
  discoveryCache.set(cfg.issuer, doc as Discovery)
  return doc as Discovery
}

const b64url = (buf: Buffer) => buf.toString('base64url')

const DEFAULT_RETURN = '/workspaces'
// Origin used only to canonicalize a candidate; the decision is "stays on the same origin".
const PROBE_ORIGIN = 'http://return-to.invalid'
// C0/C1 controls and DEL: the URL parser silently strips TAB/CR/LF, which turns "/<TAB>/host"
// into the protocol-relative "//host".
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f-\u009f\\]/

/**
 * A post-login target: only a same-origin, in-app path. Anything ambiguous (control characters,
 * backslashes, protocol-relative or absolute forms, other origins) falls back to the default.
 * The result is canonicalized (path + query) so what is stored is what will be used.
 */
export function safeReturnTo(
  raw: string | null | undefined,
  appOrigin: string = PROBE_ORIGIN,
): string {
  if (!raw || raw.length > 2048 || CONTROL_OR_BACKSLASH.test(raw)) return DEFAULT_RETURN
  if (!raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_RETURN
  let url: URL
  try {
    url = new URL(raw, appOrigin)
  } catch {
    return DEFAULT_RETURN
  }
  if (url.origin !== new URL(appOrigin).origin) return DEFAULT_RETURN
  const path = url.pathname + url.search
  // Never bounce back into the auth routes or the sign-in page (login loops).
  if (url.pathname.startsWith('/api/auth/') || url.pathname === '/login') return DEFAULT_RETURN
  return path
}

/** The redirect target for the callback: re-validated against the configured origin at use time. */
export function resolveReturnTo(returnTo: string, appOrigin: string): URL {
  return new URL(safeReturnTo(returnTo, appOrigin), appOrigin)
}

export async function beginLogin(
  cfg: OidcConfig,
  returnTo: string,
  now = Date.now(),
): Promise<{ url: string; state: string }> {
  const d = await discover(cfg)
  for (const [state, p] of pendingLogins) if (p.expiresAt < now) pendingLogins.delete(state)
  const state = b64url(randomBytes(32))
  const nonce = b64url(randomBytes(32))
  const verifier = b64url(randomBytes(48))
  pendingLogins.set(state, {
    verifier,
    nonce,
    returnTo: safeReturnTo(returnTo, cfg.appOrigin),
    expiresAt: now + LOGIN_TTL_MS,
  })
  const url = new URL(d.authorization_endpoint)
  url.search = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: `openid profile email offline_access urn:zitadel:iam:org:project:id:${cfg.projectId}:aud`,
    code_challenge: b64url(createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
    state,
    nonce,
  }).toString()
  return { url: url.toString(), state }
}

export type Tokens = {
  accessToken: string
  accessExpiresAt: number
  refreshToken?: string
  sub: string
  name: string
}

/** Completes the callback. `cookieState` must equal `state`: it binds the flow to this browser. */
export async function completeLogin(
  cfg: OidcConfig,
  params: { code: string; state: string; cookieState: string | undefined },
  now = Date.now(),
): Promise<{ tokens: Tokens; returnTo: string }> {
  const pending = pendingLogins.get(params.state)
  pendingLogins.delete(params.state) // single use, whatever happens next
  if (
    !pending ||
    pending.expiresAt < now ||
    !params.cookieState ||
    params.cookieState !== params.state
  ) {
    throw new OidcError('invalid', 'unknown, expired or unbound login state')
  }
  const d = await discover(cfg)
  const { status, body } = await fetchJson(d.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      code_verifier: pending.verifier,
    }),
  })
  const t = body as
    | { access_token?: string; id_token?: string; refresh_token?: string; expires_in?: number }
    | undefined
  if (status !== 200 || !t?.access_token || !t.id_token) {
    throw new OidcError('invalid', 'token endpoint refused the authorization code')
  }
  const claims = await verifyIdToken(cfg, d, t.id_token, pending.nonce, now)
  return {
    tokens: {
      accessToken: t.access_token,
      accessExpiresAt: now + (t.expires_in ?? 300) * 1000,
      refreshToken: t.refresh_token,
      sub: claims.sub,
      name: claims.name,
    },
    returnTo: pending.returnTo,
  }
}

export async function refreshTokens(
  cfg: OidcConfig,
  refreshToken: string,
  now = Date.now(),
): Promise<Pick<Tokens, 'accessToken' | 'accessExpiresAt' | 'refreshToken'>> {
  const d = await discover(cfg)
  const { status, body } = await fetchJson(d.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: cfg.clientId,
    }),
  })
  const t = body as
    { access_token?: string; refresh_token?: string; expires_in?: number } | undefined
  if (status >= 500) throw new OidcError('unavailable', 'identity provider unavailable')
  if (status !== 200 || !t?.access_token) throw new OidcError('invalid', 'refresh token rejected')
  return {
    accessToken: t.access_token,
    accessExpiresAt: now + (t.expires_in ?? 300) * 1000,
    refreshToken: t.refresh_token ?? refreshToken,
  }
}

/** Best-effort RFC 7009 revocation: logout never fails because the issuer is down. */
export async function revokeToken(cfg: OidcConfig, token: string): Promise<void> {
  try {
    const d = await discover(cfg)
    const endpoint = d.revocation_endpoint ?? `${cfg.issuer}/oauth/v2/revoke`
    await fetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token, client_id: cfg.clientId }),
    })
  } catch {
    // skip: best effort by contract; the server-side session is already destroyed
  }
}

type Jwk = { kid?: string; kty: string; alg?: string; use?: string; n?: string; e?: string }

async function signingKey(d: Discovery, kid: string | undefined) {
  const load = async () => {
    const { status, body } = await fetchJson(d.jwks_uri)
    if (status !== 200) throw new OidcError('unavailable', 'JWKS unavailable')
    return ((body as { keys?: Jwk[] })?.keys ?? []).filter((k) => k.kty === 'RSA')
  }
  let keys = await load()
  let jwk = keys.find((k) => k.kid === kid)
  if (!jwk) {
    keys = await load() // rotated key: one refetch, no more
    jwk = keys.find((k) => k.kid === kid)
  }
  if (!jwk) throw new OidcError('invalid', 'ID token signed with an unknown key')
  return createPublicKey({ key: jwk as never, format: 'jwk' })
}

const decodePart = (part: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>

export async function verifyIdToken(
  cfg: OidcConfig,
  d: Discovery,
  token: string,
  nonce: string,
  now = Date.now(),
): Promise<{ sub: string; name: string }> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new OidcError('invalid', 'malformed ID token')
  let header: Record<string, unknown>
  let claims: Record<string, unknown>
  try {
    header = decodePart(parts[0]!)
    claims = decodePart(parts[1]!)
  } catch {
    throw new OidcError('invalid', 'malformed ID token')
  }
  if (header.alg !== 'RS256') throw new OidcError('invalid', 'unsupported ID token algorithm')
  const key = await signingKey(d, typeof header.kid === 'string' ? header.kid : undefined)
  const ok = verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    key,
    Buffer.from(parts[2]!, 'base64url'),
  )
  if (!ok) throw new OidcError('invalid', 'ID token signature is invalid')
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  const nowS = Math.floor(now / 1000)
  if (
    claims.iss !== cfg.issuer ||
    !aud.includes(cfg.clientId) ||
    typeof claims.exp !== 'number' ||
    claims.exp + CLOCK_SKEW_S < nowS ||
    claims.nonce !== nonce ||
    typeof claims.sub !== 'string' ||
    claims.sub === ''
  ) {
    throw new OidcError('invalid', 'ID token claims do not match this login')
  }
  const name = [claims.name, claims.preferred_username, claims.email].find(
    (v) => typeof v === 'string' && v,
  ) as string | undefined
  return { sub: claims.sub, name: name ?? claims.sub }
}

/** Test seam. */
export function resetOidcState(): void {
  discoveryCache.clear()
  pendingLogins.clear()
}
