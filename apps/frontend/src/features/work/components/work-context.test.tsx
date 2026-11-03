import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { WorkItem } from '../schemas'

import { WorkContext, type ContextCriterion, type ContextReliedOn } from './work-context'

const item = (over: Partial<WorkItem> = {}): WorkItem => ({
  id: 'a1',
  kind: 'ACTION',
  matterId: 'm1',
  title: 'Draft SPA',
  outcome: 'First draft agreed',
  execution: 'NOT_STARTED',
  dependency: 'READY',
  dependencyReasons: [],
  proofRequired: true,
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

const criterion = (over: Partial<ContextCriterion>): ContextCriterion => ({
  id: 'c1',
  title: 'Signed SPA',
  purpose: 'PACKAGE',
  mandatory: true,
  satisfied: true,
  ...over,
})

const linkToItem = (id: string) => `/matters/m1/work/${id}?from=x`

describe('WorkContext', () => {
  it('composes outcome, criteria with purpose, and the exact version relied on', () => {
    const reliedOn: ContextReliedOn[] = [{ exact: 'SPA · v1 · spa.pdf', criterion: 'Signed SPA' }]
    render(
      <WorkContext
        item={item()}
        criteria={[criterion({})]}
        reliedOn={reliedOn}
        titles={{}}
        linkToItem={linkToItem}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Context' })).toBeInTheDocument()
    expect(screen.getByText('First draft agreed')).toBeInTheDocument()
    // The criterion title appears in the criteria list and again as the relied-on row's label.
    expect(screen.getAllByText('Signed SPA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Package readiness')).toBeInTheDocument()
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Satisfied')).toBeInTheDocument()
    // The exact recorded version, not a current-pointer guess.
    expect(screen.getByText('SPA · v1 · spa.pdf')).toBeInTheDocument()
  })

  it('says the criteria are unavailable instead of asserting absence when the proof read failed', () => {
    render(
      <WorkContext
        item={item()}
        criteria={null}
        reliedOn={[]}
        titles={{}}
        linkToItem={linkToItem}
      />,
    )
    expect(screen.getByText(/could not be read right now/)).toBeInTheDocument()
    expect(screen.queryByText(/No proof criteria are declared/)).not.toBeInTheDocument()
  })

  it('states the empty outcome and the honest no-criteria gap', () => {
    render(
      <WorkContext
        item={item({ outcome: '', proofRequired: false })}
        criteria={[]}
        reliedOn={[]}
        titles={{}}
        linkToItem={linkToItem}
      />,
    )
    expect(screen.getByText(/Nothing recorded yet/)).toBeInTheDocument()
    expect(screen.getByText(/No proof criteria are declared/)).toBeInTheDocument()
  })

  it('explains an unsatisfied criterion with the server reason and offers no evidence claim', () => {
    render(
      <WorkContext
        item={item()}
        criteria={[
          criterion({
            satisfied: false,
            reasonLabel: 'Offered, waiting for an independent verifier',
          }),
        ]}
        reliedOn={[]}
        titles={{}}
        linkToItem={linkToItem}
      />,
    )
    expect(screen.getByText('Offered, waiting for an independent verifier')).toBeInTheDocument()
    expect(screen.queryByText(/SPA · v1/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Evidence relied on/)).not.toBeInTheDocument()
  })

  it('links each upstream blocker with its gate and reason', () => {
    render(
      <WorkContext
        item={item({
          dependencyReasons: [
            { edgeId: 'g1', sourceId: 'r9', gate: 'COMPLETION', code: 'NOT_COMPLETED' },
          ],
        })}
        criteria={[]}
        reliedOn={[]}
        titles={{ r9: 'Board approval obtained' }}
        linkToItem={linkToItem}
      />,
    )
    const link = screen.getByRole('link', { name: 'Board approval obtained' })
    expect(link).toHaveAttribute('href', '/matters/m1/work/r9?from=x')
    expect(screen.getByText(/Completion gate/)).toBeInTheDocument()
    expect(screen.getByText(/the prerequisite is not completed/)).toBeInTheDocument()
  })
})
