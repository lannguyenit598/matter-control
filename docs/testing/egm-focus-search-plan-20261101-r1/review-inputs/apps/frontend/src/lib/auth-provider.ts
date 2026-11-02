import 'server-only'

import { createHash } from 'node:crypto'

import { cookies } from 'next/headers'

import type { Session } from './auth'
import { oidcConfig } from './oidc/config'
import { liveSession } from './oidc/session'

let warned = false

/**
 * AUTHENTICATION INTEGRATION POINT, implemented for the local ZITADEL profile.
 *
 * The browser holds only an opaque, random session handle. The server-side store (session-store.ts)
 * holds the tokens, so nothing token-shaped is ever readable by the page or its scripts.
 *
 * `permissions: ['*']` is deliberate: this layer only asserts "authenticated". Workspace, Matter
 * and operation rights are decided by the Go API on every call (it receives `accessToken`), never
 * by IdP roles or claims here. FAIL-CLOSED: no configuration, cookie or live session means null.
 */
export async function resolveSession(): Promise<Session | null> {
  const cfg = oidcConfig()
  if (!cfg) {
    if (!warned) {
      warned = true
      console.warn(
        '[auth] OIDC sign-in is not configured (OIDC_*/APP_ORIGIN): all REST access is denied.',
      )
    }
    return null
  }
  const handle = (await cookies()).get(cfg.sessionCookie)?.value
  if (!handle) return null
  const live = await liveSession(cfg, handle)
  if (!live) return null
  return { userId: live.record.sub, permissions: ['*'], accessToken: live.accessToken }
}

/** Display-only facts about the signed-in caller (no tokens). */
export async function currentPrincipal(): Promise<{ name: string; sessionEndsAt: number } | null> {
  const cfg = oidcConfig()
  if (!cfg) return null
  const handle = (await cookies()).get(cfg.sessionCookie)?.value
  if (!handle) return null
  const live = await liveSession(cfg, handle)
  if (!live) return null
  return {
    name: live.record.name,
    sessionEndsAt: Math.min(
      live.record.createdAt + cfg.absoluteMs,
      live.record.lastSeenAt + cfg.idleMs,
    ),
  }
}

/**
 * An opaque, per-session namespace for kept form drafts: a one-way hash of the session handle, so
 * another sign-in never sees this one's drafts and the value cannot be turned back into the handle.
 * Null when not signed in (drafts are then disabled).
 */
export async function draftNamespace(): Promise<string | null> {
  const cfg = oidcConfig()
  if (!cfg) return null
  const handle = (await cookies()).get(cfg.sessionCookie)?.value
  if (!handle || !(await liveSession(cfg, handle))) return null
  return createHash('sha256').update(`mc-draft:${handle}`).digest('hex').slice(0, 24)
}
