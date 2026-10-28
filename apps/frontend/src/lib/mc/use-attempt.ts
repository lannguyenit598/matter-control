'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { parseAttempt, readAttemptRaw, subscribeAttempts, type PendingAttempt } from './drafts'

/**
 * The pending attempt kept for this session and scope, or null (also on the server and without a
 * namespace). Read through the external-store API so it is never out of step with storage and the
 * server render matches the first client render.
 */
export function usePendingAttempt(
  namespace: string | null,
  scope: string | undefined,
): PendingAttempt | null {
  const raw = useSyncExternalStore(
    subscribeAttempts,
    () => (namespace && scope ? readAttemptRaw(namespace, scope) : null),
    () => null,
  )
  return useMemo(() => parseAttempt(raw), [raw])
}
