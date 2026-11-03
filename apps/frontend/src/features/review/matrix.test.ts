import { describe, expect, it } from 'vitest'

import { cellLabel, filterCells, parseCell, parseMatrixFilter, visibleVersionIds } from './matrix'
import type { ReviewCell, ReviewGridView } from './schemas'

const answer = (
  over: Partial<NonNullable<ReviewCell['answer']>> = {},
): NonNullable<ReviewCell['answer']> => ({
  id: 'a1',
  versionId: 'v1',
  questionId: 'q1',
  questionRevision: 1,
  state: 'REVIEWED',
  text: 'Clause 12.3 applies',
  pageRef: '14',
  quoteRef: 'on a change of control',
  author: 'u',
  answeredAt: '2026-10-29T08:00:00Z',
  supersedesId: null,
  ...over,
})
const cell = (
  versionId: string,
  questionId: string,
  over: Partial<ReviewCell> = {},
): ReviewCell => ({
  versionId,
  questionId,
  state: 'PENDING',
  stale: false,
  answer: null,
  ...over,
})

const view = (cells: ReviewCell[]): ReviewGridView => ({
  id: 'g1',
  name: 'DD',
  revision: 3,
  createdBy: 'u',
  createdAt: '2026-10-29T08:00:00Z',
  versionCount: 2,
  questionCount: 2,
  versions: [
    {
      versionId: 'v1',
      documentId: 'd1',
      documentName: 'Share purchase agreement',
      filename: 'spa.pdf',
      no: 1,
      current: true,
    },
    {
      versionId: 'v2',
      documentId: 'd2',
      documentName: 'Lease',
      filename: 'lease.pdf',
      no: 2,
      current: false,
    },
  ],
  questions: [
    {
      id: 'q1',
      position: 0,
      revision: 1,
      text: 'Change of control?',
      revisedBy: 'u',
      revisedAt: '2026-10-29T08:00:00Z',
    },
    {
      id: 'q2',
      position: 1,
      revision: 1,
      text: 'Assignment?',
      revisedBy: 'u',
      revisedAt: '2026-10-29T08:00:00Z',
    },
  ],
  questionHistory: [],
  cells,
})

describe('cellLabel', () => {
  it('stale wins for display, otherwise the recorded state, otherwise pending', () => {
    expect(cellLabel(cell('v1', 'q1'))).toBe('PENDING')
    expect(
      cellLabel(cell('v1', 'q1', { state: 'ABSENT', answer: answer({ state: 'ABSENT' }) })),
    ).toBe('ABSENT')
    expect(cellLabel(cell('v1', 'q1', { state: 'REVIEWED', stale: true, answer: answer() }))).toBe(
      'STALE',
    )
  })
})

describe('filters', () => {
  const cells = [
    cell('v1', 'q1', { state: 'REVIEWED', answer: answer() }),
    cell('v1', 'q2', {
      state: 'ABSENT',
      stale: true,
      answer: answer({ state: 'ABSENT', text: '' }),
    }),
    cell('v2', 'q1'),
    cell('v2', 'q2', {
      state: 'UNABLE',
      answer: answer({ state: 'UNABLE', text: 'scan unreadable' }),
    }),
  ]
  const v = view(cells)

  it('by state, with STALE as its own state', () => {
    expect(
      filterCells(v, { state: 'PENDING' }).map((c) => `${c.versionId}/${c.questionId}`),
    ).toEqual(['v2/q1'])
    expect(filterCells(v, { state: 'STALE' })).toHaveLength(1)
    expect(filterCells(v, { state: 'UNABLE' })).toHaveLength(1)
  })

  it('by text across the answer, its refs, the question and the document', () => {
    expect(
      filterCells(v, { q: 'assignment' }).map((c) => `${c.versionId}/${c.questionId}`),
    ).toEqual(['v1/q2', 'v2/q2']) // the question text
    expect(filterCells(v, { q: '12.3' })).toHaveLength(1) // answer text
    expect(filterCells(v, { q: 'ON A CHANGE' })).toHaveLength(3) // quote of the three answered cells, case-insensitive
    expect(filterCells(v, { q: 'lease' })).toHaveLength(2) // document name
    expect(filterCells(v, { q: 'nothing like this' })).toHaveLength(0)
  })

  it('rows are shown when any of their cells matches; no filter shows every row', () => {
    expect(visibleVersionIds(v, {})).toEqual(['v1', 'v2'])
    expect(visibleVersionIds(v, { state: 'PENDING' })).toEqual(['v2'])
    expect(visibleVersionIds(v, { q: 'zzz' })).toEqual([])
  })
})

describe('untrusted URL state', () => {
  it('unknown filter values fall back to no filter and long text is cut', () => {
    expect(parseMatrixFilter({ state: 'DROP', q: ['x'] })).toEqual({})
    expect(parseMatrixFilter({ state: 'STALE', q: '  term ' })).toEqual({
      state: 'STALE',
      q: 'term',
    })
    expect(parseMatrixFilter({ q: 'x'.repeat(500) }).q).toHaveLength(100)
  })

  it('a cell reference must be two ids', () => {
    expect(parseCell('v1:q1')).toEqual({ versionId: 'v1', questionId: 'q1' })
    for (const bad of [undefined, '', 'v1', 'v1:', ':q1', 'v1:q1:x', '../x:q1', 'v 1:q1'])
      expect(parseCell(bad)).toBeNull()
  })
})
