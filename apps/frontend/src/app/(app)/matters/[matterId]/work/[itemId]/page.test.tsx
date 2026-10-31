import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// BF-02 (a filing keeps its checklist) and BF-09 (one primary operation, secondary behind disclosure).
const repos = vi.hoisted(() => ({
  session: vi.fn(),
  matter: vi.fn(),
  members: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  workstreams: vi.fn(),
  parties: vi.fn(),
  checklist: vi.fn(),
  documents: vi.fn(),
  document: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => 'UTC' }))
vi.mock('@/lib/auth', () => ({ getSession: repos.session }))
vi.mock('@/features/matters/repository', () => ({
  matterRepository: { get: repos.matter, members: repos.members },
}))
vi.mock('@/features/work/repository', () => ({
  workRepository: {
    get: repos.get,
    list: repos.list,
    workstreams: repos.workstreams,
    parties: repos.parties,
  },
}))
vi.mock('@/features/proof/repository', () => ({
  proofRepository: {
    checklist: repos.checklist,
    documents: repos.documents,
    document: repos.document,
  },
}))
vi.mock('@/features/work/actions', () => ({
  updateWorkItemAction: vi.fn(),
  transitionExecutionAction: vi.fn(),
  addDependencyAction: vi.fn(),
  removeDependencyAction: vi.fn(),
  escalateAction: vi.fn(),
  searchWorkItemsAction: vi.fn(),
}))
vi.mock('@/features/proof/actions', () => ({
  assessClaimAction: vi.fn(),
  createCriterionAction: vi.fn(),
  raiseDisputeAction: vi.fn(),
  resolveDisputeAction: vi.fn(),
  revokeAssessmentAction: vi.fn(),
  reviseCriterionAction: vi.fn(),
  setApplicabilityAction: vi.fn(),
  setVerifierAction: vi.fn(),
  submitEvidenceAction: vi.fn(),
  withdrawEvidenceAction: vi.fn(),
}))

import WorkItemPage from './page'

const item = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  kind: 'ACTION',
  matterId: 'm1',
  title: 'Merger filing',
  outcome: 'Clearance decision',
  execution: 'IN_PROGRESS',
  dependency: 'READY',
  dependencyReasons: [],
  proofRequired: false,
  verification: null,
  verificationApplicability: null,
  applicabilityReason: null,
  proofEpoch: 0,
  workstreamId: null,
  ownerId: 'u1',
  dueAt: null,
  completedAt: null,
  cancelledAt: null,
  waitingPartyId: null,
  waitingCondition: null,
  escalation: null,
  revision: 1,
  ...over,
})

const detail = (
  over: Record<string, unknown> = {},
  isFiling = false,
  outcomeVerification?: string,
) => ({
  detail: {
    item: item(over),
    derived: {
      timing: 'ON_TRACK',
      noDueDate: true,
      attention: 'NORMAL',
      attentionReasons: [],
      criticalChain: false,
    },
    etag: '"e1"',
    isFiling,
    outcomeVerification,
    upstream: [],
    downstream: [],
  },
  asOf: '2026-10-30T03:00:00Z',
})

const checklist = {
  checklist: {
    subject: {
      id: 'a1',
      kind: 'ACTION',
      title: 'Merger filing',
      execution: 'IN_PROGRESS',
      proofRequired: false,
      verification: null,
      verificationApplicability: null,
      applicabilityReason: null,
      proofEpoch: 0,
      revision: 1,
    },
    verification: '',
    package: { declared: true, total: 1, mandatory: 1, satisfied: 0, ready: false },
    outcome: { declared: false, total: 0, mandatory: 0, satisfied: 0, ready: false },
    criteria: [
      {
        id: 'c1',
        subjectId: 'a1',
        title: 'Signed filing form',
        description: '',
        mandatory: true,
        purpose: 'PACKAGE',
        versionRule: 'NONE',
        documentId: null,
        fixedVersionId: null,
        validDays: 0,
        retired: false,
        revision: 1,
        satisfied: false,
        reason: 'MISSING',
        etag: '"c"',
        claims: [],
      },
    ],
    evidence: [],
    verifiers: [],
    openDisputes: [],
    dependents: [],
    callerId: 'u1',
    asOf: '2026-10-30T03:00:00Z',
  },
}

async function renderPage(role = 'EDITOR') {
  repos.matter.mockResolvedValue({ matter: { title: 'Atlas', callerRole: role } })
  const tree = WorkItemPage({
    params: Promise.resolve({ matterId: 'm1', itemId: 'a1' }),
    searchParams: Promise.resolve({}),
  } as never)
  const inner = (
    tree as { props: { children: { type: (p: unknown) => Promise<unknown>; props: unknown } } }
  ).props.children
  render((await inner.type(inner.props)) as never)
}

beforeEach(() => {
  Object.values(repos).forEach((r) => r.mockReset())
  repos.session.mockResolvedValue({ userId: 'u1' })
  repos.members.mockResolvedValue({
    items: [{ userId: 'u1', displayName: 'Alice', status: 'ACTIVE', role: 'OWNER' }],
  })
  repos.list.mockResolvedValue({ page: { items: [] } })
  repos.workstreams.mockResolvedValue({ items: [] })
  repos.parties.mockResolvedValue({ items: [] })
  repos.documents.mockResolvedValue({ items: [] })
  repos.checklist.mockResolvedValue(checklist)
})

describe('Filing with no outcome verification (BF-02)', () => {
  it('still loads and shows its package checklist with the commands to satisfy it', async () => {
    repos.get.mockResolvedValue(detail({ proofRequired: false }, true))
    await renderPage('EDITOR')
    expect(repos.checklist).toHaveBeenCalledWith('m1', 'a1')
    expect(screen.getByText('Package and signature readiness')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add a criterion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Offer evidence' })).toBeInTheDocument()
  })

  it('does not load a checklist for an ordinary Action without proof', async () => {
    repos.get.mockResolvedValue(detail({ proofRequired: false }, false))
    await renderPage('EDITOR')
    expect(repos.checklist).not.toHaveBeenCalled()
  })

  it('a viewer reads the checklist but gets no mutation heading', async () => {
    repos.get.mockResolvedValue(detail({ proofRequired: false }, true))
    await renderPage('VIEWER')
    expect(screen.getAllByText('Signed filing form').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: 'Add a criterion' })).not.toBeInTheDocument()
  })
})

describe('Outcome verification beside a package-verified filing (BF-01)', () => {
  it('states the outcome is not verified when no outcome criterion is declared', async () => {
    repos.get.mockResolvedValue(
      detail({ proofRequired: true, verification: 'VERIFIED' }, true, 'NOT_DECLARED'),
    )
    await renderPage('EDITOR')
    expect(
      screen.getByText(/Outcome not verified: no outcome criterion is declared/),
    ).toBeInTheDocument()
  })
  it('shows nothing extra for an ordinary record', async () => {
    repos.get.mockResolvedValue(detail({}, false))
    await renderPage('EDITOR')
    expect(screen.queryByText(/Outcome not verified/)).not.toBeInTheDocument()
  })
})

describe('Work record lead (BF-09)', () => {
  it('leads with why now, the outcome and one stated next step', async () => {
    repos.get.mockResolvedValue(detail({ execution: 'IN_PROGRESS' }))
    await renderPage('EDITOR')
    expect(screen.getByRole('heading', { name: 'Why it matters now' })).toBeInTheDocument()
    expect(screen.getAllByText('Clearance decision').length).toBeGreaterThan(0)
    expect(screen.getByText(/Mark completed\./)).toBeInTheDocument()
    expect((screen.getByLabelText(/Change status to/) as HTMLSelectElement).value).toBe('COMPLETED')
  })

  it('keeps secondary controls behind disclosures that stay mounted, and opens prerequisites when blocked', async () => {
    repos.get.mockResolvedValue(
      detail({
        dependency: 'BLOCKED',
        dependencyReasons: [
          { edgeId: 'x', sourceId: 's', gate: 'COMPLETION', code: 'NOT_COMPLETED' },
        ],
      }),
    )
    await renderPage('OWNER')
    expect(document.getElementById('details')).not.toHaveAttribute('open')
    expect(document.getElementById('prerequisites')).toHaveAttribute('open')
    expect(document.getElementById('escalation')).toBeInTheDocument()
    // the metadata form is mounted (hidden by the closed disclosure), not removed
    expect(screen.getByRole('button', { name: /Save changes/ })).toBeInTheDocument()
  })

  it('shows a viewer the reason instead of an enabled status control', async () => {
    repos.get.mockResolvedValue(detail({ execution: 'IN_PROGRESS' }))
    await renderPage('VIEWER')
    expect(
      screen.getByText(/You can read this record but not change its status/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change status' })).not.toBeInTheDocument()
  })
})
