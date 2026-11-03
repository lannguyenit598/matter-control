// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { readFocus } from './transport'

afterEach(() => vi.unstubAllGlobals())
it('projects a persisted active session to the exact two-field target wire contract', async () => {
  const identity = {
    principalKey: 'a'.repeat(64),
    epoch: 'b'.repeat(24),
    validUntil: '2099-01-01T00:00:00.000Z',
  }
  const target = { matterId: 'matter', actionId: 'action' }
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        identity,
        checkedAt: '2026-11-01T00:00:00.000Z',
        asOf: null,
        kind: 'eligible',
        target: { ...target, title: 'Action', matterName: 'Atlas', reason: 'ready' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
  const active = {
    ...target,
    ...identity,
    sessionId: 'private-reference',
    remainingMs: 1_500_000,
    writtenAtWallMs: 1,
    state: 'RUNNING',
  }
  await readFocus(identity.epoch, active)
  const request = fetchMock.mock.calls[0]![1] as RequestInit
  expect(JSON.parse(request.body as string)).toEqual({ epoch: identity.epoch, target })
  expect(request.cache).toBe('no-store')
})
