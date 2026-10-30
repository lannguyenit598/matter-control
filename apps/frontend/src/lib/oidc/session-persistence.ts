import 'server-only'

import { randomBytes } from 'node:crypto'

import type { OidcConfig } from './config'
import { durableState, stateKey, type StateStore, type StateTransaction } from './durable-state'
import { OidcError, refreshTokens, type Tokens } from './flow'
import { createSession, destroySession, type SessionRecord } from './session-store'

type StoredSession = SessionRecord & {
  refreshAttempt?: { id: string; startedAt: number; unknown?: boolean }
}

export function sessionKey(cfg: OidcConfig, handle: string) {
  return stateKey(cfg, 'session', handle)
}

function valid(rec: SessionRecord, cfg: OidcConfig, now: number) {
  return now < rec.createdAt + cfg.absoluteMs && now < rec.lastSeenAt + cfg.idleMs
}

export async function createPersistentSession(
  cfg: OidcConfig,
  tokens: Tokens,
  now = Date.now(),
  store = durableState(),
) {
  if (!store) return createSession(tokens, now)
  const handle = randomBytes(32).toString('base64url')
  const key = sessionKey(cfg, handle)
  await store.transaction(key, (tx) =>
    tx.write(key, { ...tokens, createdAt: now, lastSeenAt: now }, now + cfg.absoluteMs),
  )
  return handle
}

export async function destroyPersistentSession(
  cfg: OidcConfig,
  handle: string,
  store = durableState(),
) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(handle)) return undefined
  if (!store) return destroySession(handle)
  const key = sessionKey(cfg, handle)
  return store.transaction(key, async (tx) => {
    const rec = await tx.read<StoredSession>(key)
    await tx.removeFamily(key)
    return rec
  })
}

/** Serializes auth and its child attempts against logout on the same durable session lock. */
export async function withPersistentSession<R>(
  cfg: OidcConfig,
  handle: string,
  store: StateStore,
  body: (tx: StateTransaction, key: string, record: StoredSession) => Promise<R>,
  now = Date.now(),
) {
  const key = sessionKey(cfg, handle)
  return store.transaction(key, async (tx) => {
    const rec = await tx.read<StoredSession>(key)
    if (!rec || !valid(rec, cfg, now)) {
      await tx.removeFamily(key)
      return undefined
    }
    return body(tx, key, rec)
  })
}

/**
 * Claim is committed BEFORE talking to the IdP. Only the winner sends the rotating token.
 * A crash/unknown answer never releases the claim for automatic reuse. Logout deletes the
 * session under the same lock; completing an old refresh cannot recreate it.
 */
export async function livePersistentSession(
  cfg: OidcConfig,
  handle: string,
  store: StateStore,
  now = Date.now(),
  refresh = refreshTokens,
): Promise<{ record: SessionRecord; accessToken: string } | null> {
  const claim = await withPersistentSession(
    cfg,
    handle,
    store,
    async (tx, key, record) => {
      if (!record.refreshToken && record.accessExpiresAt <= now) {
        await tx.removeFamily(key)
        return undefined
      }
      if (record.accessExpiresAt - now > 30_000 || !record.refreshToken) {
        record.lastSeenAt = now
        await tx.write(key, record, record.createdAt + cfg.absoluteMs)
        return { record, winner: false }
      }
      if (record.refreshAttempt) return { record, winner: false }
      record.lastSeenAt = now
      record.refreshAttempt = { id: randomBytes(16).toString('hex'), startedAt: now }
      await tx.write(key, record, record.createdAt + cfg.absoluteMs)
      return { record, winner: true }
    },
    now,
  )
  if (!claim) return null
  if (!claim.winner) {
    if (claim.record.refreshAttempt) {
      // Wait boundedly for the winning request, including one running in another isolate.
      const deadline = Date.now() + 8500
      while (!claim.record.refreshAttempt.unknown && Date.now() < deadline) {
        const latest = await withPersistentSession(
          cfg,
          handle,
          store,
          async (_tx, _key, rec) => rec,
          now,
        )
        if (!latest) return null
        if (!latest.refreshAttempt)
          return { record: { ...latest, sessionHandle: handle }, accessToken: latest.accessToken }
        if (latest.refreshAttempt.unknown || Date.now() - latest.refreshAttempt.startedAt > 8500)
          break
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      // No new IdP call. An already expired token is never returned as a live session.
      if (claim.record.accessExpiresAt <= now) return null
    }
    return {
      record: { ...claim.record, sessionHandle: handle },
      accessToken: claim.record.accessToken,
    }
  }
  try {
    const next = await refresh(cfg, claim.record.refreshToken!, now)
    const record = await withPersistentSession(
      cfg,
      handle,
      store,
      async (tx, key, rec) => {
        if (rec.refreshAttempt?.id !== claim.record.refreshAttempt?.id) return undefined
        const updated = { ...rec, ...next }
        delete updated.refreshAttempt
        await tx.write(key, updated, updated.createdAt + cfg.absoluteMs)
        return updated
      },
      now,
    )
    return record
      ? { record: { ...record, sessionHandle: handle }, accessToken: record.accessToken }
      : null
  } catch (error) {
    const rec = await withPersistentSession(
      cfg,
      handle,
      store,
      async (tx, key, current) => {
        if (current.refreshAttempt?.id !== claim.record.refreshAttempt?.id) return undefined
        if (error instanceof OidcError && error.code === 'invalid') {
          await tx.removeFamily(key)
          return undefined
        }
        current.refreshAttempt!.unknown = true
        await tx.write(key, current, current.createdAt + cfg.absoluteMs)
        return current
      },
      now,
    )
    return rec && rec.accessExpiresAt > now
      ? { record: { ...rec, sessionHandle: handle }, accessToken: rec.accessToken }
      : null
  }
}
