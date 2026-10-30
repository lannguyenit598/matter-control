import { afterEach, describe, expect, it, vi } from 'vitest'

// Parses the real env schema: a regression to e.g. z.coerce.boolean() would turn
// AUTH_ALLOW_ANONYMOUS="false" into true and silently disable the auth check.
async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value)
  return (await import('./env')).serverEnv
}

const rest = { API_MODE: 'rest', API_BASE_URL: 'https://api.test/v1' }

afterEach(() => vi.unstubAllEnvs())

describe('serverEnv', () => {
  it('defaults to demo mode', async () => {
    expect(await loadEnv({ API_MODE: undefined })).toEqual({ API_MODE: 'demo' })
  })

  describe('production server (TB-12)', () => {
    const prod = { NODE_ENV: 'production', NEXT_PHASE: 'phase-production-server' }

    it.each([undefined, 'demo'])(
      'refuses API_MODE=%j before any data is rendered',
      async (mode) => {
        await expect(loadEnv({ ...prod, API_MODE: mode })).rejects.toThrow(
          /API_MODE must be "rest"/,
        )
      },
    )

    it('refuses demo when no phase is set (standalone server.js sets none)', async () => {
      await expect(loadEnv({ NODE_ENV: 'production', NEXT_PHASE: undefined })).rejects.toThrow(
        /API_MODE must be "rest"/,
      )
    })

    it('allows the build to load the module without a real API', async () => {
      const env = await loadEnv({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })
      expect(env).toEqual({ API_MODE: 'demo' })
    })

    it('starts in rest mode', async () => {
      expect(await loadEnv({ ...prod, ...rest })).toMatchObject({ API_MODE: 'rest' })
    })
  })

  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['0', false],
    ['true', true],
  ])('AUTH_ALLOW_ANONYMOUS=%j -> %s', async (value, expected) => {
    const env = await loadEnv({ ...rest, AUTH_ALLOW_ANONYMOUS: value })
    expect(env).toMatchObject({ AUTH_ALLOW_ANONYMOUS: expected })
  })

  it('rejects ambiguous values instead of guessing', async () => {
    await expect(loadEnv({ ...rest, AUTH_ALLOW_ANONYMOUS: 'maybe' })).rejects.toThrow(
      /Invalid environment configuration/,
    )
  })

  it('requires API_BASE_URL in rest mode', async () => {
    await expect(loadEnv({ API_MODE: 'rest', API_BASE_URL: undefined })).rejects.toThrow(
      /API_BASE_URL/,
    )
  })
})
