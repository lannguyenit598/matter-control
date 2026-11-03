import { describe, expect, it } from 'vitest'

import { UUID_V7 } from '@/lib/mc/idempotency'

import {
  bulkFingerprint,
  freezeBulkIntent,
  freezeImportIntent,
  groupOutcomes,
  importFingerprint,
  intentFor,
} from './intent'
import type { BulkRowInput } from './schemas'

const row = (over: Partial<BulkRowInput> = {}): BulkRowInput => ({
  rowKey: 'row-1',
  itemId: 'item-1',
  expectedRevision: 3,
  title: 'New title',
  ...over,
})

describe('frozen bulk intent', () => {
  it('mints UUIDv7 keys, one per row plus the attempt, all distinct', () => {
    const { input } = freezeBulkIntent([row(), row({ rowKey: 'row-2' })])
    const keys = [input.attemptKey, ...input.rows.map((r) => r.idempotencyKey)]
    expect(keys.every((k) => UUID_V7.test(k))).toBe(true)
    expect(new Set(keys).size).toBe(3)
  })

  it('resends the same keys while the rows are unchanged, and new keys once they change', () => {
    const first = freezeBulkIntent([row()])
    expect(intentFor([row()], first)).toBe(first)
    const edited = intentFor([row({ title: 'Another' })], first)
    expect(edited).not.toBe(first)
    expect(edited.input.attemptKey).not.toBe(first.input.attemptKey)
    expect(edited.input.rows[0]!.idempotencyKey).not.toBe(first.input.rows[0]!.idempotencyKey)
  })

  it('tells "unchanged" from "cleared" in the content identity', () => {
    expect(bulkFingerprint([row({ due: undefined })])).not.toBe(bulkFingerprint([row({ due: '' })]))
  })
})

describe('frozen import intent', () => {
  const file = { name: 'counsel.csv', size: 120, lastModified: 1 }

  it('keys every previewed row once and ties the intent to that file', () => {
    const a = freezeImportIntent(file, ['R1', 'A1'])
    expect(Object.keys(a.plan.rowKeys)).toEqual(['R1', 'A1'])
    expect(Object.values(a.plan.rowKeys).every((k) => UUID_V7.test(k))).toBe(true)
    expect(UUID_V7.test(a.plan.runKey)).toBe(true)
    expect(a.fingerprint).toBe(importFingerprint(file, ['R1', 'A1']))
    expect(a.fingerprint).not.toBe(importFingerprint({ ...file, size: 121 }, ['R1', 'A1']))
  })
})

describe('grouped outcomes', () => {
  it('accounts for every submitted row, counting replays as applied', () => {
    const g = groupOutcomes(
      [
        { rowKey: 'a', status: 'SUCCESS' },
        { rowKey: 'b', status: 'SUCCESS_REPLAYED' },
        { rowKey: 'c', status: 'FAILURE', code: 'stale' },
        { rowKey: 'd', status: 'UNKNOWN' },
      ],
      4,
    )
    expect([g.succeeded.length, g.failed.length, g.unknown.length, g.replayed]).toEqual([
      2, 1, 1, 1,
    ])
    expect(g.balanced).toBe(true)
  })

  it('flags a response that does not match the submission', () => {
    expect(groupOutcomes([{ rowKey: 'a', status: 'SUCCESS' }], 3).balanced).toBe(false)
  })
})
