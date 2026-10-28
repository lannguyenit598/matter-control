'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'

import { clearAllDrafts } from '@/lib/mc/drafts'

const DraftNamespace = createContext<string | null>(null)

/**
 * Supplies the opaque per-session namespace under which form drafts are kept. Without it (not
 * signed in) drafts are disabled. The value is a one-way hash of the session handle: it cannot be
 * turned back into the handle or into any identity claim.
 */
export function DraftScopeProvider({
  namespace,
  children,
}: {
  namespace: string | null
  children: ReactNode
}) {
  return <DraftNamespace.Provider value={namespace}>{children}</DraftNamespace.Provider>
}

export const useDraftNamespace = () => useContext(DraftNamespace)

/**
 * Rendered by a denied screen: access to the scope ended, so every draft kept in this tab goes
 * with it and a later re-grant cannot revive it. Drafts are not indexed by Matter, so the purge is
 * tab-wide rather than guessing which keys belonged to the lost scope.
 */
export function PurgeDrafts() {
  useEffect(() => {
    clearAllDrafts()
  }, [])
  return null
}
