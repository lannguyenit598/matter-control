import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// BF-03: dates are typed as wall-clock time in the device zone; the wire carries the instant.
const zone = vi.hoisted(() => ({ current: 'Asia/Ho_Chi_Minh' }))
vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => zone.current }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }))

const actions = vi.hoisted(() => ({ update: vi.fn(), transition: vi.fn() }))
vi.mock('../actions', () => ({
  updateWorkItemAction: actions.update,
  transitionExecutionAction: actions.transition,
  createMilestoneAction: vi.fn(),
  createWorkstreamAction: vi.fn(),
  createPartyAction: vi.fn(),
  updatePartyAction: vi.fn(),
  setMilestonePrerequisitesAction: vi.fn(),
}))

import type { Envelope } from '../schemas'

import { ExecutionPanel } from './execution-panel'
import { MetadataForm } from './metadata-form'

const entry = (dueAt: string | null): Envelope => ({
  item: {
    id: 'a1',
    kind: 'ACTION',
    matterId: 'm1',
    title: 'Draft SPA',
    outcome: 'First draft',
    execution: 'NOT_STARTED',
    dependency: 'READY',
    dependencyReasons: [],
    proofRequired: false,
    verification: null,
    verificationApplicability: null,
    applicabilityReason: null,
    proofEpoch: 0,
    workstreamId: null,
    ownerId: null,
    dueAt,
    completedAt: null,
    cancelledAt: null,
    waitingPartyId: null,
    waitingCondition: null,
    escalation: null,
    revision: 1,
  },
  derived: {
    timing: 'ON_TRACK',
    noDueDate: true,
    attention: 'NORMAL',
    attentionReasons: [],
    criticalChain: false,
  },
  etag: '"etag-1"',
})

const metadata = (dueAt: string | null) => (
  <MetadataForm matterId="m1" entry={entry(dueAt)} members={[]} workstreams={[]} canEdit />
)

beforeEach(() => {
  zone.current = 'Asia/Ho_Chi_Minh'
  actions.update.mockReset()
  actions.transition.mockReset()
  window.sessionStorage.clear()
})

describe('due date entry', () => {
  it('shows the device zone read-only, with no manual offset choice', () => {
    render(metadata(null))
    expect(screen.getByText(/Asia\/Ho_Chi_Minh/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Offset from UTC/)).not.toBeInTheDocument()
  })

  it('converts the typed local time with the zone offset (10:00 +07:00 is 03:00Z)', async () => {
    actions.update.mockResolvedValue({ ok: true })
    render(metadata(null))
    fireEvent.change(screen.getByLabelText(/Due \(date and time\)/), {
      target: { value: '2026-10-30T10:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(() => expect(actions.update).toHaveBeenCalled())
    expect(actions.update.mock.calls[0]![0]).toMatchObject({ dueAt: '2026-10-30T03:00:00Z' })
  })

  it('keeps the stored instant exactly when the shown value is untouched', async () => {
    actions.update.mockResolvedValue({ ok: true })
    render(metadata('2026-10-30T03:00:27Z'))
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(() => expect(actions.update).toHaveBeenCalled())
    expect(actions.update.mock.calls[0]![0]).toMatchObject({ dueAt: '2026-10-30T03:00:27Z' })
  })

  it('clears the date when the field is emptied', async () => {
    actions.update.mockResolvedValue({ ok: true })
    render(metadata('2026-10-30T03:00:00Z'))
    fireEvent.change(screen.getByLabelText(/Due \(date and time\)/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(() => expect(actions.update).toHaveBeenCalled())
    expect(actions.update.mock.calls[0]![0]).toMatchObject({ dueAt: '' })
  })

  it('refuses a local time that does not exist and sends nothing', async () => {
    zone.current = 'America/New_York'
    render(metadata(null))
    fireEvent.change(screen.getByLabelText(/Due \(date and time\)/), {
      target: { value: '2026-03-08T02:30' },
    })
    expect(screen.getAllByText(/does not exist in your time zone/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(() =>
      expect(screen.getAllByText(/does not exist in your time zone/).length).toBeGreaterThan(0),
    )
    expect(actions.update).not.toHaveBeenCalled()
  })

  it('asks which of two repeated local times is meant instead of guessing', async () => {
    zone.current = 'America/New_York'
    actions.update.mockResolvedValue({ ok: true })
    render(metadata(null))
    fireEvent.change(screen.getByLabelText(/Due \(date and time\)/), {
      target: { value: '2026-11-01T01:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(
      () =>
        expect(screen.getAllByText(/happens twice in your time zone/).length).toBeGreaterThan(0),
      { timeout: 8000 },
    )
    expect(actions.update).not.toHaveBeenCalled()
    // The refused first attempt is still settling (the button is busy): a click now would be ignored.
    await waitFor(
      () => expect(screen.getByRole('button', { name: /Save changes/ })).toBeEnabled(),
      {
        timeout: 8000,
      },
    )
    fireEvent.change(screen.getByLabelText(/Which one/), { target: { value: 'later' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }))
    await waitFor(() => expect(actions.update).toHaveBeenCalled(), { timeout: 8000 })
    expect(actions.update.mock.calls[0]![0]).toMatchObject({ dueAt: '2026-11-01T06:30:00Z' })
  }, 20000)
})

describe('completion time entry', () => {
  it('uses the same rule for the completed-at instant', async () => {
    actions.transition.mockResolvedValue({ ok: true })
    render(
      <ExecutionPanel matterId="m1" entry={entry(null)} role="EDITOR" parties={[]} titles={{}} />,
    )
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'COMPLETED' } })
    fireEvent.change(screen.getByLabelText(/Completed at/), {
      target: { value: '2026-10-30T10:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Change status/ }))
    await waitFor(() => expect(actions.transition).toHaveBeenCalled())
    expect(actions.transition.mock.calls[0]![0]).toMatchObject({
      to: 'COMPLETED',
      completedAt: '2026-10-30T03:00:00Z',
    })
  })
})
