import 'server-only'

import { serverEnv } from '@/lib/env'

export type OidcConfig = {
  issuer: string
  clientId: string
  projectId: string
  appOrigin: string
  redirectUri: string
  cookieSecure: boolean
  sessionCookie: string
  loginCookie: string
  idleMs: number
  absoluteMs: number
}

/** Sign-in configuration, or null when REST mode or any required value is missing (fail-closed). */
export function oidcConfig(): OidcConfig | null {
  if (serverEnv.API_MODE !== 'rest') return null
  const { OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_PROJECT_ID, APP_ORIGIN } = serverEnv
  if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_PROJECT_ID || !APP_ORIGIN) return null
  const appOrigin = new URL(APP_ORIGIN).origin
  const secure = serverEnv.SESSION_COOKIE_SECURE
  return {
    issuer: OIDC_ISSUER.replace(/\/+$/, ''),
    clientId: OIDC_CLIENT_ID,
    projectId: OIDC_PROJECT_ID,
    appOrigin,
    redirectUri: `${appOrigin}/api/auth/callback`,
    cookieSecure: secure,
    // The __Host- prefix requires Secure; plain-HTTP local development uses unprefixed names.
    sessionCookie: secure ? '__Host-mc_session' : 'mc_session',
    loginCookie: secure ? '__Host-mc_login' : 'mc_login',
    idleMs: serverEnv.SESSION_IDLE_SECONDS * 1000,
    absoluteMs: serverEnv.SESSION_ABSOLUTE_SECONDS * 1000,
  }
}
