/**
 * Form drafts survive navigation and re-render while the identity and scope still allow them
 * (session storage: gone with the tab). A draft is keyed by an opaque per-session namespace plus
 * the exact scope/intent, so another sign-in or another record never sees it. They are cleared on
 * success, discard, revoked access and logout: nothing is revived after the right to see it ends.
 * Storage can be blocked or full; every call tolerates that and the form works without drafts.
 *
 * A receipted creation whose answer was lost also keeps its attempt (the idempotency key and the
 * exact values that were sent) under the same namespace and scope, so a reload does not turn the
 * safe same-key retry into a new key. It is cleared with the draft, on success, refusal, discard,
 * revoked access and logout. Nothing here is a token, a file or a credential.
 */
import { UUID_V7 } from './idempotency'

const PREFIX = 'mc:draft:'
const ATTEMPT_PREFIX = 'mc:attempt:'

export type DraftValues = Record<string, string>

/** The request whose outcome is unknown: its key and the values exactly as they were sent. */
export type PendingAttempt = { key: string; values: DraftValues }

function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    // skip: storage access can throw in private/blocked contexts; drafts are a convenience
    return null
  }
}

export const draftKeyFor = (namespace: string, scope: string) => `${PREFIX}${namespace}:${scope}`

export function loadDraft(namespace: string, scope: string): DraftValues | null {
  const s = store()
  if (!s) return null
  try {
    const raw = s.getItem(draftKeyFor(namespace, scope))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const out: DraftValues = {}
    for (const [k, v] of Object.entries(parsed)) if (typeof v === 'string') out[k] = v
    return out
  } catch {
    // skip: a corrupt draft is treated as no draft
    return null
  }
}

export function saveDraft(namespace: string, scope: string, values: DraftValues): void {
  const s = store()
  if (!s) return
  try {
    s.setItem(draftKeyFor(namespace, scope), JSON.stringify(values))
  } catch {
    // skip: quota or blocked storage; the form still works, only retention is lost
  }
}

export function clearDraft(namespace: string, scope: string): void {
  try {
    store()?.removeItem(draftKeyFor(namespace, scope))
  } catch {
    // skip: nothing to clear if storage is unavailable
  }
}

const attemptKeyFor = (namespace: string, scope: string) => `${ATTEMPT_PREFIX}${namespace}:${scope}`

const attemptListeners = new Set<() => void>()
const notifyAttempts = () => attemptListeners.forEach((l) => l())

/** For useSyncExternalStore: in-tab sessionStorage writes raise no event, so writers notify. */
export function subscribeAttempts(listener: () => void): () => void {
  attemptListeners.add(listener)
  return () => attemptListeners.delete(listener)
}

/** The stored attempt as written (a stable string for useSyncExternalStore), or null. */
export function readAttemptRaw(namespace: string, scope: string): string | null {
  try {
    return store()?.getItem(attemptKeyFor(namespace, scope)) ?? null
  } catch {
    // skip: storage can throw in private/blocked contexts
    return null
  }
}

export function parseAttempt(raw: string | null): PendingAttempt | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { key, values } = parsed as { key?: unknown; values?: unknown }
    // A stored key must still look like a UUIDv7: anything else is treated as no attempt.
    if (typeof key !== 'string' || !UUID_V7.test(key) || !values || typeof values !== 'object')
      return null
    const out: DraftValues = {}
    for (const [k, v] of Object.entries(values)) if (typeof v === 'string') out[k] = v
    return { key, values: out }
  } catch {
    // skip: a corrupt attempt is treated as no attempt
    return null
  }
}

export const loadAttempt = (namespace: string, scope: string) =>
  parseAttempt(readAttemptRaw(namespace, scope))

export function saveAttempt(namespace: string, scope: string, attempt: PendingAttempt): void {
  const s = store()
  if (!s) return
  try {
    s.setItem(attemptKeyFor(namespace, scope), JSON.stringify(attempt))
  } catch {
    // skip: quota or blocked storage; the retry then works only until the page is reloaded
  }
  notifyAttempts()
}

export function clearAttempt(namespace: string, scope: string): void {
  try {
    store()?.removeItem(attemptKeyFor(namespace, scope))
  } catch {
    // skip: nothing to clear if storage is unavailable
  }
  notifyAttempts()
}

/** Removes every draft and pending attempt of every namespace (logout, lost access). */
export function clearAllDrafts(): void {
  const s = store()
  if (!s) return
  try {
    const keys: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k?.startsWith(PREFIX) || k?.startsWith(ATTEMPT_PREFIX)) keys.push(k)
    }
    for (const k of keys) s.removeItem(k)
  } catch {
    // skip: best effort
  }
  notifyAttempts()
}
