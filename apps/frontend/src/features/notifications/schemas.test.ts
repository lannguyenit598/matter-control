import { expect, it } from 'vitest'
import { unreadOf, type NotificationItem } from './schemas'
it('uses explicit seen state rather than changing computation timestamps', () => {
  const row: NotificationItem = {
    id: 'n1',
    seenKey: 'a'.repeat(64),
    seen: true,
    kind: 'OVERDUE',
    matterId: 'm1',
    matterTitle: 'Synthetic',
    itemId: 'i1',
    title: 'Synthetic reminder',
    dueAt: null,
    createdAt: '2099-01-01T00:00:00Z',
  }
  expect(unreadOf([row])).toBe(0)
  expect(unreadOf([row, { ...row, id: 'n2', seen: false }])).toBe(1)
})
