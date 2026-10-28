import 'server-only'

import { randomBytes } from 'node:crypto'

/**
 * Server-side session store (contract §1): tokens live here, never in a cookie. The cookie
 * carries only the opaque random handle. In-process on purpose for the local profile: sessions
 * do not survive a restart (users sign in again). A durable store is a production decision,
 * swappable behind these functions.
 */
export type SessionRecord = {
  /** Issuer subject. Display/identity only; it grants nothing. */
  sub: string
  name: string
  accessToken: string
  accessExpiresAt: number
  refreshToken?: string
  createdAt: number
  lastSeenAt: number
}

export type Limits = { idleMs: number; absoluteMs: number }

// One Map per process, kept on globalThis: dev module re-evaluation (HMR) and route-bundle
// duplication would otherwise create several stores and log users out at random.
const g = globalThis as typeof globalThis & { __mcSessions?: Map<string, SessionRecord> }
const sessions = (g.__mcSessions ??= new Map<string, SessionRecord>())
const MAX_SESSIONS = 5000

export function newHandle(): string {
  return randomBytes(32).toString('base64url')
}

export function createSession(
  rec: Omit<SessionRecord, 'createdAt' | 'lastSeenAt'>,
  now = Date.now(),
): string {
  if (sessions.size >= MAX_SESSIONS) {
    // ponytail: evict the oldest handle when full; a real store enforces quotas per user.
    const oldest = sessions.keys().next().value
    if (oldest !== undefined) sessions.delete(oldest)
  }
  const handle = newHandle()
  sessions.set(handle, { ...rec, createdAt: now, lastSeenAt: now })
  return handle
}

/** The live record for a handle, refreshing its idle clock; undefined when unknown or expired. */
export function readSession(
  handle: string,
  limits: Limits,
  now = Date.now(),
): SessionRecord | undefined {
  const rec = sessions.get(handle)
  if (!rec) return undefined
  if (now - rec.lastSeenAt > limits.idleMs || now - rec.createdAt > limits.absoluteMs) {
    sessions.delete(handle)
    return undefined
  }
  rec.lastSeenAt = now
  return rec
}

export function updateSession(handle: string, patch: Partial<SessionRecord>): void {
  const rec = sessions.get(handle)
  if (rec) Object.assign(rec, patch)
}

export function destroySession(handle: string): SessionRecord | undefined {
  const rec = sessions.get(handle)
  sessions.delete(handle)
  return rec
}

/** Test seam: the number of live handles. */
export function sessionCount(): number {
  return sessions.size
}

/** Test seam: wipe the store. */
export function resetSessions(): void {
  sessions.clear()
}
