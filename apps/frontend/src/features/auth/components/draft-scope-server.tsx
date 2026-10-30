import type { ReactNode } from 'react'

import { DraftScopeProvider } from '@/components/organisms/draft-scope'
import { draftNamespace } from '@/lib/auth-provider'
import { awaitRequest } from '@/lib/request-time'

/** Resolves the per-session draft namespace on the server and hands it to client forms. */
export async function DraftScope({ children }: { children: ReactNode }) {
  await awaitRequest()
  return <DraftScopeProvider namespace={await draftNamespace()}>{children}</DraftScopeProvider>
}
