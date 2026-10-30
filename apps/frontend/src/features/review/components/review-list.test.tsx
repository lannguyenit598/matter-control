import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({ createGrid: vi.fn() }))
vi.mock('../actions', () => ({
  createReviewGridAction: actions.createGrid,
  addReviewVersionAction: vi.fn(),
  removeReviewVersionAction: vi.fn(),
  addReviewQuestionAction: vi.fn(),
  reviseReviewQuestionAction: vi.fn(),
  recordReviewAnswerAction: vi.fn(),
}))

import { CreateGridDialog } from './create-grid-dialog'
import { ReviewGridList } from './review-grid-list'

const grid = (id: string, name: string, v = 2, q = 3) => ({
  id,
  name,
  revision: 1,
  createdBy: 'u',
  createdAt: '2026-10-29T08:00:00Z',
  versionCount: v,
  questionCount: q,
})

beforeEach(() => {
  router.push.mockClear()
  actions.createGrid.mockReset()
  window.sessionStorage.clear()
})

describe('ReviewGridList', () => {
  it('lists grids with their counts and a link that selects the grid', () => {
    render(
      <ReviewGridList
        matterId="m1"
        items={[grid('g1', 'Change of control'), grid('g2', 'Assignment', 1, 4)]}
      />,
    )
    const link = screen.getByRole('link', { name: /Change of control/ })
    expect(link).toHaveAttribute('href', '/matters/m1/reviews?grid=g1')
    expect(within(link).getByText(/2 versions/)).toBeInTheDocument()
    expect(within(link).getByText(/3 questions/)).toBeInTheDocument()
    expect(screen.getByText(/never verifies a requirement or completes work/)).toBeInTheDocument()
  })

  it('an empty list is an honest empty state, and the create button is only what the page passes', () => {
    const { rerender } = render(<ReviewGridList matterId="m1" items={[]} />)
    expect(screen.getByText('No review grid yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /New review grid/ })).toBeNull()
    rerender(
      <ReviewGridList matterId="m1" items={[]} action={<CreateGridDialog matterId="m1" />} />,
    )
    expect(screen.getByRole('button', { name: /New review grid/ })).toBeInTheDocument()
  })
})

describe('CreateGridDialog', () => {
  const open = () => {
    render(<CreateGridDialog matterId="m1" />)
    expect(screen.queryByRole('dialog')).toBeNull() // nothing is open or sent on load
    fireEvent.click(screen.getByRole('button', { name: /New review grid/ }))
    return screen.getByRole('dialog')
  }

  it('creates with one idempotency key and opens the new grid', async () => {
    actions.createGrid.mockResolvedValue({ ok: true, id: 'g9' })
    const dialog = open()
    fireEvent.change(within(dialog).getByLabelText(/^Name/), {
      target: { value: 'Change of control' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create grid' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/matters/m1/reviews?grid=g9'))
    expect(actions.createGrid).toHaveBeenCalledTimes(1)
    expect(actions.createGrid.mock.calls[0]![0]).toMatchObject({
      matterId: 'm1',
      name: 'Change of control',
    })
    expect(String(actions.createGrid.mock.calls[0]![0].idempotencyKey).length).toBeGreaterThan(10)
  })

  it('after a lost answer, the retry reuses the SAME key and never makes a new request on its own', async () => {
    actions.createGrid.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'unknown',
      retrySameKey: true,
    })
    const dialog = open()
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'DD' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create grid' }))
    await within(dialog).findByText('Outcome not confirmed')
    expect(actions.createGrid).toHaveBeenCalledTimes(1)
    const firstKey = actions.createGrid.mock.calls[0]![0].idempotencyKey
    actions.createGrid.mockResolvedValueOnce({ ok: true, id: 'g1', replayed: true })
    // The control is disabled while the lost request is still pending; wait until it is
    // accepting input again, or the click is silently swallowed and nothing is retried.
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: /Retry the same request/ }),
      ).not.toBeDisabled(),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: /Retry the same request/ }))
    await waitFor(() => expect(actions.createGrid).toHaveBeenCalledTimes(2))
    expect(actions.createGrid.mock.calls[1]![0].idempotencyKey).toBe(firstKey)
  }, 15_000)
})
