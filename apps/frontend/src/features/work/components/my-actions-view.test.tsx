import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { myWorkHref, selectMyWork } from '../my-work-selection'
import type { Assigned, Derived, Detail, MyActions, WorkItem } from '../schemas'

import { MyActionsView } from './my-actions-view'

const derived = (over: Partial<Derived> = {}): Derived => ({
  timing: 'ON_TRACK',
  noDueDate: true,
  attention: 'NORMAL',
  attentionReasons: [],
  criticalChain: false,
  ...over,
})

const workItem = (over: Partial<WorkItem>): WorkItem => ({
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
  dueAt: null,
  completedAt: null,
  cancelledAt: null,
  waitingPartyId: null,
  waitingCondition: null,
  escalation: null,
  revision: 1,
  ...over,
})

const assigned = (
  over: Partial<WorkItem>,
  cls: Assigned['class'],
  reason = 'assigned to you, ready to work',
  waitingOn: string | null = null,
  matterId = 'm1',
): Assigned => ({
  matterId,
  matterRevision: 3,
  class: cls,
  reason,
  waitingOn,
  item: workItem(over),
  derived: derived(),
  etag: '"e"',
})

const empty: MyActions = { next: [], waiting: [], blocked: [], historical: [] }
const ready = (...ids: string[]): Assigned[] =>
  ids.map((id) => assigned({ id, title: `Task ${id}` }, 'ELIGIBLE'))

describe('selectMyWork', () => {
  it('opens the first non-empty queue and the first item, in the server order', () => {
    const s = selectMyWork({ ...empty, waiting: ready('z', 'a') }, {})
    expect(s.queue).toBe('waiting')
    expect(s.selected?.item.id).toBe('z')
    expect(s.next?.item.id).toBe('a')
    expect(s.notice).toBeNull()
  })

  it('honours an explicitly chosen queue even when it is empty', () => {
    const s = selectMyWork({ ...empty, waiting: ready('w') }, { queue: 'ready' })
    expect(s.queue).toBe('ready')
    expect(s.selected).toBeNull()
  })

  it('selects by item id and offers at most three Up next entries', () => {
    const s = selectMyWork({ ...empty, next: ready('1', '2', '3', '4', '5', '6') }, { item: '2' })
    expect([s.index, s.previous?.item.id, s.next?.item.id]).toEqual([1, '1', '3'])
    expect(s.upNext.map((a) => a.item.id)).toEqual(['3', '4', '5'])
  })

  it('an item that moved to another queue is followed and says so', () => {
    const s = selectMyWork(
      { ...empty, blocked: ready('b'), next: ready('r') },
      { queue: 'ready', item: 'b' },
    )
    expect([s.queue, s.selected?.item.id, s.notice]).toEqual(['blocked', 'b', 'moved'])
  })

  it('an item that is in no queue any more clears the selection and says so', () => {
    const s = selectMyWork({ ...empty, next: ready('r') }, { queue: 'ready', item: 'gone' })
    expect(s.notice).toBe('gone')
    expect(s.selected?.item.id).toBe('r')
  })

  it('counts are the returned list lengths, not a total', () => {
    const both = ready('x')
    const s = selectMyWork({ ...empty, next: both, blocked: both }, {})
    expect(s.counts).toEqual({ ready: 1, waiting: 0, blocked: 1, history: 0 })
  })
})

describe('MyActionsView', () => {
  const view = (
    actions: MyActions,
    query = {},
    extra: Parameters<typeof MyActionsView>[0] | object = {},
  ) => render(<MyActionsView selection={selectMyWork(actions, query)} {...extra} />)

  it('nothing assigned: no invented recommendation, honest empty state', () => {
    view(empty)
    expect(screen.getByText('Nothing is assigned to you')).toBeInTheDocument()
    expect(screen.getByText(/Nothing is recommended in its place/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Matters' })).toHaveAttribute(
      'href',
      '/workspaces',
    )
  })

  it('only waiting or blocked work: says so, with the other queues one click away', () => {
    view(
      {
        ...empty,
        waiting: [
          assigned({ id: 'w', title: 'Await reply' }, 'WAITING', 'external', 'Buyer counsel'),
        ],
        blocked: [assigned({ id: 'b', title: 'Blocked one', dependency: 'BLOCKED' }, 'BLOCKED')],
      },
      { queue: 'ready' },
    )
    expect(
      screen.getByText(
        /No ready Action is assigned to you. Your assigned work is waiting or blocked/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Waiting \(1\)/ })).toHaveAttribute(
      'href',
      myWorkHref('waiting'),
    )
    expect(screen.getByRole('link', { name: /Blocked \(1\)/ })).toHaveAttribute(
      'href',
      myWorkHref('blocked'),
    )
  })

  it('shows one current item with its reason and a primary action that remembers queue and item', () => {
    view(
      { ...empty, next: ready('k1', 'k2', 'k3') },
      {},
      { matterNames: { m1: 'Acme acquisition' } },
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Task k1' })).toBeInTheDocument()
    expect(screen.getAllByText('Acme acquisition')).toHaveLength(3) // current + two Up next
    expect(screen.getByText('assigned to you, ready to work')).toBeInTheDocument()
    const open = screen.getByRole('link', { name: 'Open task' })
    const url = new URL(open.getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/matters/m1/work/k1')
    expect(url.searchParams.get('from')).toBe('/my-actions?queue=ready&item=k1')
    const up = within(screen.getByRole('complementary'))
    expect(up.getAllByRole('link').map((l) => l.textContent)).toEqual([
      expect.stringContaining('Task k2'),
      expect.stringContaining('Task k3'),
    ])
    expect(screen.getByText(/Ready 1 of 3/)).toBeInTheDocument()
  })

  it('the first item has a disabled Previous, not a dead link', () => {
    view({ ...empty, next: ready('k1', 'k2') })
    expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull()
    expect(screen.getByText('Previous').closest('[aria-disabled]')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      myWorkHref('ready', 'k2'),
    )
  })

  it('never shows an id in place of an unknown Matter name', () => {
    view({ ...empty, next: ready('k1') }, {}, { matterNames: {} })
    expect(screen.queryByText('m1')).toBeNull()
  })

  it('marks the open queue and shows exact list lengths', () => {
    view({ ...empty, next: ready('k1', 'k2'), historical: ready('h') }, { queue: 'history' })
    const nav = within(screen.getByRole('navigation', { name: 'Work queues' }))
    expect(nav.getByRole('link', { name: /History/ })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: /Ready/ })).toHaveTextContent('Ready2')
  })

  it('a blocked item names what it waits on, with links, not an unexplained badge', () => {
    const detail = {
      upstream: [
        {
          id: 'e1',
          gate: 'COMPLETION',
          satisfied: false,
          reason: 'NOT_COMPLETED',
          other: {
            id: 'u1',
            kind: 'ACTION',
            title: 'Get board approval',
            execution: 'IN_PROGRESS',
            dependency: 'READY',
          },
        },
        {
          id: 'e2',
          gate: 'COMPLETION',
          satisfied: true,
          reason: null,
          other: {
            id: 'u2',
            kind: 'ACTION',
            title: 'Already done',
            execution: 'COMPLETED',
            dependency: 'READY',
          },
        },
      ],
    } as unknown as Detail
    view(
      {
        ...empty,
        blocked: [
          assigned(
            { id: 'b', title: 'Sign SPA', dependency: 'BLOCKED' },
            'BLOCKED',
            'prerequisites not satisfied',
          ),
        ],
      },
      {},
      { detail },
    )
    expect(screen.getByText('Why this is blocked')).toBeInTheDocument()
    const cause = screen.getAllByRole('link', { name: 'Get board approval' })[0]!
    expect(new URL(cause.getAttribute('href')!, 'http://x').pathname).toBe('/matters/m1/work/u1')
    expect(screen.getByRole('link', { name: 'Open task' })).toBeInTheDocument()
    // a stable code is worded, never shown raw
    expect(screen.getByText(/the prerequisite is not completed/)).toBeInTheDocument()
    expect(screen.queryByText(/NOT_COMPLETED/)).toBeNull()
  })

  it('a detail that could not be read is stated, never guessed', () => {
    view(
      { ...empty, blocked: [assigned({ id: 'b', dependency: 'BLOCKED' }, 'BLOCKED')] },
      {},
      { detail: null },
    )
    expect(screen.getByText(/Prerequisite details could not be read/)).toBeInTheDocument()
  })

  it('a waiting item says who it waits on', () => {
    view({ ...empty, waiting: [assigned({ id: 'w' }, 'WAITING', 'external', 'Buyer counsel')] })
    expect(screen.getByText(/waiting on Buyer counsel/)).toBeInTheDocument()
  })

  it('a vanished selection is explained and the rest of the list stays usable', () => {
    view({ ...empty, next: ready('k1') }, { queue: 'ready', item: 'gone' })
    expect(screen.getByRole('status')).toHaveTextContent('no longer in your list')
    expect(screen.getByRole('heading', { level: 2, name: 'Task k1' })).toBeInTheDocument()
  })
})
