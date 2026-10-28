import 'server-only'

import { type OidcConfig } from './config'
import { OidcError, refreshTokens } from './flow'
import { destroySession, readSession, updateSession, type SessionRecord } from './session-store'

const REFRESH_WINDOW_MS = 30_000

const g = globalThis as typeof globalThis & { __mcRefreshing?: Map<string, Promise<string | null>> }
const refreshing = (g.__mcRefreshing ??= new Map())

/**
 * The live session for a cookie handle with a usable access token, or null when the handle is
 * unknown, expired, or its refresh token was rejected (the session is then destroyed).
 * A refresh runs once per session at a time. If the issuer is unreachable the current token is
 * returned: the product API decides, and fails closed itself.
 */
export async function liveSession(
  cfg: OidcConfig,
  handle: string,
  now = Date.now(),
): Promise<{ record: SessionRecord; accessToken: string } | null> {
  const record = readSession(handle, cfg, now)
  if (!record) return null
  if (record.accessExpiresAt - now > REFRESH_WINDOW_MS || !record.refreshToken) {
    return { record, accessToken: record.accessToken }
  }
  let pending = refreshing.get(handle)
  if (!pending) {
    pending = doRefresh(cfg, handle, record.refreshToken, now).finally(() =>
      refreshing.delete(handle),
    )
    refreshing.set(handle, pending)
  }
  const token = await pending
  return token ? { record, accessToken: token } : null
}

async function doRefresh(
  cfg: OidcConfig,
  handle: string,
  refreshToken: string,
  now: number,
): Promise<string | null> {
  try {
    const next = await refreshTokens(cfg, refreshToken, now)
    updateSession(handle, next)
    return next.accessToken
  } catch (error) {
    if (error instanceof OidcError && error.code === 'invalid') {
      destroySession(handle)
      return null
    }
    return readSession(handle, cfg, now)?.accessToken ?? null
  }
}
