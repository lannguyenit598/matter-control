import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  update: vi.fn(),
  transition: vi.fn(),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
}))
vi.mock('../actions', () => ({
  updateWorkItemAction: actions.update,
  transitionExecutionAction: actions.transition,
  addDependencyAction: actions.addDependency,
  removeDependencyAction: actions.removeDependency,
  createActionAction: vi.fn(),
  escalateAction: vi.fn(),
  createWorkstreamAction: vi.fn(),
  createPartyAction: vi.fn(),
  updatePartyAction: vi.fn(),
  createMilestoneAction: vi.fn(),
  setMilestonePrerequisitesAction: vi.fn(),
}))

import { MyActionsView } from './my-actions-view'
import { DependencyPanel } from './dependency-panel'
import { ExecutionPanel } from './execution-panel'
import { MilestoneList } from './planning-view'
import { RejectionDetails } from './rejection-details'
import { WorkFilters } from './work-filters'
import { WorkGrid } from './work-grid'
import { offeredTransitions } from '../labels'
import type { Assigned, Derived, Detail, Envelope, MilestoneView, WorkItem } from '../schemas'

const derived = (over: Partial<Derived> = {}): Derived => ({
  timing: 'ON_TRACK',
  noDueDate: true,
  attention: 'NORMAL',
  attentionReasons: [],
  criticalChain: false,
  ...over,
})

const item = (over: Partial<WorkItem> = {}): WorkItem => ({
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

const entry = (over: Partial<WorkItem> = {}, d: Partial<Derived> = {}): Envelope => ({
  item: item(over),
  derived: derived(d),
  etag: '"etag-1"',
})

beforeEach(() => {
  router.refresh.mockClear()
  for (const f of Object.values(actions)) f.mockReset()
  window.sessionStorage.clear()
})

describe('offeredTransitions mirrors the approved table', () => {
  it.each([
    ['NOT_STARTED', 'EDITOR', ['IN_PROGRESS', 'WAITING', 'COMPLETED']],
    ['NOT_STARTED', 'OWNER', ['IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED']],
    ['IN_PROGRESS', 'EDITOR', ['WAITING', 'COMPLETED']],
    ['WAITING', 'EDITOR', ['IN_PROGRESS', 'COMPLETED']],
    ['COMPLETED', 'EDITOR', []],
    ['COMPLETED', 'OWNER', ['IN_PROGRESS']],
    ['CANCELLED', 'OWNER', ['IN_PROGRESS']],
    ['IN_PROGRESS', 'VIEWER', ['WAITING', 'COMPLETED']], // the API still refuses a viewer; the page hides the panel
  ])('%s as %s', (from, role, expected) => expect(offeredTransitions(from, role)).toEqual(expected))

  it('never offers terminal -> NOT_STARTED or COMPLETED -> CANCELLED', () => {
    for (const role of ['OWNER', 'EDITOR']) {
      expect(offeredTransitions('COMPLETED', role)).not.toContain('NOT_STARTED')
      expect(offeredTransitions('COMPLETED', role)).not.toContain('CANCELLED')
      expect(offeredTransitions('CANCELLED', role)).not.toContain('COMPLETED')
    }
  })
})

describe('WorkGrid', () => {
  const members = [{ userId: 'u1', displayName: 'Alice Owner' }]
  const base = {
    matterId: 'm1',
    total: 3,
    canEdit: true,
    members,
    workstreams: [{ id: 'w1', name: 'Closing', revision: 1 }],
    here: '/matters/m1/work?execution=WAITING',
    density: 'comfortable' as const,
    nextHref: null,
    filtered: false,
  }

  it('shows each independent axis in its own column, with text not only colour', () => {
    const items = [
      entry(
        {
          title: 'Blocked thing',
          dependency: 'BLOCKED',
          execution: 'IN_PROGRESS',
          ownerId: 'u1',
          workstreamId: 'w1',
          dueAt: '2026-06-15T02:00:00Z',
        },
        {
          timing: 'OVERDUE',
          noDueDate: false,
          attention: 'CRITICAL',
          attentionReasons: ['CRITICAL_CHAIN'],
        },
      ),
      entry({ id: 'a2', title: 'Plain' }),
    ]
    render(<WorkGrid {...base} items={items} />)
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual([
      'Title',
      'Type',
      'Execution',
      'Verification',
      'Dependency',
      'Timing',
      'Attention',
      'Owner',
      'Due',
      'Workstream',
    ])
    const row = screen.getByText('Blocked thing').closest('tr')!
    expect(within(row).getByText('In progress')).toBeInTheDocument()
    expect(within(row).getByText('Blocked')).toBeInTheDocument()
    expect(within(row).getByText('Overdue')).toBeInTheDocument()
    expect(within(row).getByText('Critical')).toBeInTheDocument()
    expect(within(row).getByText('Alice Owner')).toBeInTheDocument()
    expect(within(row).getByText('Closing')).toBeInTheDocument()
    expect(within(row).getByText('2026-06-15 02:00 UTC')).toBeInTheDocument()
    const plain = screen.getByText('Plain').closest('tr')!
    expect(within(plain).getByText('No due date')).toBeInTheDocument() // never read as schedule health
    expect(within(plain).getByText('Unassigned')).toBeInTheDocument()
  })

  it('only the title is editable inline; derived axes have no editor', () => {
    render(<WorkGrid {...base} items={[entry({ title: 'Draft SPA' })]} />)
    expect(screen.getByRole('button', { name: 'Edit title of "Draft SPA"' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('viewers see no edit affordance', () => {
    render(<WorkGrid {...base} canEdit={false} items={[entry()]} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('inline save sends the row id and its etag; failure keeps the draft; success refreshes', async () => {
    actions.update
      .mockResolvedValueOnce({ ok: false, kind: 'stale', error: 'changed' })
      .mockResolvedValueOnce({ ok: true })
    render(<WorkGrid {...base} items={[entry({ title: 'Draft SPA' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit title of "Draft SPA"' }))
    const input = screen.getByRole('textbox', { name: 'title of "Draft SPA"' })
    fireEvent.change(input, { target: { value: 'Draft SPA v2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('alert')
    expect(actions.update).toHaveBeenCalledWith({
      matterId: 'm1',
      itemId: 'a1',
      ifMatch: '"etag-1"',
      title: 'Draft SPA v2',
    })
    expect(screen.getByRole('textbox', { name: 'title of "Draft SPA"' })).toHaveValue(
      'Draft SPA v2',
    ) // draft kept
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('an unknown inline outcome is never resent: only a re-read re-enables editing', async () => {
    actions.update.mockResolvedValue({
      ok: false,
      kind: 'outcome-unknown',
      error: 'unknown',
      requiresReread: true,
    })
    render(<WorkGrid {...base} items={[entry({ title: 'Draft SPA' })]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit title of "Draft SPA"' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(actions.update).toHaveBeenCalledTimes(1)
  })

  it('empty grid and empty filter result are different, honest states', () => {
    const { rerender } = render(<WorkGrid {...base} items={[]} total={0} />)
    expect(screen.getByText('No work items yet')).toBeInTheDocument()
    rerender(<WorkGrid {...base} items={[]} total={0} filtered />)
    expect(screen.getByText('No work items match these filters')).toBeInTheDocument()
  })

  it('open-details links carry the current grid URL as their origin', () => {
    render(<WorkGrid {...base} items={[entry({ title: 'Draft SPA' })]} />)
    const link = screen.getByRole('link', { name: 'Open details of Draft SPA' })
    const url = new URL(link.getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/matters/m1/work/a1')
    expect(url.searchParams.get('from')).toBe('/matters/m1/work?execution=WAITING')
  })

  it('compact density tightens cell padding and a next page link appears when there is one', () => {
    const { container } = render(
      <WorkGrid
        {...base}
        density="compact"
        nextHref="/matters/m1/work?cursor=abc"
        items={[entry()]}
      />,
    )
    expect(container.querySelector('td')?.className).toContain('py-1')
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/matters/m1/work?cursor=abc',
    )
  })
})

describe('WorkFilters (URL state in a plain GET form)', () => {
  it('reflects the current query and offers clear', () => {
    render(
      <WorkFilters
        basePath="/matters/m1/work"
        query={{ q: 'spa', execution: 'WAITING', owner: 'none' }}
        workstreams={[]}
        members={[{ userId: 'u1', displayName: 'Alice' }]}
      />,
    )
    const form = screen.getByRole('search', { name: 'Filter work items' })
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/matters/m1/work')
    expect(screen.getByLabelText('Search title or outcome')).toHaveValue('spa')
    expect(screen.getByLabelText('Execution')).toHaveValue('WAITING')
    expect(screen.getByLabelText('Owner')).toHaveValue('none')
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
      'href',
      '/matters/m1/work',
    )
  })
})

describe('RejectionDetails', () => {
  const titles = { s1: 'Obtain approval', s2: 'File with authority' }
  it('names the failed gates, distinguishing completion from proof', () => {
    render(
      <RejectionDetails
        titles={titles}
        rejection={{
          code: 'dependency-blocked',
          message: '',
          alternatives: [],
          gates: [
            { edgeId: 'e1', sourceId: 's1', gate: 'COMPLETION', code: 'NOT_COMPLETED' },
            { edgeId: 'e2', sourceId: 's2', gate: 'PROOF', code: 'NOT_VERIFIED' },
          ],
          path: [],
        }}
      />,
    )
    expect(
      screen.getByText(/Completion gate on “Obtain approval”: the prerequisite is not completed/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Proof gate on “File with authority”: .*not verified/),
    ).toBeInTheDocument()
  })
  it('explains a refused loop by its path and lists allowed alternatives', () => {
    render(
      <RejectionDetails
        titles={titles}
        rejection={{
          code: 'cycle',
          message: '',
          alternatives: ['IN_PROGRESS', 'WAITING'],
          gates: [],
          path: ['s1', 's2'],
        }}
      />,
    )
    expect(
      screen.getByText(/“Obtain approval” → “File with authority” → back to “Obtain approval”/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Allowed from here: in progress, waiting/)).toBeInTheDocument()
  })
  it('an unknown record id is shown as a short id, never as invented text', () => {
    render(
      <RejectionDetails
        titles={{}}
        rejection={{
          code: 'x',
          message: '',
          alternatives: [],
          gates: [
            { edgeId: 'e', sourceId: '0123456789abcdef', gate: 'COMPLETION', code: 'CANCELLED' },
          ],
          path: [],
        }}
      />,
    )
    expect(screen.getByText(/record 01234567/)).toBeInTheDocument()
  })
})

describe('ExecutionPanel', () => {
  const parties = [
    { id: 'p1', name: 'Buyer counsel', kind: '', contact: '', notes: '', revision: 1, etag: '"p"' },
  ]

  it('offers only what the role may do and says why when nothing is offered', () => {
    const { rerender } = render(
      <ExecutionPanel
        matterId="m1"
        entry={entry({ execution: 'COMPLETED' })}
        role="EDITOR"
        parties={[]}
        titles={{}}
      />,
    )
    expect(
      screen.getByText(/Reopening a finished record is limited to matter owners/),
    ).toBeInTheDocument()
    rerender(
      <ExecutionPanel
        matterId="m1"
        entry={entry({ execution: 'COMPLETED' })}
        role="OWNER"
        parties={[]}
        titles={{}}
      />,
    )
    expect(screen.getByLabelText(/Change status to/)).toHaveDisplayValue(/Start \/ resume work/)
  })

  it('WAITING asks for a party and a condition; the reason is required to cancel', () => {
    render(
      <ExecutionPanel
        matterId="m1"
        entry={entry({ execution: 'IN_PROGRESS' })}
        role="OWNER"
        parties={parties}
        titles={{}}
      />,
    )
    // the first offered step from IN_PROGRESS is WAITING, so its fields are present immediately
    expect(screen.getByLabelText(/Waiting on \(external party\)/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Condition to resume/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'COMPLETED' } })
    expect(screen.queryByLabelText(/Waiting on/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'WAITING' } })
    expect(screen.getByLabelText(/Waiting on \(external party\)/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'CANCELLED' } })
    expect(screen.getByLabelText(/Reason \(required\)/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'COMPLETED' } })
    expect(screen.getByLabelText(/Reason \(optional\)/)).toBeInTheDocument()
  })

  it('completing untouched work asks when it was actually done', () => {
    render(
      <ExecutionPanel
        matterId="m1"
        entry={entry({ execution: 'NOT_STARTED' })}
        role="EDITOR"
        parties={[]}
        titles={{}}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'COMPLETED' } })
    expect(screen.getByLabelText(/Completed at/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Reason \(required\)/)).toBeInTheDocument()
  })

  it('sends the record id, its etag and the chosen change; a rejection shows the failed gate and nothing else changes', async () => {
    actions.transition.mockResolvedValue({
      ok: false,
      kind: 'rejected',
      error: 'This cannot proceed yet: prerequisites are not satisfied. Nothing was changed.',
      rejection: {
        code: 'dependency-blocked',
        message: '',
        alternatives: [],
        path: [],
        gates: [{ edgeId: 'e1', sourceId: 's1', gate: 'PROOF', code: 'NOT_VERIFIED' }],
      },
    })
    render(
      <ExecutionPanel
        matterId="m1"
        entry={entry({ execution: 'IN_PROGRESS' })}
        role="EDITOR"
        parties={[]}
        titles={{ s1: 'Obtain approval' }}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'COMPLETED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change status' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Nothing was changed')
    expect(alert).toHaveTextContent(/Proof gate on “Obtain approval”/)
    expect(actions.transition).toHaveBeenCalledWith(
      expect.objectContaining({
        matterId: 'm1',
        itemId: 'a1',
        ifMatch: '"etag-1"',
        to: 'COMPLETED',
      }),
    )
    expect(actions.transition).toHaveBeenCalledTimes(1)
  })
})

describe('DependencyPanel', () => {
  const detail: Detail = {
    ...entry({ id: 't', title: 'Target', dependency: 'BLOCKED' }),
    upstream: [
      {
        id: 'e1',
        gate: 'COMPLETION',
        satisfied: true,
        reason: null,
        other: {
          id: 'u1',
          kind: 'ACTION',
          title: 'Done first',
          execution: 'COMPLETED',
          dependency: 'READY',
        },
      },
      {
        id: 'e2',
        gate: 'PROOF',
        satisfied: false,
        reason: 'NOT_VERIFIED',
        other: {
          id: 'u2',
          kind: 'REQUIREMENT',
          title: 'Needs proof',
          execution: 'COMPLETED',
          dependency: 'READY',
        },
      },
    ],
    downstream: [
      {
        id: 'e3',
        gate: 'COMPLETION',
        satisfied: false,
        reason: 'NOT_COMPLETED',
        other: {
          id: 'd1',
          kind: 'ACTION',
          title: 'Waits on target',
          execution: 'NOT_STARTED',
          dependency: 'BLOCKED',
        },
      },
    ],
  }
  const props = {
    matterId: 'm1',
    detail,
    here: '/matters/m1/work/t',
    candidates: [
      { id: 'u1', title: 'Action: Done first' },
      { id: 't', title: 'Action: Target' },
    ],
    titles: { u1: 'Done first', u2: 'Needs proof', t: 'Target' },
  }

  it('shows each gate with its kind and whether it is satisfied now, completion apart from proof', () => {
    render(<DependencyPanel {...props} canEdit={false} />)
    const up = screen.getByRole('heading', { name: 'Prerequisites (2)' }).closest('section')!
    expect(within(up).getByText('Done first').closest('li')).toHaveTextContent('Satisfied')
    const proof = within(up).getByText('Needs proof').closest('li')!
    expect(proof).toHaveTextContent('Proof gate')
    expect(proof).toHaveTextContent(/Not satisfied: the prerequisite is completed but not verified/)
    expect(screen.getByRole('heading', { name: 'Blocks (1)' })).toBeInTheDocument()
  })

  it('related records open with this page as their origin (causal navigation)', () => {
    render(<DependencyPanel {...props} canEdit={false} />)
    const url = new URL(
      screen.getByRole('link', { name: 'Needs proof' }).getAttribute('href')!,
      'http://x',
    )
    expect(url.pathname).toBe('/matters/m1/work/u2')
    expect(url.searchParams.get('from')).toBe('/matters/m1/work/t')
  })

  it('viewers get no add or remove controls; editors cannot pick the record itself as a prerequisite', () => {
    const { rerender } = render(<DependencyPanel {...props} canEdit={false} />)
    expect(screen.queryByRole('button', { name: 'Add prerequisite' })).toBeNull()
    expect(screen.queryByText(/Remove this prerequisite/)).toBeNull()
    rerender(<DependencyPanel {...props} canEdit />)
    const options = within(screen.getByLabelText(/Must be satisfied first/))
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(options).toEqual(['Choose a record', 'Action: Done first'])
  })

  it('a refused cycle explains its path and sends the target etag', async () => {
    actions.addDependency.mockResolvedValue({
      ok: false,
      kind: 'rejected',
      error: 'That dependency would create a loop between records. Nothing was changed.',
      rejection: { code: 'cycle', message: '', alternatives: [], gates: [], path: ['u1', 't'] },
    })
    render(<DependencyPanel {...props} canEdit />)
    fireEvent.change(screen.getByLabelText(/Must be satisfied first/), { target: { value: 'u1' } })
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'order of work' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add prerequisite' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Nothing was changed')
    expect(alert).toHaveTextContent(/“Done first” → “Target”/)
    expect(actions.addDependency).toHaveBeenCalledWith({
      matterId: 'm1',
      targetId: 't',
      ifMatch: '"etag-1"',
      sourceId: 'u1',
      gate: 'COMPLETION',
      reason: 'order of work',
    })
  })
})

describe('MyActionsView', () => {
  const assigned = (
    over: Partial<WorkItem>,
    cls: Assigned['class'],
    reason = 'r',
    waitingOn: string | null = null,
  ): Assigned => ({
    matterId: 'm1',
    matterRevision: 3,
    class: cls,
    reason,
    waitingOn,
    item: item(over),
    derived: derived(),
    etag: '"e"',
  })
  const empty = { next: [], waiting: [], blocked: [], historical: [] }

  it('nothing assigned: no invented recommendation', () => {
    render(<MyActionsView actions={empty} />)
    expect(screen.getByText('Nothing is assigned to you')).toBeInTheDocument()
    expect(screen.getByText(/Nothing is recommended in its place/)).toBeInTheDocument()
  })

  it('all assigned work is waiting or blocked: explains the cause instead of recommending', () => {
    render(
      <MyActionsView
        actions={{
          ...empty,
          waiting: [
            assigned(
              { id: 'w', title: 'Await reply', execution: 'WAITING' },
              'WAITING',
              'waiting on an external condition',
              'Buyer counsel',
            ),
          ],
          blocked: [assigned({ id: 'b', title: 'Blocked one', dependency: 'BLOCKED' }, 'BLOCKED')],
        }}
      />,
    )
    expect(
      screen.getByText(
        /No ready Action is assigned to you. Your assigned work is waiting or blocked/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/waiting on Buyer counsel/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Waiting on others (1)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Blocked (1)' })).toBeInTheDocument()
  })

  it('lists next actions in the given order, each with its reason and a link that remembers My Actions as origin', () => {
    render(
      <MyActionsView
        actions={{
          ...empty,
          next: [
            assigned({ id: 'k1', title: 'K1' }, 'ELIGIBLE', 'assigned to you, ready to work'),
            assigned({ id: 'k2', title: 'K2' }, 'ELIGIBLE', 'assigned to you, ready to work'),
          ],
        }}
      />,
    )
    const list = screen
      .getByRole('heading', { name: 'Next actions (2)' })
      .closest('div')!.parentElement!
    const titles = within(list)
      .getAllByRole('link')
      .map((l) => l.textContent)
    expect(titles).toEqual(['K1', 'K2'])
    expect(within(list).getAllByText('assigned to you, ready to work')).toHaveLength(2)
    expect(
      new URL(
        screen.getByRole('link', { name: 'K1' }).getAttribute('href')!,
        'http://x',
      ).searchParams.get('from'),
    ).toBe('/my-actions')
  })
})

describe('MilestoneList', () => {
  const view = (over: Partial<MilestoneView['status']>, critical = false): MilestoneView => ({
    etag: '"m"',
    milestone: {
      id: 'ms1',
      name: 'Signing',
      dueAt: null,
      critical,
      prerequisites: ['r1', 'r2'],
      revision: 1,
    },
    status: {
      state: 'NOT_READY',
      satisfied: 1,
      total: 2,
      unsatisfied: [{ itemId: 'r2', reasons: ['PROOF_NOT_VERIFIED'] }],
      ...over,
    },
  })
  const props = {
    matterId: 'm1',
    titles: { r1: 'R1', r2: 'Second requirement' },
    requirements: [
      { id: 'r1', title: 'R1' },
      { id: 'r2', title: 'Second requirement' },
    ],
    isOwner: false,
  }

  it('shows counts and the reason, never a percentage', () => {
    render(<MilestoneList {...props} milestones={[view({})]} />)
    expect(screen.getByText('1 of 2 required Requirements satisfied')).toBeInTheDocument()
    expect(screen.getByText('Not ready')).toBeInTheDocument()
    expect(screen.getByText('Second requirement').closest('li')).toHaveTextContent(
      'proof not verified',
    )
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('a milestone with no prerequisites is unassessed, not ready', () => {
    render(
      <MilestoneList
        {...props}
        milestones={[view({ state: 'UNASSESSED', satisfied: 0, total: 0, unsatisfied: [] })]}
      />,
    )
    expect(screen.getByText('Not assessed: no prerequisites declared')).toBeInTheDocument()
    expect(screen.queryByText('Ready')).toBeNull()
  })

  it('a cancelled prerequisite shows as cancelled, never as satisfied', () => {
    render(
      <MilestoneList
        {...props}
        milestones={[view({ unsatisfied: [{ itemId: 'r2', reasons: ['CANCELLED'] }] })]}
      />,
    )
    expect(screen.getByText('Second requirement').closest('li')).toHaveTextContent('cancelled')
  })

  it('milestone settings are owner-only in the UI (the API enforces it regardless)', () => {
    const { rerender } = render(<MilestoneList {...props} milestones={[view({})]} />)
    expect(screen.getByText(/limited to matter owners/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add milestone' })).toBeNull()
    rerender(<MilestoneList {...props} isOwner milestones={[view({}, true)]} />)
    expect(screen.getByRole('button', { name: 'Add milestone' })).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})
