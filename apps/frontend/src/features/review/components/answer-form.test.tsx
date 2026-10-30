import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({ record: vi.fn() }))
vi.mock('../actions', () => ({ recordReviewAnswerAction: actions.record }))

import { DraftScopeProvider } from '@/components/organisms/draft-scope'

import { AnswerForm } from './answer-form'

const id = '0192b1c4-0000-7000-8000-000000000001'

beforeEach(() => {
  actions.record.mockReset()
  router.refresh.mockClear()
  window.sessionStorage.clear()
})

const base = { matterId: id, gridId: id, versionId: id, questionId: id }

async function unknownOutcome() {
  actions.record.mockResolvedValueOnce({
    ok: false,
    kind: 'outcome-unknown',
    error: 'unknown',
    retrySameKey: true,
  })
  fireEvent.change(screen.getByLabelText(/^What you found/), {
    target: { value: 'careful original answer' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
  await screen.findByText('Outcome not confirmed')
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Retry the same request/ })).not.toBeDisabled(),
  )
}

it('an UNKNOWN retry keeps the exact command after the view refreshes its props', async () => {
  const { rerender } = render(<AnswerForm {...base} expectedAnswerId="" questionRevision={1} />)
  await unknownOutcome()
  const first = { ...actions.record.mock.calls[0]![0] }
  rerender(<AnswerForm {...base} expectedAnswerId={id} questionRevision={2} />)
  actions.record.mockResolvedValueOnce({ ok: true, id: 'synthetic-answer', replayed: true })
  fireEvent.click(screen.getByRole('button', { name: /Retry the same request/ }))
  await waitFor(() => expect(actions.record).toHaveBeenCalledTimes(2))
  expect(actions.record.mock.calls[1]![0]).toEqual(first)
})

it('after a reload the stored attempt replays the original key and CAS, not the refreshed props', async () => {
  const firstView = render(
    <DraftScopeProvider namespace="sess-a">
      <AnswerForm {...base} expectedAnswerId="" questionRevision={1} />
    </DraftScopeProvider>,
  )
  await unknownOutcome()
  const first = { ...actions.record.mock.calls[0]![0] }
  firstView.unmount()

  // The page reloaded and the refreshed view shows a new current answer and wording revision.
  render(
    <DraftScopeProvider namespace="sess-a">
      <AnswerForm {...base} expectedAnswerId={id} questionRevision={2} />
    </DraftScopeProvider>,
  )
  actions.record.mockResolvedValueOnce({ ok: true, id: 'synthetic-answer', replayed: true })
  fireEvent.click(screen.getByRole('button', { name: /Retry the same request/ }))
  await waitFor(() => expect(actions.record).toHaveBeenCalledTimes(2))
  expect(actions.record.mock.calls[1]![0]).toEqual(first)
})

it('editing the text after an UNKNOWN does not mutate the retried command', async () => {
  render(<AnswerForm {...base} expectedAnswerId="" questionRevision={1} />)
  await unknownOutcome()
  const first = { ...actions.record.mock.calls[0]![0] }
  fireEvent.change(screen.getByLabelText(/^What you found/), {
    target: { value: 'edited while unresolved' },
  })
  actions.record.mockResolvedValueOnce({ ok: true, id: 'synthetic-answer', replayed: true })
  fireEvent.click(screen.getByRole('button', { name: /Retry the same request/ }))
  await waitFor(() => expect(actions.record).toHaveBeenCalledTimes(2))
  expect(actions.record.mock.calls[1]![0]).toEqual(first)
})

it('a resolved outcome starts a different intent: a new key and the freshly edited values', async () => {
  render(<AnswerForm {...base} expectedAnswerId="" questionRevision={1} />)
  await unknownOutcome()
  // The explicit discard is what starts a different intent under a new key.
  fireEvent.click(screen.getByRole('button', { name: /Discard and start a different request/ }))
  fireEvent.change(screen.getByLabelText(/^What you found/), { target: { value: 'new intent' } })
  actions.record.mockResolvedValueOnce({ ok: true, id: 'synthetic-answer-2' })
  fireEvent.click(screen.getByRole('button', { name: 'Record answer' }))
  await waitFor(() => expect(actions.record).toHaveBeenCalledTimes(2))
  expect(actions.record.mock.calls[1]![0]).toMatchObject({ text: 'new intent' })
  expect(actions.record.mock.calls[1]![0].idempotencyKey).not.toBe(
    actions.record.mock.calls[0]![0].idempotencyKey,
  )
})
