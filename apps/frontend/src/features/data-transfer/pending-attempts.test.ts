import { describe, expect, it } from 'vitest'

import {
  acknowledgeAttempt,
  attemptSlots,
  beginAttempt,
  endAttempt,
  revokeAttempts,
  type PendingAttempt,
} from './pending-attempts'

const request = (matterId = 'm1'): PendingAttempt => ({
  kind: 'bulk',
  matterId,
  input: {
    attemptKey: 'attempt',
    rows: [
      {
        rowKey: 'r1',
        idempotencyKey: 'key',
        itemId: 'i1',
        expectedRevision: 1,
        title: 'Synthetic',
      },
    ],
  },
})

describe('session-owned transfer recovery', () => {
  it('retains frozen keys and payload across reload, isolated from another login', () => {
    const session = {},
      input = request(),
      saved = beginAttempt(session, input)!
    input.matterId = 'changed'
    expect(saved.matterId).toBe('m1')
    endAttempt(session, saved)
    expect(attemptSlots(session).get('bulk')?.attempt).toBe(saved)
    expect(attemptSlots({}).size).toBe(0)
    expect(beginAttempt(session, request())).toBe(saved)
  })
  it('refuses concurrent, changed-content and cross-Matter attempts without replacing the saved request', () => {
    const session = {},
      saved = beginAttempt(session, request())!
    expect(beginAttempt(session, request())).toBeNull()
    endAttempt(session, saved)
    expect(beginAttempt(session, request('m2'))).toBeNull()
    const changed = request()
    if (changed.kind === 'bulk') changed.input.rows[0]!.title = 'Changed'
    expect(beginAttempt(session, changed)).toBeNull()
    expect(attemptSlots(session).get('bulk')?.attempt).toBe(saved)
  })
  it.each(
    [
      [],
      [{ rowKey: 'unexpected', status: 'SUCCESS' as const }],
      [{ rowKey: 'r1', status: 'UNKNOWN' as const }],
    ].map((results) => ({ results })),
  )('keeps ambiguous response unresolved: %j', ({ results }) => {
    const session = {},
      saved = beginAttempt(session, request())!
    endAttempt(session, saved, results)
    expect(attemptSlots(session).get('bulk')?.attempt).toBe(saved)
  })
  it('releases only terminal receipts; late completion cannot release a newer slot', () => {
    const session = {},
      saved = beginAttempt(session, request())!
    endAttempt(session, saved, [{ rowKey: 'r1', status: 'SUCCESS_REPLAYED' }])
    expect(attemptSlots(session).get('bulk')?.settled).toBe(true)
    expect(beginAttempt(session, request())).toBeNull()
    expect(attemptSlots(session).get('bulk')?.results).toEqual([
      { rowKey: 'r1', status: 'SUCCESS_REPLAYED' },
    ])
    expect(acknowledgeAttempt(session, 'bulk', 'm1', 'wrong')).toBe(false)
    expect(acknowledgeAttempt(session, 'bulk', 'm2', 'attempt')).toBe(false)
    expect(acknowledgeAttempt(session, 'bulk', 'm1', 'attempt')).toBe(true)
    expect(attemptSlots(session).size).toBe(0)
    const next = beginAttempt(session, request('m2'))!
    endAttempt(session, saved, [{ rowKey: 'r1', status: 'SUCCESS' }])
    expect(attemptSlots(session).get('bulk')?.attempt).toBe(next)
  })
  it('purges access-lost payloads and refuses revival on re-grant', () => {
    const session = {},
      saved = beginAttempt(session, request())!
    revokeAttempts(session, 'm1')
    endAttempt(session, saved)
    expect(attemptSlots(session).get('bulk')).toEqual({ blocked: 'm1' })
    expect(beginAttempt(session, request())).toBeNull()
  })
  it('binds exact import bytes, source, run, and row keys', () => {
    const session = {}
    const input: PendingAttempt = {
      kind: 'import',
      matterId: 'm1',
      plan: { runKey: 'run', rowKeys: { R1: 'key' } },
      upload: { sourceName: 'synthetic.csv', format: 'csv', content: new Uint8Array([1, 2]) },
    }
    const saved = beginAttempt(session, input)!
    endAttempt(session, saved)
    input.upload.content[0] = 3
    expect(beginAttempt(session, input)).toBeNull()
    expect(saved.kind === 'import' && saved.upload.content[0]).toBe(1)
  })
})
