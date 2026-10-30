import { describe, expect, it } from 'vitest'

import { buildAgenda, dayKey, parseAgendaQuery } from './agenda'
import type { Envelope, MilestoneView } from './schemas'

const work = (
  id: string,
  dueAt: string | null,
  timing: Envelope['derived']['timing'] = 'ON_TRACK',
) =>
  ({
    item: { id, title: `Item ${id}`, dueAt, execution: 'NOT_STARTED' },
    derived: { timing, criticalChain: false },
  }) as unknown as Envelope
const ms = (id: string, dueAt: string | null): MilestoneView =>
  ({
    milestone: { id, name: `Milestone ${id}`, dueAt, critical: true },
    status: { state: 'NOT_READY' },
  }) as unknown as MilestoneView

describe('parseAgendaQuery', () => {
  it('falls back to no filter for anything unknown', () => {
    expect(parseAgendaQuery({ source: 'drop table', timing: ['OVERDUE'] })).toEqual({
      source: 'all',
    })
    expect(parseAgendaQuery({ source: 'work', timing: 'OVERDUE' })).toEqual({
      source: 'work',
      timing: 'OVERDUE',
    })
  })
})

describe('buildAgenda', () => {
  const w = [
    work('a', '2026-11-02T10:00:00Z', 'DUE_SOON'),
    work('b', null),
    work('c', '2026-10-30T09:00:00Z', 'OVERDUE'),
  ]
  const m = [ms('x', '2026-10-31T00:00:00Z'), ms('y', null)]

  it('lists only recorded due dates, merged by instant, never inventing one', () => {
    const rows = buildAgenda('m1', w, m, { source: 'all' })
    expect(rows.map((r) => r.key)).toEqual(['w:c', 'm:x', 'w:a'])
    expect(rows[0]?.href).toBe('/matters/m1/work/c')
    expect(rows[1]?.timing).toBeNull() // milestones are never given a derived timing
  })

  it('a source filter keeps one kind', () => {
    expect(buildAgenda('m1', w, m, { source: 'milestone' }).map((r) => r.key)).toEqual(['m:x'])
    expect(buildAgenda('m1', w, m, { source: 'work' }).map((r) => r.key)).toEqual(['w:c', 'w:a'])
  })

  it('a timing filter applies to work items and hides milestones', () => {
    expect(buildAgenda('m1', w, m, { source: 'all', timing: 'OVERDUE' }).map((r) => r.key)).toEqual(
      ['w:c'],
    )
  })

  it('equal instants keep a stable order', () => {
    const t = '2026-11-01T00:00:00Z'
    expect(
      buildAgenda('m1', [work('b', t), work('a', t)], [], { source: 'all' }).map((r) => r.key),
    ).toEqual(['w:a', 'w:b'])
  })
})

describe('dayKey', () => {
  it('the same instant is on different days in different zones', () => {
    const iso = '2026-10-29T20:30:00Z'
    expect(dayKey(iso, 'UTC')).toBe('2026-10-29')
    expect(dayKey(iso, 'Asia/Ho_Chi_Minh')).toBe('2026-10-30')
  })
})
