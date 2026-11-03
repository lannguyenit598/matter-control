import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSession,
  destroySession,
  readSession,
  resetSessions,
  sessionCount,
  updateSession,
} from './session-store'

const limits = { idleMs: 1000, absoluteMs: 5000 }
const rec = {
  sub: 'subject-0123456789',
  name: 'Display Name',
  accessToken: 'ACCESS-TOKEN-VALUE-0123456789',
  accessExpiresAt: 1e15,
}

beforeEach(() => resetSessions())

describe('session store', () => {
  it('issues unguessable, distinct handles that carry no token', () => {
    const a = createSession(rec)
    const b = createSession(rec)
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a).not.toContain(rec.accessToken)
    expect(a).not.toContain(rec.sub)
  })

  it('refuses an unknown or forged handle (fail closed)', () => {
    createSession(rec)
    expect(readSession('forged', limits)).toBeUndefined()
    expect(readSession('', limits)).toBeUndefined()
  })

  it('expires on idle and on absolute lifetime', () => {
    const h = createSession(rec, 0)
    expect(readSession(h, limits, 900)).toBeDefined() // touches: idle clock restarts at 900
    expect(readSession(h, limits, 1800)).toBeDefined()
    expect(readSession(h, limits, 3000)).toBeUndefined() // idle > 1000 since 1800
    const h2 = createSession(rec, 0)
    for (let t = 500; t <= 4500; t += 500) expect(readSession(h2, limits, t)).toBeDefined()
    expect(readSession(h2, limits, 5500)).toBeUndefined() // absolute 5000 reached despite activity
    expect(sessionCount()).toBe(0)
  })

  it('destroys immediately and returns the record for revocation', () => {
    const h = createSession({ ...rec, refreshToken: 'RT' })
    expect(destroySession(h)?.refreshToken).toBe('RT')
    expect(readSession(h, limits)).toBeUndefined()
    expect(destroySession(h)).toBeUndefined()
  })

  it('updates in place', () => {
    const h = createSession(rec)
    updateSession(h, { accessToken: 'ACCESS-TOKEN-VALUE-2' })
    expect(readSession(h, limits)?.accessToken).toBe('ACCESS-TOKEN-VALUE-2')
  })

  it('is one store per process even when the module is evaluated again (HMR)', async () => {
    const h = createSession(rec)
    vi.resetModules()
    const again = await import('./session-store')
    expect(again.readSession(h, limits)).toBeDefined()
  })
})
