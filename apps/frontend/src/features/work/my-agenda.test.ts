import { describe, expect, it } from 'vitest'

import { myAgendaEntries, parseAgendaDay } from './my-agenda'
import type { AgendaRow } from './my-agenda'

const row = (over: Partial<AgendaRow>): AgendaRow => ({
  matterId: 'm1',
  matterTitle: 'Atlas',
  kind: 'work',
  itemId: 'a1',
  title: 'Draft SPA',
  dueAt: '2026-06-15T02:00:00Z',
  execution: 'NOT_STARTED',
  timing: 'OVERDUE',
  readiness: '',
  critical: false,
  ...over,
})

describe('parseAgendaDay', () => {
  it('accepts only a strict UTC day and ignores everything else', () => {
    expect(parseAgendaDay('2026-06-15')).toBe('2026-06-15')
    expect(parseAgendaDay('2026-6-15')).toBeUndefined()
    expect(parseAgendaDay('2026-06-15T02:00:00Z')).toBeUndefined()
    expect(parseAgendaDay('../../etc')).toBeUndefined()
    expect(parseAgendaDay(undefined)).toBeUndefined()
    expect(parseAgendaDay(['2026-06-15'])).toBeUndefined()
  })
})

describe('myAgendaEntries', () => {
  it('maps rows with their Matter name, source link and server timing', () => {
    const entries = myAgendaEntries(
      [
        row({}),
        row({
          kind: 'milestone',
          itemId: 'ms1',
          title: 'Closing',
          dueAt: '2026-07-01T00:00:00Z',
          execution: '',
          timing: '',
          readiness: 'NOT_READY',
        }),
      ],
      { source: 'all' },
    )
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      key: 'w:m1:a1',
      matterName: 'Atlas',
      href: '/matters/m1/work/a1',
      timing: 'OVERDUE',
      state: 'NOT_STARTED',
    })
    expect(entries[1]).toMatchObject({
      key: 'm:m1:ms1',
      href: '/matters/m1/planning',
      timing: null,
      state: 'NOT_READY',
    })
    expect(entries.map((e) => Date.parse(e.dueAt))).toEqual(
      [...entries.map((e) => Date.parse(e.dueAt))].sort((a, b) => a - b),
    )
  })

  it('applies the source and timing filters without turning a milestone into work', () => {
    const rows = [
      row({}),
      row({ kind: 'milestone', itemId: 'ms1', execution: '', timing: '', readiness: 'READY' }),
    ]
    expect(myAgendaEntries(rows, { source: 'work' })).toHaveLength(1)
    expect(myAgendaEntries(rows, { source: 'milestone' })).toHaveLength(1)
    // A timing filter applies to work rows only and hides every milestone.
    const filtered = myAgendaEntries(rows, { source: 'all', timing: 'OVERDUE' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]!.kind).toBe('work')
    // An unparseable timing never invents a filter match.
    const weird = [row({ timing: 'SOMEDAY' })]
    expect(myAgendaEntries(weird, { source: 'all', timing: 'OVERDUE' })).toHaveLength(0)
    expect(myAgendaEntries(weird, { source: 'all' })[0]!.timing).toBeNull()
  })

  it('sorts by recorded instant across Matters, then by key', () => {
    const entries = myAgendaEntries(
      [
        row({
          matterId: 'm2',
          matterTitle: 'Borealis',
          itemId: 'a9',
          dueAt: '2026-06-16T00:00:00Z',
        }),
        row({ dueAt: '2026-06-16T00:00:00Z' }),
        row({ dueAt: '2026-06-10T00:00:00Z' }),
      ],
      { source: 'all' },
    )
    expect(entries[0]!.dueAt).toBe('2026-06-10T00:00:00Z')
    expect(entries[1]!.matterName).toBe('Atlas')
    expect(entries[2]!.matterName).toBe('Borealis')
    // Equal instants keep a deterministic key order across Matters.
    expect(entries[1]!.key < entries[2]!.key).toBe(true)
  })
})
