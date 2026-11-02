import { expect, it } from 'vitest'
import { compareFocus } from './coordinator'
import { emptySlot } from './model'

const identity = {
  principalKey: 'a'.repeat(64),
  epoch: 'b'.repeat(24),
  validUntil: '2099-01-01T00:00:00.000Z',
}
it('rejects both competing Start and post-End ABA without rebasing the caller', () => {
  const initial = emptySlot('g')
  const command = {
    type: 'start' as const,
    minutes: 25 as const,
    target: { matterId: 'm', actionId: 'a' },
  }
  const winner = compareFocus(initial, initial, command, identity, 1000, 'start', true)
  if (!winner || typeof winner === 'string') throw new Error('expected winner')
  expect(compareFocus(winner, initial, command, identity, 1000, 'second', true)).toBe('stale')
  const ended = compareFocus(winner, winner, { type: 'end' }, identity, 2000, 'ended', false)
  expect(ended).not.toBe('stale')
  if (!ended || typeof ended === 'string') throw new Error('expected committed fence')
  expect(compareFocus(ended, initial, command, identity, 3000, 'old-start', true)).toBe('stale')
  expect(JSON.stringify(ended)).not.toContain('actionId')
})
