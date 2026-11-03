import 'server-only'

import { cookies } from 'next/headers'

import { AuthError } from '@/lib/auth'
import { oidcConfig } from '@/lib/oidc/config'
import { liveSession } from '@/lib/oidc/session'

export async function recoverySession() {
  const cfg = oidcConfig()
  const handle = cfg && (await cookies()).get(cfg.sessionCookie)?.value
  const live = cfg && handle && (await liveSession(cfg, handle))
  if (!live) throw new AuthError('unauthenticated')
  return live.record
}
