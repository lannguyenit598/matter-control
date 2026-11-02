'use client'

import { createContext, useContext, useId, useMemo, type ReactNode } from 'react'
import type { UiSession } from '@/lib/ui-session'

export type PrivateScope = { epoch: string; runtime: string }
export type PrivateEvent = {
  type: 'session-ended' | 'access-recheck'
  scope: PrivateScope
  remote?: boolean
}
const Scope = createContext<PrivateScope | null>(null)
const listeners = new Set<(event: PrivateEvent) => Promise<unknown> | void>()

export function PrivateUiProvider({
  identity,
  children,
}: {
  identity: UiSession | null
  children: ReactNode
}) {
  const runtime = useId()
  const scope = useMemo(
    () => (identity ? { epoch: identity.epoch, runtime } : null),
    [identity, runtime],
  )
  return <Scope.Provider value={scope}>{children}</Scope.Provider>
}
export const usePrivateScope = () => useContext(Scope)
export function onPrivateUi(listener: (event: PrivateEvent) => Promise<unknown> | void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function notifyPrivateUi(event: PrivateEvent) {
  return Promise.allSettled(
    [...listeners].map((listener) => {
      try {
        return listener(event)
      } catch (error) {
        return Promise.reject(error)
      }
    }),
  )
}

/** Bound pre-navigation cleanup; storage failure never prevents server-side logout. */
export async function preparePrivateLogout(scope: PrivateScope | null, timeoutMs = 1000) {
  if (!scope) return
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      notifyPrivateUi({ type: 'session-ended', scope }),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
