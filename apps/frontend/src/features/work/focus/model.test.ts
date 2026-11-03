import { describe, expect, it } from 'vitest'
import { emptySlot, remaining, transition, slotSchema } from './model'

const identity = {
  principalKey: 'a'.repeat(64),
  epoch: 'b'.repeat(24),
  validUntil: '2099-01-01T00:00:00.000Z',
}
const target = { matterId: 'matter', actionId: 'action' }
const now = 1_800_000_000_000

describe('Focus model', () => {
  it('counts sleep, freezes pause and extends by exactly five minutes without resuming', () => {
    const started = transition(
      emptySlot('g'),
      { type: 'start', target, minutes: 25 },
      identity,
      now,
      's',
      true,
    )!
    expect(remaining(started.active!, now + 60_000)).toBe(24 * 60_000)
    const paused = transition(started, { type: 'pause' }, identity, now + 60_000, 'p', false)!
    const extended = transition(paused, { type: 'extend' }, identity, now + 120_000, 'e', false)!
    expect(extended.active).toMatchObject({ state: 'PAUSED', remainingMs: 29 * 60_000 })
    expect(remaining(extended.active!, now + 9_000_000)).toBe(29 * 60_000)
    expect(transition(extended, { type: 'resume' }, identity, now + 180_000, 'r', false)).toBeNull()
    expect(
      transition(extended, { type: 'resume' }, identity, now + 180_000, 'r', true)?.active
        ?.deadlineWallMs,
    ).toBe(now + 180_000 + 29 * 60_000)
  })
  it('refuses duplicate Start, terminal extension and expired identity; ends with a content-free fence', () => {
    const started = transition(
      emptySlot('g'),
      { type: 'start', target, minutes: 15 },
      identity,
      now,
      's',
      true,
    )!
    expect(
      transition(started, { type: 'start', target, minutes: 50 }, identity, now, 'x', true),
    ).toBeNull()
    expect(transition(started, { type: 'extend' }, identity, now + 900_000, 'x', false)).toBeNull()
    const ended = transition(started, { type: 'end' }, identity, now, 'end', false)!
    expect(ended).toEqual({ schema: 1, generation: 'end', revision: 2, active: null })
    expect(JSON.stringify(ended)).not.toContain('action')
    expect(
      transition(
        emptySlot('g'),
        { type: 'start', target, minutes: 15 },
        { ...identity, validUntil: '2000-01-01T00:00:00Z' },
        now,
        's',
        true,
      ),
    ).toBeNull()
  })
  it('suspends conservatively and rejects corrupt/unknown stored schemas and unsafe arithmetic', () => {
    const started = transition(
      emptySlot('g'),
      { type: 'start', target, minutes: 25 },
      identity,
      now,
      's',
      true,
    )!
    const suspended = transition(started, { type: 'suspend' }, identity, now + 20_000, 'x', false)!
    expect(suspended.active).toMatchObject({ state: 'SUSPENDED', remainingMs: 1_480_000 })
    expect(transition(suspended, { type: 'extend' }, identity, now, 'x', false)).toBeNull()
    expect(slotSchema.safeParse({ ...started, schema: 2 }).success).toBe(false)
    expect(
      slotSchema.safeParse({
        ...started,
        active: { ...started.active, deadlineWallMs: now + 9_000_000 },
      }).success,
    ).toBe(false)
    expect(
      slotSchema.safeParse({ ...started, active: { ...started.active, remainingMs: Infinity } })
        .success,
    ).toBe(false)
    expect(
      transition(
        { ...started, revision: Number.MAX_SAFE_INTEGER },
        { type: 'end' },
        identity,
        now,
        'x',
        false,
      ),
    ).toBeNull()
  })
  it('does not enlarge remaining time after a backward clock jump', () => {
    const started = transition(
      emptySlot('g'),
      { type: 'start', target, minutes: 25 },
      identity,
      now,
      's',
      true,
    )!
    expect(transition(started, { type: 'pause' }, identity, now - 60_000, 'x', false)).toBeNull()
    expect(
      transition(started, { type: 'suspend' }, identity, now - 60_000, 'x', false)?.active
        ?.remainingMs,
    ).toBe(25 * 60_000)
  })
  it('does not write another revision for an already suspended observation', () => {
    const started = transition(
      emptySlot('g'),
      { type: 'start', target, minutes: 25 },
      identity,
      now,
      's',
      true,
    )!
    const suspended = transition(started, { type: 'suspend' }, identity, now + 1000, 'x', false)!
    expect(transition(suspended, { type: 'suspend' }, identity, now + 2000, 'y', false)).toBe(
      suspended,
    )
  })
})
