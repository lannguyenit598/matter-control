import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => 'UTC' }))

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  update: vi.fn(),
  transition: vi.fn(),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
  search: vi.fn(),
}))
vi.mock('../actions', () => ({
  updateWorkItemAction: actions.update,
  transitionExecutionAction: actions.transition,
  addDependencyAction: actions.addDependency,
  removeDependencyAction: actions.removeDependency,
  searchWorkItemsAction: actions.search,
  createActionAction: vi.fn(),
  escalateAction: vi.fn(),
  createWorkstreamAction: vi.fn(),
  createPartyAction: vi.fn(),
  updatePartyAction: vi.fn(),
  createMilestoneAction: vi.fn(),
  setMilestonePrerequisitesAction: vi.fn(),
}))

import { DependencyPanel } from './dependency-panel'
import { ExecutionPanel } from './execution-panel'
import { MilestoneList } from './planning-view'
import { RejectionDetails } from './rejection-details'
import { WorkFilters } from './work-filters'
import { WorkGrid } from './work-grid'
import { offeredTransitions } from '../labels'
import type { Derived, Detail, Envelope, MilestoneView, WorkItem } from '../schemas'

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
    ['IN_PROGRESS', 'VIEWER', []], // BF-09: a viewer is shown the reason, never a control the API will refuse
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

describe('WorkFilters (URL state)', () => {
  it('keeps advanced criteria out of the initial view and reveals them on request', () => {
    render(<WorkFilters basePath="/matters/m1/work" query={{}} workstreams={[]} members={[]} />)
    expect(screen.getByRole('searchbox', { name: 'Search title or outcome' })).toBeVisible()
    expect(screen.getByLabelText('Execution')).not.toBeVisible()
    fireEvent.click(screen.getByText('Advanced filters'))
    expect(screen.getByLabelText('Execution')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Execution'), { target: { value: 'WAITING' } })
    fireEvent.click(screen.getByText('Advanced filters'))
    expect(new FormData(screen.getByRole('search') as HTMLFormElement).get('execution')).toBe(
      'WAITING',
    )
  })

  it('removes one applied criterion without losing the others or display settings', () => {
    render(
      <WorkFilters
        basePath="/matters/m1/work"
        query={{
          q: 'SPA',
          owner: 'u1',
          execution: 'WAITING',
          sort: 'title',
          desc: 'true',
          cursor: 'old',
        }}
        density="compact"
        workstreams={[]}
        members={[{ userId: 'u1', displayName: 'Alice' }]}
      />,
    )
    const href = screen
      .getByRole('link', { name: 'Remove filter: Owner: Alice' })
      .getAttribute('href')!
    const url = new URL(href, 'http://localhost')
    expect(url.searchParams.has('owner')).toBe(false)
    expect(url.searchParams.has('cursor')).toBe(false)
    expect(url.searchParams.get('q')).toBe('SPA')
    expect(url.searchParams.get('execution')).toBe('WAITING')
    expect(url.searchParams.get('sort')).toBe('title')
    expect(url.searchParams.get('desc')).toBe('true')
    expect(url.searchParams.get('density')).toBe('compact')
    const cleared = new URL(
      screen.getByRole('link', { name: 'Clear filters' }).getAttribute('href')!,
      'http://localhost',
    )
    expect(cleared.searchParams.has('q')).toBe(false)
    expect(cleared.searchParams.has('owner')).toBe(false)
    expect(cleared.searchParams.has('execution')).toBe(false)
    expect(cleared.searchParams.get('sort')).toBe('title')
    expect(cleared.searchParams.get('density')).toBe('compact')
  })

  it('retains a selected member or workstream missing from current options without displaying raw IDs', () => {
    render(
      <WorkFilters
        basePath="/matters/m1/work"
        query={{ owner: 'unavailable-user', workstream: 'unavailable-stream' }}
        workstreams={[]}
        members={[]}
      />,
    )
    expect(screen.getByText('Owner: Selected member (unavailable)')).toBeVisible()
    expect(screen.getByText('Workstream: Selected workstream (unavailable)')).toBeVisible()
    const form = new FormData(screen.getByRole('search') as HTMLFormElement)
    expect(form.get('owner')).toBe('unavailable-user')
    expect(form.get('workstream')).toBe('unavailable-stream')
  })

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
    expect((form as HTMLFormElement).method).toBe('get')
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
    // BF-09: the emphasised step from IN_PROGRESS is completing the work, not waiting
    expect(screen.getByLabelText(/Change status to/)).toHaveValue('COMPLETED')
    expect(screen.queryByLabelText(/Waiting on/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Change status to/), { target: { value: 'WAITING' } })
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
    isFiling: false,
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
    actions.search.mockResolvedValue({ status: 'ok', options: [] })
    rerender(<DependencyPanel {...props} canEdit />)
    expect(screen.getByRole('button', { name: 'Add prerequisite' })).toBeInTheDocument()
  })

  // BF-04: the picker searches the whole matter, not the first page of 200 rows.
  it('finds and links a prerequisite that lies beyond the first 200 records', async () => {
    actions.search.mockImplementation(async ({ query }: { query: string }) => ({
      status: 'ok',
      options: query.includes('301')
        ? [{ value: 'r301', label: 'Action: Record 301' }]
        : [{ value: 'r1', label: 'Action: Record 1' }],
      truncated: !query,
    }))
    actions.addDependency.mockResolvedValue({ ok: true })
    render(<DependencyPanel {...props} canEdit />)
    fireEvent.change(screen.getByLabelText(/Search this matter/), {
      target: { value: 'Record 301' },
    })
    const radio = await screen.findByRole('radio', { name: 'Action: Record 301' })
    expect(actions.search).toHaveBeenCalledWith(
      expect.objectContaining({ matterId: 'm1', query: 'Record 301', excludeId: 't' }),
    )
    fireEvent.click(radio)
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'needs it' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add prerequisite' }))
    await waitFor(() => expect(actions.addDependency).toHaveBeenCalled())
    expect(actions.addDependency.mock.calls[0]![0]).toMatchObject({
      sourceId: 'r301',
      targetId: 't',
      matterId: 'm1',
    })
  })

  it('searching never submits the surrounding form', async () => {
    actions.search.mockResolvedValue({
      status: 'ok',
      options: [{ value: 'r1', label: 'Action: Record 1' }],
    })
    render(<DependencyPanel {...props} canEdit />)
    const box = screen.getByLabelText(/Search this matter/)
    fireEvent.change(box, { target: { value: 'Rec' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    await screen.findByRole('radio', { name: 'Action: Record 1' })
    expect(actions.addDependency).not.toHaveBeenCalled()
  })

  it('a refused cycle explains its path and sends the target etag', async () => {
    actions.addDependency.mockResolvedValue({
      ok: false,
      kind: 'rejected',
      error: 'That dependency would create a loop between records. Nothing was changed.',
      rejection: { code: 'cycle', message: '', alternatives: [], gates: [], path: ['u1', 't'] },
    })
    actions.search.mockResolvedValue({
      status: 'ok',
      options: [{ value: 'u1', label: 'Action: Done first' }],
    })
    render(<DependencyPanel {...props} canEdit />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Action: Done first' }))
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
