import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({ record: vi.fn(), history: vi.fn() }))
vi.mock('../actions', () => ({
  recordReviewAnswerAction: actions.record,
  reviewHistoryAction: actions.history,
}))

import { CellDetail } from './cell-detail'
import type { ReviewAnswer, ReviewGridView } from '../schemas'

const id = '0192b1c4-0000-7000-8000-000000000001'

beforeEach(() => {
  actions.record.mockReset()
  actions.history.mockReset()
  router.refresh.mockClear()
  window.sessionStorage.clear()
})

const answer = (over: Partial<ReviewAnswer> = {}): ReviewAnswer => ({
  id: 'a1',
  versionId: id,
  questionId: id,
  questionRevision: 1,
  state: 'REVIEWED',
  text: 'PRIVATE EXISTING ANSWER',
  pageRef: '7',
  quoteRef: 'PRIVATE QUOTE',
  author: 'u1',
  answeredAt: '2026-10-29T08:00:00Z',
  supersedesId: null,
  ...over,
})

const question = {
  id,
  position: 0,
  revision: 1,
  text: 'Synthetic question',
  revisedBy: 'u1',
  revisedAt: '2026-10-29T08:00:00Z',
}

const view = (over: Partial<ReviewGridView> = {}): ReviewGridView => ({
  id,
  name: 'Synthetic grid',
  revision: 1,
  createdBy: 'u1',
  createdAt: question.revisedAt,
  versionCount: 1,
  questionCount: 1,
  versions: [
    {
      versionId: id,
      documentId: id,
      documentName: 'PRIVATE DOCUMENT',
      filename: 'synthetic.pdf',
      no: 1,
      current: true,
    },
  ],
  questions: [question],
  questionHistory: [question],
  cells: [{ versionId: id, questionId: id, state: 'REVIEWED', stale: false, answer: answer() }],
  ...over,
})

function detail(
  over: { history?: { items: ReviewAnswer[]; nextCursor: string | null } | null } = {},
) {
  render(
    <CellDetail
      matterId={id}
      view={view()}
      cell={{ versionId: id, questionId: id }}
      filter={{}}
      history={over.history ?? null}
      names={{ u1: 'Synthetic user' }}
      canWrite
    />,
  )
}

async function submitAndExpect(kind: string, error: string) {
  actions.record.mockResolvedValue({ ok: false, kind, error })
  fireEvent.change(screen.getByLabelText(/^What you found/), { target: { value: 'new note' } })
  fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
  await screen.findByText(error)
}

it.each([
  ['not-found', 'This item no longer exists or you no longer have access to it.'],
  ['forbidden', 'You do not have permission to do this.'],
  ['unauthenticated', 'Your session has ended. Sign in again to continue.'],
])('a %s refusal clears every protected word of the cell detail', async (kind, error) => {
  detail({
    history: {
      items: [
        answer({ id: 'h1', text: 'PRIVATE OLDER ANSWER', quoteRef: '' }),
        answer({ id: 'h2', text: 'PRIVATE OLDEST ANSWER', pageRef: '', quoteRef: '' }),
      ],
      nextCursor: null,
    },
  })
  await submitAndExpect(kind, error)
  expect(screen.queryByText('PRIVATE EXISTING ANSWER')).toBeNull()
  expect(screen.queryByText('PRIVATE QUOTE')).toBeNull()
  expect(screen.queryByText('PRIVATE DOCUMENT')).toBeNull()
  expect(screen.queryByText('Synthetic question')).toBeNull()
  expect(screen.queryByText('Synthetic grid')).toBeNull()
  expect(screen.queryByText('PRIVATE OLDER ANSWER')).toBeNull()
  expect(screen.queryByText('new note')).toBeNull()
  // The refusal and a safe way out stay on screen.
  expect(screen.getByText(error)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Back to all review grids/ })).toBeInTheDocument()
})

it('a stale conflict (412) keeps the loaded content and the typed text', async () => {
  detail()
  await submitAndExpect(
    'stale',
    'This changed since you opened it. Reload to see the latest version, then try again.',
  )
  expect(screen.getByText('PRIVATE EXISTING ANSWER')).toBeInTheDocument()
  expect(screen.getByText('PRIVATE QUOTE')).toBeInTheDocument()
  expect(screen.getByLabelText(/^What you found/)).toHaveValue('new note')
})

it('an UNKNOWN outcome keeps the loaded content for safe recovery', async () => {
  detail()
  actions.record.mockResolvedValue({
    ok: false,
    kind: 'outcome-unknown',
    error: 'unknown',
    retrySameKey: true,
  })
  fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
  await screen.findByText('Outcome not confirmed')
  expect(screen.getByText('PRIVATE EXISTING ANSWER')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Retry the same request/ })).toBeInTheDocument()
})

it('an older-answers control appends the next page and announces the end honestly', async () => {
  const older = answer({ id: 'a0', text: 'OLDER ANSWER' })
  actions.history.mockResolvedValueOnce({ ok: true, items: [older], nextCursor: null })
  detail({
    history: {
      items: [answer({ id: 'h1', text: 'FIRST PAGE ANSWER', quoteRef: '' })],
      nextCursor: 'tok-1',
    },
  })
  expect(screen.getByText('FIRST PAGE ANSWER')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Older answers/ }))
  await waitFor(() => expect(actions.history).toHaveBeenCalledTimes(1))
  expect(actions.history.mock.calls[0]![0]).toMatchObject({
    matterId: id,
    gridId: id,
    versionId: id,
    questionId: id,
    cursor: 'tok-1',
  })
  await screen.findByText('OLDER ANSWER')
  expect(screen.getByText('FIRST PAGE ANSWER')).toBeInTheDocument()
  // End of history is stated, and no further continuation control remains.
  expect(screen.getByText(/beginning of this history/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Older answers/ })).toBeNull()
})

it('a transient page failure keeps the already-read history and offers a retry', async () => {
  actions.history.mockResolvedValueOnce({ ok: false, kind: 'unavailable', error: 'down' })
  detail({
    history: {
      items: [
        answer({ id: 'h1', text: 'FIRST PAGE ANSWER', quoteRef: '' }),
        answer({ id: 'h2', text: 'SECOND PAGE ITEM', pageRef: '', quoteRef: '' }),
      ],
      nextCursor: 'tok-1',
    },
  })
  fireEvent.click(screen.getByRole('button', { name: /Older answers/ }))
  await screen.findByRole('alert')
  expect(screen.getByText('FIRST PAGE ANSWER')).toBeInTheDocument()
  actions.history.mockResolvedValueOnce({ ok: true, items: [], nextCursor: null })
  fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
  await waitFor(() => expect(actions.history).toHaveBeenCalledTimes(2))
  // The retried page is the end: the error clears, the end is stated, the history remains.
  expect(screen.getByText('FIRST PAGE ANSWER')).toBeInTheDocument()
  expect(screen.getByText(/beginning of this history/)).toBeInTheDocument()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByRole('button', { name: /Older answers/ })).toBeNull()
})

it('a definitive denial while loading older answers clears the protected detail', async () => {
  actions.history.mockResolvedValue({
    ok: false,
    kind: 'not-found',
    error: 'This item no longer exists or you no longer have access to it.',
  })
  detail({ history: { items: [answer()], nextCursor: 'tok-1' } })
  fireEvent.click(screen.getByRole('button', { name: /Older answers/ }))
  await screen.findByRole('alert')
  expect(screen.queryByText('PRIVATE EXISTING ANSWER')).toBeNull()
  expect(screen.queryByText('PRIVATE QUOTE')).toBeNull()
  expect(screen.getByText(/no longer have access to this review surface/)).toBeInTheDocument()
})
