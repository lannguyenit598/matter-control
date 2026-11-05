import { describe, expect, it } from 'vitest'
import {
  validateHarnessEnvironment,
  validateHarnessStartup,
  PRODUCT_AUTH_ENV_KEYS,
} from '../src/guards.js'

describe('validateHarnessEnvironment (Per-request guard)', () => {
  const cleanEnv = {
    MC_INTA_ENABLE: '1',
    NODE_ENV: 'development',
    MC_INTA_GO_BASE_URL: 'http://127.0.0.1:18086',
  }

  it('passes with clean development environment and MC_INTA_ENABLE=1', () => {
    const result = validateHarnessEnvironment(cleanEnv)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.goBaseUrl).toBe('http://127.0.0.1:18086')
    }
  })

  it('fails with NOT_ENABLED (404) when MC_INTA_ENABLE is missing or not 1', () => {
    const r1 = validateHarnessEnvironment({ ...cleanEnv, MC_INTA_ENABLE: undefined })
    expect(r1.ok).toBe(false)
    if (!r1.ok) {
      expect(r1.status).toBe(404)
      expect(r1.reason).toContain('MC_INTA_ENABLE')
    }

    const r2 = validateHarnessEnvironment({ ...cleanEnv, MC_INTA_ENABLE: '0' })
    expect(r2.ok).toBe(false)
    if (!r2.ok) {
      expect(r2.status).toBe(404)
    }
  })

  it('refuses execution when NODE_ENV is production (403)', () => {
    const result = validateHarnessEnvironment({ ...cleanEnv, NODE_ENV: 'production' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.reason).toContain('production')
    }
  })

  it.each(PRODUCT_AUTH_ENV_KEYS)('refuses execution when product env %s is set (403)', (key) => {
    const envWithAuth = { ...cleanEnv, [key]: 'prohibited-token' }
    const result = validateHarnessEnvironment(envWithAuth)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.refusedKeys).toContain(key)
    }
  })

  it('enforces fixed Go base URL http://127.0.0.1:18086 with generic error (no value reflection)', () => {
    const result = validateHarnessEnvironment({
      ...cleanEnv,
      MC_INTA_GO_BASE_URL: 'http://malicious-proxy.internal:8080',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.reason).toBe('Fixed Go URL violation: MC_INTA_GO_BASE_URL must be http://127.0.0.1:18086')
      expect(result.reason).not.toContain('malicious-proxy')
    }
  })

  it('refuses execution when product env is set to empty string (F04)', () => {
    const result = validateHarnessEnvironment({ ...cleanEnv, API_MODE: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
      expect(result.refusedKeys).toContain('API_MODE')
    }
  })
})

describe('validateHarnessStartup (Startup refusal guard, INTA-FE-R07)', () => {
  const cleanEnv = {
    MC_INTA_ENABLE: '1',
    NODE_ENV: 'development',
    MC_INTA_GO_BASE_URL: 'http://127.0.0.1:18086',
  }

  it('does not throw on clean valid startup environment', () => {
    expect(() => validateHarnessStartup(cleanEnv)).not.toThrow()
  })

  it('throws on startup if NODE_ENV=production', () => {
    expect(() => validateHarnessStartup({ ...cleanEnv, NODE_ENV: 'production' })).toThrow(
      /NODE_ENV cannot be production/,
    )
  })

  it.each(PRODUCT_AUTH_ENV_KEYS)('throws on startup if product auth key %s is set', (key) => {
    expect(() => validateHarnessStartup({ ...cleanEnv, [key]: 'any-value' })).toThrow(
      /product auth\/secret env vars present/,
    )
  })

  it('throws on startup if MC_INTA_GO_BASE_URL is not http://127.0.0.1:18086', () => {
    expect(() =>
      validateHarnessStartup({ ...cleanEnv, MC_INTA_GO_BASE_URL: 'http://other:8080' }),
    ).toThrow(/MC_INTA_GO_BASE_URL must be http:\/\/127.0.0.1:18086/)
  })

  it('throws on startup if product auth key is set to empty string (F04)', () => {
    expect(() => validateHarnessStartup({ ...cleanEnv, API_MODE: '' })).toThrow(
      /product auth\/secret env vars present \(API_MODE\)/,
    )
  })

  it('throws on startup even when NODE_ENV=test (no test bypass) (F04)', () => {
    expect(() =>
      validateHarnessStartup({ ...cleanEnv, NODE_ENV: 'test', API_MODE: 'demo' }),
    ).toThrow(/product auth\/secret env vars present \(API_MODE\)/)
  })
})
