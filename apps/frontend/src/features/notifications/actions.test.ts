import { beforeEach, expect, it, vi } from 'vitest'
import { McError } from '@/lib/mc/errors'
const { session, mark } = vi.hoisted(() => ({ session: vi.fn(), mark: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireSession: session }))
vi.mock('./repository', () => ({ notificationsRepository: { markSeen: mark } }))
import { markSeenAction } from './actions'
beforeEach(() => {
  session.mockReset()
  mark.mockReset()
  session.mockResolvedValue({})
  mark.mockResolvedValue({ data: { seenAt: '2026-11-12T00:00:00Z' } })
})
it('checks session first and does not forward malformed or duplicate keys', async () => {
  session.mockRejectedValueOnce(new McError('unauthenticated', 401))
  expect(await markSeenAction(['a'.repeat(64)])).toMatchObject({
    ok: false,
    kind: 'unauthenticated',
  })
  for (const keys of [['bad'], ['a'.repeat(64), 'a'.repeat(64)], Array(201).fill('a'.repeat(64))]) {
    expect(await markSeenAction(keys)).toMatchObject({ ok: false, kind: 'validation' })
  }
  expect(mark).not.toHaveBeenCalled()
})
it('forwards only displayed keys unchanged', async () => {
  const keys = ['a'.repeat(64), 'b'.repeat(64)]
  expect(await markSeenAction(keys)).toMatchObject({ ok: true })
  expect(mark).toHaveBeenCalledWith(keys)
})
