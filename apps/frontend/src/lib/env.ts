import 'server-only'

import { z } from 'zod'

/**
 * Server-side environment, validated once at startup.
 * `server-only` makes the build fail if a Client Component imports this file,
 * so API_TOKEN can never leak into the browser bundle.
 */
const serverEnvSchema = z.discriminatedUnion('API_MODE', [
  z.object({ API_MODE: z.literal('demo') }),
  z.object({
    API_MODE: z.literal('rest'),
    API_BASE_URL: z.url({ error: 'API_BASE_URL must be an absolute URL when API_MODE=rest' }),
    API_TOKEN: z.string().min(1).optional(),
    API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    /**
     * DANGEROUS. Lets every visitor act with API_TOKEN, without signing in. Only for apps that are
     * already protected in front of Next.js (VPN, SSO gateway). Default false = fail closed.
     */
    AUTH_ALLOW_ANONYMOUS: z.stringbool().default(false),
    /**
     * OIDC sign-in (ZITADEL, Authorization Code + PKCE). All optional at load time so a build
     * never needs them; sign-in is simply unavailable (fail-closed) until every one is set.
     * Tokens stay on the server; the browser only ever holds an opaque session handle.
     */
    OIDC_ISSUER: z.url().optional(),
    OIDC_CLIENT_ID: z.string().min(1).optional(),
    /** Project id added to the token audience (ZITADEL scope urn:zitadel:iam:org:project:id:<id>:aud). */
    OIDC_PROJECT_ID: z.string().min(1).optional(),
    /** Public origin of this app, e.g. http://localhost:3000. Redirect and post-logout URIs derive from it. */
    APP_ORIGIN: z.url().optional(),
    /**
     * Cookie `Secure` flag. Keep true everywhere except plain-HTTP local development, where the
     * `__Host-` prefix cannot be used either (docs: ops/p0-local/README.md).
     */
    SESSION_COOKIE_SECURE: z.stringbool().default(true),
    SESSION_IDLE_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(8 * 60 * 60),
    SESSION_ABSOLUTE_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(24 * 60 * 60),
  }),
])

type ServerEnv = z.infer<typeof serverEnvSchema>

function readServerEnv(): ServerEnv {
  // Treat empty strings (`API_TOKEN=`) as unset.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''))
  // TB-12: a production server must never fall back to (or be set to) fake in-memory data with a
  // fake session. `next build` sets NEXT_PHASE for the whole build, so only that phase may load
  // this module without a real API; dev, tests and storybook keep the demo default.
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    (raw.API_MODE ?? 'demo') === 'demo'
  ) {
    throw new Error(
      'API_MODE must be "rest" when the production server runs: demo mode serves fake data with a fake session.',
    )
  }
  const result = serverEnvSchema.safeParse({ ...raw, API_MODE: raw.API_MODE ?? 'demo' })
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const serverEnv = readServerEnv()
