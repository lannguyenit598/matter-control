/**
 * Template and audited session / provider-secret environment variables (INTA-1 §2, R07).
 * Any non-empty value in this set refuses harness startup and runtime execution.
 * Enumerate keys only, never values.
 */
export const PRODUCT_AUTH_ENV_KEYS = [
  'API_MODE',
  'API_TOKEN',
  'API_BASE_URL',
  'AUTH_ALLOW_ANONYMOUS',
  'API_TIMEOUT_MS',
  // Audited session / provider-secret keys:
  'AUTH_SECRET',
  'NEXTAUTH_SECRET',
  'CLERK_SECRET_KEY',
  'SESSION_SECRET',
  'COOKIE_SECRET',
  'DATABASE_URL',
  'JWT_SECRET',
] as const

export type ProductAuthEnvKey = (typeof PRODUCT_AUTH_ENV_KEYS)[number]

export type ValidationSuccess = {
  ok: true
  goBaseUrl: string
}

export type ValidationFailure = {
  ok: false
  status: number
  reason: string
  refusedKeys?: string[]
}

export type ValidationResult = ValidationSuccess | ValidationFailure

/**
 * Validates harness environment per-request (defense-in-depth).
 * Never echoes configured environment values in error reasons.
 */
export function validateHarnessEnvironment(env: Record<string, string | undefined>): ValidationResult {
  if (env.MC_INTA_ENABLE !== '1') {
    return {
      ok: false,
      status: 404,
      reason: 'Harness disabled: MC_INTA_ENABLE=1 is required',
    }
  }

  if (env.NODE_ENV === 'production') {
    return {
      ok: false,
      status: 403,
      reason: 'Harness execution refused: NODE_ENV cannot be production',
    }
  }

  const refusedKeys: string[] = []
  for (const key of PRODUCT_AUTH_ENV_KEYS) {
    if (env[key] !== undefined) {
      refusedKeys.push(key)
    }
  }

  if (refusedKeys.length > 0) {
    return {
      ok: false,
      status: 403,
      refusedKeys,
      reason: `Harness execution refused: product auth/secret env vars present (${refusedKeys.join(', ')})`,
    }
  }

  const goBaseUrl = env.MC_INTA_GO_BASE_URL ?? 'http://127.0.0.1:18086'
  if (goBaseUrl !== 'http://127.0.0.1:18086') {
    return {
      ok: false,
      status: 403,
      reason: 'Fixed Go URL violation: MC_INTA_GO_BASE_URL must be http://127.0.0.1:18086',
    }
  }

  return { ok: true, goBaseUrl }
}

/**
 * Startup refusal guard (INTA-FE-R07, INT-ENV-05, F04).
 * Refuses startup with NODE_ENV=production or any product auth/secret variable set (including empty values).
 * Throws an error to abort process startup before Next.js dev server listens on 18085.
 */
export function validateHarnessStartup(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === 'production') {
    throw new Error('Harness startup refused: NODE_ENV cannot be production')
  }

  const refusedKeys: string[] = []
  for (const key of PRODUCT_AUTH_ENV_KEYS) {
    if (env[key] !== undefined) {
      refusedKeys.push(key)
    }
  }

  if (refusedKeys.length > 0) {
    throw new Error(
      `Harness startup refused: product auth/secret env vars present (${refusedKeys.join(', ')})`,
    )
  }

  const goBaseUrl = env.MC_INTA_GO_BASE_URL ?? 'http://127.0.0.1:18086'
  if (goBaseUrl !== 'http://127.0.0.1:18086') {
    throw new Error('Harness startup refused: MC_INTA_GO_BASE_URL must be http://127.0.0.1:18086')
  }
}
