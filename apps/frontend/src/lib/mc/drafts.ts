/**
 * Form drafts survive navigation and re-render while the identity and scope still allow them
 * (session storage: gone with the tab). A draft is keyed by an opaque per-session namespace plus
 * the exact scope/intent, so another sign-in or another record never sees it. They are cleared on
 * success, discard, revoked access and logout: nothing is revived after the right to see it ends.
 * Storage can be blocked or full; every call tolerates that and the form works without drafts.
 */
const PREFIX = 'mc:draft:'

export type DraftValues = Record<string, string>

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

/** Removes every draft of every namespace (logout). */
export function clearAllDrafts(): void {
  const s = store()
  if (!s) return
  try {
    const keys: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k?.startsWith(PREFIX)) keys.push(k)
    }
    for (const k of keys) s.removeItem(k)
  } catch {
    // skip: best effort
  }
}
