import { describe, expect, it } from 'vitest'

import { newIdempotencyKey, UUID_V7 } from './idempotency'

describe('newIdempotencyKey', () => {
  it('is a well-formed UUIDv7', () => {
    for (let i = 0; i < 50; i++) expect(newIdempotencyKey()).toMatch(UUID_V7)
  })

  it('encodes the millisecond timestamp in the first 48 bits and is time-ordered', () => {
    const t = Date.UTC(2026, 9, 27, 12, 0, 0)
    const key = newIdempotencyKey(t, new Uint8Array(10))
    expect(parseInt(key.replace(/-/g, '').slice(0, 12), 16)).toBe(t)
    expect(newIdempotencyKey(t + 1, new Uint8Array(10)) > key).toBe(true)
  })

  it('differs between calls at the same instant (random tail)', () => {
    expect(newIdempotencyKey(1)).not.toBe(newIdempotencyKey(1))
  })
})
