import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => 'UTC' }))

import { offeredTransitions, primaryTransition } from '../labels'
import type { Derived, WorkItem } from '../schemas'

import { WorkNow } from './work-now'

const item = (over: Partial<WorkItem> = {}): WorkItem => ({
  id: 'a1',
  kind: 'ACTION',
  matterId: 'm1',
  title: 'Draft SPA',
  outcome: 'First draft agreed',
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
const derived = (over: Partial<Derived> = {}): Derived => ({
  timing: 'ON_TRACK',
  noDueDate: true,
  attention: 'NORMAL',
  attentionReasons: [],
  criticalChain: false,
  ...over,
})

describe('primaryTransition', () => {
  it.each([
    ['NOT_STARTED', 'EDITOR', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'EDITOR', 'COMPLETED'],
    ['WAITING', 'EDITOR', 'IN_PROGRESS'],
    ['COMPLETED', 'OWNER', 'IN_PROGRESS'],
    ['COMPLETED', 'EDITOR', null],
    ['NOT_STARTED', 'VIEWER', null],
  ])('%s as %s offers %s', (from, role, expected) => {
    // A viewer never reaches the form (the page hides it), so only the editor/owner cases matter
    // for the offered list; the helper itself never invents a step the table does not offer.
    expect(primaryTransition(from, role)).toBe(expected)
    if (expected) expect(offeredTransitions(from, role)).toContain(expected)
  })
})

describe('WorkNow', () => {
  it('leads with why it matters, the outcome and one stated next step, keeping the form', () => {
    render(
      <WorkNow item={item({ execution: 'IN_PROGRESS' })} derived={derived()} role="EDITOR">
        <form aria-label="status form" />
      </WorkNow>,
    )
    expect(screen.getByRole('heading', { name: 'Why it matters now' })).toBeInTheDocument()
    expect(screen.getByText('First draft agreed')).toBeInTheDocument()
    expect(screen.getByText(/Mark completed\./)).toBeInTheDocument()
    expect(screen.getByText(/Completed is not verified/)).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'status form' })).toBeInTheDocument()
  })

  it('names the blocker and the party it waits on with their condition', () => {
    render(
      <WorkNow
        item={item({
          dependencyReasons: [{ gate: 'COMPLETION' }] as never,
          execution: 'WAITING',
          waitingCondition: 'signed copy',
        })}
        derived={derived({ attentionReasons: ['OVERDUE'] })}
        role="EDITOR"
        partyName="Registry"
      >
        <span />
      </WorkNow>,
    )
    expect(screen.getByText(/Blocked: 1 prerequisite/)).toBeInTheDocument()
    expect(screen.getByText(/Waiting on Registry: signed copy/)).toBeInTheDocument()
    expect(screen.getByText(/Needs attention: overdue/)).toBeInTheDocument()
  })

  it('states no step when none is offered; the status panel then gives the reason', () => {
    render(
      <WorkNow item={item({ execution: 'COMPLETED' })} derived={derived()} role="EDITOR">
        <p>panel reason</p>
      </WorkNow>,
    )
    expect(screen.getByRole('heading', { name: 'Next step' })).toBeInTheDocument()
    expect(screen.queryByText(/Mark completed/)).not.toBeInTheDocument()
    expect(screen.getByText('panel reason')).toBeInTheDocument()
  })
})
