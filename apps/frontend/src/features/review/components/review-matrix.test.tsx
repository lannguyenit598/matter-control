import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({ record: vi.fn() }))
vi.mock('../actions', () => ({
  createReviewGridAction: vi.fn(),
  addReviewVersionAction: vi.fn(),
  removeReviewVersionAction: vi.fn(),
  addReviewQuestionAction: vi.fn(),
  reviseReviewQuestionAction: vi.fn(),
  recordReviewAnswerAction: actions.record,
}))

import { CellDetail } from './cell-detail'
import { ReviewFilters } from './review-filters'
import { ReviewMatrix } from './review-matrix'
import type { ReviewAnswer, ReviewCell, ReviewGridView } from '../schemas'

const answer = (over: Partial<ReviewAnswer> = {}): ReviewAnswer => ({
  id: 'a2',
  versionId: 'v1',
  questionId: 'q1',
  questionRevision: 1,
  state: 'REVIEWED',
  text: 'Clause 12.3 applies',
  pageRef: '14',
  quoteRef: 'on a change of control',
  author: 'u1',
  answeredAt: '2026-10-29T08:00:00Z',
  supersedesId: 'a1',
  ...over,
})
const cell = (v: string, q: string, over: Partial<ReviewCell> = {}): ReviewCell => ({
  versionId: v,
  questionId: q,
  state: 'PENDING',
  stale: false,
  answer: null,
  ...over,
})

const view = (cells: ReviewCell[], over: Partial<ReviewGridView> = {}): ReviewGridView => ({
  id: 'g1',
  name: 'Change of control',
  revision: 3,
  createdBy: 'u1',
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
      revision: 2,
      text: 'Is there a termination right?',
      revisedBy: 'u1',
      revisedAt: '2026-10-29T09:00:00Z',
    },
    {
      id: 'q2',
      position: 1,
      revision: 1,
      text: 'Assignment?',
      revisedBy: 'u1',
      revisedAt: '2026-10-29T08:00:00Z',
    },
  ],
  questionHistory: [
    {
      id: 'q1',
      position: 0,
      revision: 1,
      text: 'Change of control?',
      revisedBy: 'u1',
      revisedAt: '2026-10-29T08:00:00Z',
    },
    {
      id: 'q1',
      position: 0,
      revision: 2,
      text: 'Is there a termination right?',
      revisedBy: 'u1',
      revisedAt: '2026-10-29T09:00:00Z',
    },
    {
      id: 'q2',
      position: 1,
      revision: 1,
      text: 'Assignment?',
      revisedBy: 'u1',
      revisedAt: '2026-10-29T08:00:00Z',
    },
  ],
  cells,
  ...over,
})

const cells = [
  cell('v1', 'q1', { state: 'REVIEWED', stale: true, answer: answer() }),
  cell('v1', 'q2', {
    state: 'ABSENT',
    answer: answer({ id: 'a3', questionId: 'q2', state: 'ABSENT', text: '' }),
  }),
  cell('v2', 'q1'),
  cell('v2', 'q2', {
    state: 'UNABLE',
    answer: answer({
      id: 'a4',
      versionId: 'v2',
      questionId: 'q2',
      state: 'UNABLE',
      text: 'scan is unreadable',
    }),
  }),
]

beforeEach(() => {
  router.refresh.mockClear()
  actions.record.mockReset()
  window.sessionStorage.clear()
})

describe('ReviewMatrix', () => {
  it('renders exact versions as rows and questions as columns, states in words, links that keep the filters', () => {
    render(
      <ReviewMatrix
        matterId="m1"
        view={view(cells)}
        filter={{ state: undefined }}
        selected={null}
      />,
    )
    const table = screen.getByRole('table', { name: 'Change of control' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('Share purchase agreement')).toBeInTheDocument()
    expect(within(table).getByText(/not the current version/)).toBeInTheDocument() // neutral wording, never "superseded"
    expect(within(table).queryByText(/superseded/i)).toBeNull()
    for (const word of ['Stale', 'Absent', 'Pending', 'Unable'])
      expect(within(table).getByText(word)).toBeInTheDocument()
    const link = within(table).getByRole('link', { name: /Stale/ })
    expect(link).toHaveAttribute('href', '/matters/m1/reviews?grid=g1&cell=v1%3Aq1')
  })

  it('a filter hides rows without a match and dims the other cells; no match is stated', () => {
    const { rerender } = render(
      <ReviewMatrix
        matterId="m1"
        view={view(cells)}
        filter={{ state: 'PENDING' }}
        selected={null}
      />,
    )
    expect(screen.queryByText('Share purchase agreement')).toBeNull()
    expect(screen.getByText('Lease')).toBeInTheDocument()
    rerender(
      <ReviewMatrix
        matterId="m1"
        view={view(cells)}
        filter={{ q: 'zzz-no-match' }}
        selected={null}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('No cell matches these filters.')
  })

  it('marks the selected cell and says what to do for an empty grid', () => {
    const { rerender } = render(
      <ReviewMatrix
        matterId="m1"
        view={view(cells)}
        filter={{}}
        selected={{ versionId: 'v2', questionId: 'q2' }}
      />,
    )
    expect(screen.getByRole('link', { name: /Unable/ })).toHaveAttribute('aria-current', 'true')
    rerender(
      <ReviewMatrix
        matterId="m1"
        view={view([], { versions: [], questions: [] })}
        filter={{}}
        selected={null}
      />,
    )
    expect(
      screen.getByText(/Add at least one document version and one question/),
    ).toBeInTheDocument()
  })
})

describe('ReviewFilters', () => {
  it('state chips keep the text and the text form keeps the state', () => {
    render(<ReviewFilters matterId="m1" gridId="g1" filter={{ state: 'STALE', q: 'lease' }} />)
    expect(screen.getByRole('link', { name: 'Pending' })).toHaveAttribute(
      'href',
      '/matters/m1/reviews?grid=g1&state=PENDING&q=lease',
    )
    expect(screen.getByRole('link', { name: 'All cells' })).toHaveAttribute(
      'href',
      '/matters/m1/reviews?grid=g1&q=lease',
    )
    expect(screen.getByRole('link', { name: 'Stale' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('searchbox')).toHaveValue('lease')
    expect(document.querySelector('input[name=state]')).toHaveValue('STALE')
  })
})

describe('CellDetail', () => {
  const detail = (
    cellKey: [string, string],
    canWrite = true,
    history: { items: ReviewAnswer[]; nextCursor: string | null } | null = null,
  ) =>
    render(
      <CellDetail
        matterId="m1"
        view={view(cells)}
        cell={{ versionId: cellKey[0], questionId: cellKey[1] }}
        filter={{}}
        history={history}
        names={{ u1: 'Alice' }}
        canWrite={canWrite}
      />,
    )

  it('a stale answer shows the wording it actually answered and who recorded it', () => {
    detail(['v1', 'q1'])
    const d = within(screen.getByLabelText('Cell detail'))
    expect(d.getByText(/The question was reworded after this answer/)).toBeInTheDocument()
    expect(d.getByText('Change of control?')).toBeInTheDocument() // revision 1 wording
    expect(d.getByText(/Alice/)).toBeInTheDocument()
    expect(d.getByText('Clause 12.3 applies')).toBeInTheDocument()
  })

  it('typed references are always labelled as not validated and are rendered as text, never markup', () => {
    const evil = answer({ quoteRef: '<img src=x onerror=alert(1)>', pageRef: '9' })
    render(
      <CellDetail
        matterId="m1"
        view={view([cell('v1', 'q1', { state: 'REVIEWED', answer: evil }), ...cells.slice(1)])}
        cell={{ versionId: 'v1', questionId: 'q1' }}
        filter={{}}
        history={null}
        names={{}}
        canWrite={false}
      />,
    )
    const d = within(screen.getByLabelText('Cell detail'))
    expect(d.getByText(/typed by a person, not validated/)).toBeInTheDocument()
    expect(d.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
    expect(d.getByText(/a former member/)).toBeInTheDocument() // unknown author is never an id
  })

  it("a viewer sees no answer form; a writer's form carries the answer they saw", async () => {
    const { unmount } = detail(['v1', 'q1'], false)
    expect(screen.queryByRole('button', { name: 'Record answer' })).toBeNull()
    unmount()
    actions.record.mockResolvedValue({ ok: true, id: 'a9' })
    detail(['v1', 'q1'], true)
    fireEvent.change(screen.getByLabelText(/^What you found/), {
      target: { value: 'Termination on change of control (cl. 9)' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
    await waitFor(() => expect(actions.record).toHaveBeenCalledTimes(1))
    expect(actions.record.mock.calls[0]![0]).toMatchObject({
      matterId: 'm1',
      gridId: 'g1',
      versionId: 'v1',
      questionId: 'q1',
      expectedAnswerId: 'a2',
      state: 'REVIEWED',
      text: 'Termination on change of control (cl. 9)',
    })
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it("an empty cell is answered against 'none'; a conflict keeps the person's text and does not retry", async () => {
    actions.record.mockResolvedValue({
      ok: false,
      kind: 'stale',
      error: 'This changed since you opened it. Reload to see the latest.',
    })
    detail(['v2', 'q1'])
    expect(screen.getByText('No one has answered this cell yet.')).toBeInTheDocument()
    const text = screen.getByLabelText(/^What you found/)
    fireEvent.change(text, { target: { value: 'my careful note' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
    await screen.findByText(/changed since you opened it/i)
    expect(actions.record.mock.calls[0]![0]).toMatchObject({
      expectedAnswerId: '',
      expectedQuestionRevision: 2,
    })
    expect(text).toHaveValue('my careful note')
    expect(actions.record).toHaveBeenCalledTimes(1)
  })

  it('a cell that left the grid is explained, not rendered', () => {
    detail(['gone', 'q1'])
    expect(screen.getByRole('status')).toHaveTextContent('no longer in this grid')
    expect(screen.queryByLabelText('Cell detail')).toBeNull()
  })
})

describe('CellDetail history', () => {
  it('older answers stay readable with their text, references, author and the wording they answered', () => {
    const older = answer({
      id: 'a1',
      questionRevision: 1,
      state: 'REVIEWED',
      text: 'Earlier conclusion: no right',
      pageRef: '3',
      quoteRef: 'silent',
      author: 'u1',
      supersedesId: null,
    })
    const current = answer({
      id: 'a2',
      questionRevision: 2,
      text: 'Current conclusion',
      supersedesId: 'a1',
    })
    render(
      <CellDetail
        matterId="m1"
        view={view([cell('v1', 'q1', { state: 'REVIEWED', answer: current }), ...cells.slice(1)])}
        cell={{ versionId: 'v1', questionId: 'q1' }}
        filter={{}}
        history={{ items: [current, older], nextCursor: null }}
        names={{ u1: 'Alice' }}
        canWrite={false}
      />,
    )
    const h = within(screen.getByLabelText('Answer history'))
    expect(h.getByText('Earlier conclusion: no right')).toBeInTheDocument()
    expect(h.getByText('silent')).toBeInTheDocument()
    expect(h.getAllByText(/typed by a person, not validated/)).toHaveLength(2) // both entries carry refs
    expect(h.getByText('Change of control?')).toBeInTheDocument() // the wording it answered (revision 1)
    expect(h.getAllByText(/Alice/).length).toBeGreaterThan(0)
  })
})
