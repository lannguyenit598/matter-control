import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
vi.mock('../actions', () => ({
  createContextAction: actions.create,
  updateContextAction: actions.update,
}))

import type { ControlRoom } from '../schemas'

import { roomTitles } from '../room-labels'

import { CloseContextForm, CreateContextForm } from './context-forms'
import { ControlRoomView } from './control-room-view'

const row = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  item: {
    id,
    kind: 'ACTION' as const,
    title,
    execution: 'IN_PROGRESS',
    dependency: 'READY',
    verification: null,
    ownerId: 'u1',
    dueAt: null,
    waitingPartyId: null,
    waitingCondition: null,
    proofRequired: false,
    ...over,
  },
  derived: { timing: 'ON_TRACK', attention: 'NORMAL', attentionReasons: [], criticalChain: false },
  etag: '"e"',
})

const decision = {
  id: 'd1',
  kind: 'DECISION' as const,
  title: 'Wire before signing?',
  body: '',
  status: 'OPEN' as const,
  links: ['a1'],
  createdBy: 'u1',
  createdAt: 'x',
  revision: 1,
  etag: '"d1"',
}

const room = (over: Partial<ControlRoom> = {}): ControlRoom => ({
  asOf: '2026-10-27T01:00:00Z',
  sourceRevision: 42,
  state: {
    total: 4,
    byExecution: { WAITING: 1 },
    blocked: 1,
    overdue: 0,
    critical: 0,
    awaitingProof: 0,
    openFilings: 0,
    negativeFilings: 0,
  },
  blockers: [
    {
      ...row('b1', 'Wire the price', { dependency: 'BLOCKED', ownerId: null }),
      reasons: [{ edgeId: 'e1', sourceId: 'a1', gate: 'COMPLETION', code: 'NOT_COMPLETED' }],
      upstream: [{ id: 'a1', title: 'Sign the SPA', execution: 'IN_PROGRESS', verification: null }],
    },
  ],
  nextActions: [{ ...row('a1', 'Sign the SPA'), unblocks: ['b1'], decisions: [decision] }],
  waiting: [
    row('w1', 'Comments', {
      execution: 'WAITING',
      waitingPartyId: 'p1',
      waitingCondition: 'awaiting comments',
    }),
  ],
  milestones: [],
  gaps: [{ itemId: 'b1', kind: 'NO_OWNER' }],
  decisions: [decision],
  risks: [],
  findings: [],
  records: [decision],
  titles: { a1: 'Sign the SPA', b1: 'Wire the price' },
  changes: [
    {
      seq: 9,
      id: 'ev9',
      type: 'work.dependency_changed',
      targetKind: 'ACTION',
      targetId: 'b1',
      recordedAt: '2026-10-27T00:59:00Z',
      reason: null,
    },
  ],
  ...over,
})

const labels = {
  users: { u1: 'Alice' },
  parties: { p1: 'Counterparty counsel' },
  titles: { a1: 'Sign the SPA', b1: 'Wire the price' },
}

beforeEach(() => {
  router.refresh.mockClear()
  actions.create.mockReset()
  actions.update.mockReset()
  window.sessionStorage.clear()
})

describe('ControlRoomView', () => {
  it('brief variant caps what to act on, drops gaps and decisions, and says how many more exist', () => {
    const many = (n: number, f: (i: number) => ReturnType<typeof row>) =>
      Array.from({ length: n }, (_, i) => f(i))
    render(
      <ControlRoomView
        matterId="m1"
        variant="brief"
        labels={labels}
        room={room({
          waiting: many(5, (i) =>
            row(`w${i}`, `Wait ${i}`, {
              execution: 'WAITING',
              waitingPartyId: 'p1',
              waitingCondition: 'c',
            }),
          ),
        })}
      />,
    )
    expect(screen.getByRole('region', { name: 'Blocked' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Do next' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Waiting on' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'What changed' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Gaps' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Open decisions, risks and findings' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Wait 2')).toBeInTheDocument()
    expect(screen.queryByText('Wait 3')).not.toBeInTheDocument()
    expect(screen.getByText('2 more in the Control Room.')).toBeInTheDocument()
  })

  it('states its boundary and the figures it shows', () => {
    render(<ControlRoomView matterId="m1" room={room()} labels={labels} />)
    expect(screen.getByText(/source revision 42/)).toBeInTheDocument()
    const state = screen.getByLabelText('State')
    expect(within(state).getByText('Blocked').nextElementSibling).toHaveTextContent('1')
  })

  it('connects a blocker to what holds it and a next action to what it releases and its decision', () => {
    render(<ControlRoomView matterId="m1" room={room()} labels={labels} />)
    const blocked = screen.getByRole('region', { name: 'Blocked' })
    expect(within(blocked).getByText(/Completion gate on/)).toBeInTheDocument()
    expect(within(blocked).getByText(/the prerequisite is not completed/)).toBeInTheDocument()
    expect(
      within(blocked).getByRole('link', { name: 'Sign the SPA' }).getAttribute('href'),
    ).toContain('/matters/m1/work/a1')
    const next = screen.getByRole('region', { name: 'Do next' })
    expect(within(next).getByText(/Releases: Wire the price/)).toBeInTheDocument()
    expect(within(next).getByText(/Wire before signing\?/)).toBeInTheDocument()
    expect(within(next).getByText(/owner Alice/)).toBeInTheDocument()
  })

  it('distinguishes waiting from blocked and names the party and condition', () => {
    render(<ControlRoomView matterId="m1" room={room()} labels={labels} />)
    const waiting = screen.getByRole('region', { name: 'Waiting on' })
    expect(within(waiting).getByText(/Counterparty counsel/)).toBeInTheDocument()
    expect(within(waiting).getByText(/awaiting comments/)).toBeInTheDocument()
  })

  it('says plainly when a section is empty instead of hiding it or showing zero as unknown', () => {
    render(
      <ControlRoomView
        matterId="m1"
        room={room({
          blockers: [],
          nextActions: [],
          waiting: [],
          gaps: [],
          changes: [],
          decisions: [],
        })}
        labels={labels}
      />,
    )
    expect(screen.getByText('Nothing is blocked.')).toBeInTheDocument()
    expect(screen.getByText('No ready work is holding anything up.')).toBeInTheDocument()
    expect(screen.getByText('Nothing is waiting on an external party.')).toBeInTheDocument()
    expect(screen.getByText('No gaps found.')).toBeInTheDocument()
  })

  it('lists a gap with its meaning, not a code', () => {
    render(<ControlRoomView matterId="m1" room={room()} labels={labels} />)
    const gaps = screen.getByRole('region', { name: 'Gaps' })
    expect(within(gaps).getByText(/No owner/)).toBeInTheDocument()
  })
})

describe('context forms', () => {
  it('creates a record with a stable key and the chosen links', async () => {
    actions.create.mockResolvedValue({ ok: true })
    render(
      <CreateContextForm matterId="m1" items={[{ id: 'a1', label: 'Action: Sign the SPA' }]} />,
    )
    fireEvent.change(screen.getByLabelText(/Kind/), { target: { value: 'RISK' } })
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'May slip' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /Sign the SPA/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add record' }))
    await waitFor(() => expect(actions.create).toHaveBeenCalled())
    expect(actions.create.mock.calls[0]![0]).toMatchObject({
      matterId: 'm1',
      kind: 'RISK',
      title: 'May slip',
      links: 'a1',
    })
    expect(actions.create.mock.calls[0]![0].idempotencyKey).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('closing needs a reason and sends the record ETag', async () => {
    actions.update.mockResolvedValue({ ok: true })
    render(<CloseContextForm matterId="m1" record={decision} />)
    fireEvent.click(screen.getByLabelText('Close this record…'))
    fireEvent.change(screen.getByLabelText(/Why is it closed/), { target: { value: 'decided' } })
    fireEvent.click(screen.getByRole('button', { name: 'Close record' }))
    await waitFor(() => expect(actions.update).toHaveBeenCalled())
    expect(actions.update.mock.calls[0]![0]).toMatchObject({
      action: 'close',
      ifMatch: '"d1"',
      reason: 'decided',
    })
  })
})

describe('causal explanation of a blocker (F05)', () => {
  const blocked = (
    reasons: { edgeId: string; sourceId: string; gate: string; code: string }[],
    upstream: { id: string; title: string; execution: string; verification: string | null }[],
  ) =>
    room({
      blockers: [{ ...row('b1', 'Wire the price', { dependency: 'BLOCKED' }), reasons, upstream }],
    })

  it('says why a COMPLETED prerequisite still holds the record: it is itself blocked', () => {
    render(
      <ControlRoomView
        matterId="m1"
        room={blocked(
          [{ edgeId: 'e1', sourceId: 'a1', gate: 'COMPLETION', code: 'UPSTREAM_BLOCKED' }],
          [{ id: 'a1', title: 'Sign the SPA', execution: 'COMPLETED', verification: null }],
        )}
        labels={labels}
      />,
    )
    const blockedSection = screen.getByRole('region', { name: 'Blocked' })
    expect(within(blockedSection).getByText(/Completion gate on/)).toBeInTheDocument()
    expect(within(blockedSection).getByText(/completed/)).toBeInTheDocument()
    expect(
      within(blockedSection).getByText(
        /is completed or ready, but is itself blocked by something earlier/,
      ),
    ).toBeInTheDocument()
    // the way to the cause: the link goes to the prerequisite, which shows its own blockers
    expect(
      within(blockedSection).getByRole('link', { name: 'Sign the SPA' }).getAttribute('href'),
    ).toContain('/work/a1')
  })

  it('keeps the proof gate apart from the completion gate', () => {
    render(
      <ControlRoomView
        matterId="m1"
        room={blocked(
          [
            { edgeId: 'e1', sourceId: 'a1', gate: 'PROOF', code: 'NOT_VERIFIED' },
            { edgeId: 'e2', sourceId: 'a2', gate: 'COMPLETION', code: 'CANCELLED' },
          ],
          [
            { id: 'a1', title: 'Sign the SPA', execution: 'COMPLETED', verification: 'UNVERIFIED' },
            { id: 'a2', title: 'Pay the fee', execution: 'CANCELLED', verification: null },
          ],
        )}
        labels={labels}
      />,
    )
    const section = screen.getByRole('region', { name: 'Blocked' })
    expect(within(section).getByText(/Proof gate on/)).toBeInTheDocument()
    expect(
      within(section).getByText(/completed but its proof is not satisfied/),
    ).toBeInTheDocument()
    expect(within(section).getByText(/cancellation does not satisfy a gate/)).toBeInTheDocument()
    expect(within(section).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3)
  })
})

describe('one snapshot (F04)', () => {
  it('labels come from the room itself, never from a later read of the same records', () => {
    const r = room({ titles: { z9: 'Linked at room time' } })
    const titles = roomTitles(r)
    expect(titles.z9).toBe('Linked at room time')
    expect(titles.a1).toBe('Sign the SPA')
    expect(titles.b1).toBe('Wire the price')
    // a record the room does not describe has no invented label
    expect(titles.unknown).toBeUndefined()
  })

  it('shows a closed context record from the same snapshot as the open ones', () => {
    const closed = {
      ...decision,
      id: 'd2',
      title: 'Old decision',
      status: 'CLOSED' as const,
      closedReason: 'decided',
    }
    const r = room({ records: [decision, closed] })
    expect(r.records.map((x) => x.status)).toEqual(['OPEN', 'CLOSED'])
    expect(roomTitles(r)).toBeDefined()
  })
})
