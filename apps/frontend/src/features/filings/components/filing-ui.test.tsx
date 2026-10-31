import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  advance: vi.fn(),
  owner: vi.fn(),
  signatures: vi.fn(),
  create: vi.fn(),
}))
vi.mock('../actions', () => ({
  advanceFilingAction: actions.advance,
  filingOwnerStepAction: actions.owner,
  createFilingAction: actions.create,
  recordNegativeAction: vi.fn(),
  correctObservationAction: vi.fn(),
  setSignatureApplicabilityAction: actions.signatures,
}))

import type { FilingDetail } from '../schemas'

import {
  AdvanceForm,
  CreateFilingForm,
  OwnerStepForm,
  SignatureApplicabilityForm,
} from './filing-forms'
import { FilingView } from './filing-view'

const detail = (over: Partial<FilingDetail> = {}): FilingDetail => ({
  item: {
    id: 'f1',
    title: 'Merger filing',
    outcome: 'Clearance',
    execution: 'IN_PROGRESS',
    proofRequired: false,
    verification: null,
    proofEpoch: 0,
    ownerId: 'u1',
    waitingPartyId: null,
    waitingCondition: null,
    completedAt: null,
    revision: 4,
  },
  derived: { timing: 'ON_TRACK', attention: 'NORMAL', attentionReasons: [] },
  etag: '"filing-4"',
  filing: {
    requirementId: 'r1',
    authorityPartyId: 'p1',
    stage: 'SIGNATURE',
    negativeOpen: false,
    currentCycle: 1,
    signatureNotRequired: false,
  },
  cycles: [
    {
      id: 'c1',
      no: 1,
      openedInEpoch: 0,
      requestRef: '',
      ownerId: 'u1',
      dueAt: null,
      openedAt: '2026-10-27T00:00:00Z',
      submittedAt: null,
      submissionId: null,
    },
  ],
  submissions: [],
  observations: [],
  next: ['SUBMISSION'],
  asOf: '2026-10-27T01:00:00Z',
  ...over,
})

const labels = { users: { u1: 'Alice' }, versions: { v1: 'SPA · v1 · spa.pdf' }, evidence: {} }

beforeEach(() => {
  router.refresh.mockClear()
  actions.advance.mockReset()
  actions.owner.mockReset()
  actions.signatures.mockReset()
  window.sessionStorage.clear()
})

describe('Filing creation path', () => {
  it.each([
    [false, false],
    [false, true],
    [true, false],
  ])(
    'explains missing prerequisites instead of presenting unusable selectors (%s/%s)',
    (hasRequirement, hasAuthority) => {
      render(
        <CreateFilingForm
          matterId="m1"
          requirements={hasRequirement ? [{ id: 'r1', label: 'Board approval obtained' }] : []}
          searchRecords={vi.fn()}
          parties={hasAuthority ? [{ id: 'p1', label: 'Registry' }] : []}
          members={[]}
        />,
      )
      expect(screen.queryByRole('button', { name: 'Create filing' })).not.toBeInTheDocument()
      if (!hasRequirement)
        expect(
          screen.getByRole('link', { name: /choose Add work and Requirement/ }),
        ).toHaveAttribute('href', '/matters/m1/work')
      if (!hasAuthority)
        expect(
          screen.getByRole('link', { name: 'Add an authority under Planning' }),
        ).toHaveAttribute('href', '/matters/m1/planning')
    },
  )
  it('continues confirmed creation on the filing detail', async () => {
    actions.create.mockResolvedValue({ ok: true, id: 'f-new' })
    render(
      <CreateFilingForm
        matterId="m1"
        requirements={[{ id: 'r1', label: 'Board approval obtained' }]}
        searchRecords={vi.fn().mockResolvedValue({ status: 'ok', options: [] })}
        parties={[{ id: 'p1', label: 'Registry' }]}
        members={[]}
      />,
    )
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Register transaction' } })
    fireEvent.change(screen.getByLabelText(/^Outcome sought/), {
      target: { value: 'Registration received' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create filing' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/matters/m1/filings/f-new'))
  })
})

describe('Filing creation: Requirement search and the no-outcome-proof label', () => {
  it('finds a Requirement beyond the first page and sends its id (BF-04)', async () => {
    actions.create.mockResolvedValue({ ok: true, id: 'f-new' })
    const search = vi.fn().mockImplementation(async ({ query }: { query: string }) => ({
      status: 'ok',
      options: query ? [{ value: 'r301', label: 'Requirement 301' }] : [],
      truncated: false,
    }))
    render(
      <CreateFilingForm
        matterId="m1"
        requirements={[{ id: 'r1', label: 'Requirement 1' }]}
        searchRecords={search}
        parties={[{ id: 'p1', label: 'Registry' }]}
        members={[]}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Search this matter’s Requirements/), {
      target: { value: '301' },
    })
    fireEvent.click(await screen.findByRole('radio', { name: 'Requirement 301' }))
    expect(search).toHaveBeenCalledWith({ matterId: 'm1', query: '301', kind: 'REQUIREMENT' })
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Register' } })
    fireEvent.change(screen.getByLabelText(/^Outcome sought/), { target: { value: 'Registered' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create filing' }))
    await waitFor(() => expect(actions.create).toHaveBeenCalled())
    expect(actions.create.mock.calls[0]![0]).toMatchObject({ requirementId: 'r301' })
  })

  it('says the proof choice is about the outcome only, never the package (BF-02)', () => {
    render(
      <CreateFilingForm
        matterId="m1"
        requirements={[{ id: 'r1', label: 'R' }]}
        searchRecords={vi.fn().mockResolvedValue({ status: 'ok', options: [] })}
        parties={[{ id: 'p1', label: 'Registry' }]}
        members={[]}
      />,
    )
    expect(screen.getByText(/package and signature checks apply either way/i)).toBeInTheDocument()
    const choice = screen.getByLabelText(/Independent verification of the authority/)
    expect(
      within(choice)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([
      'Yes: a verifier must also accept the authority’s outcome',
      'No: the outcome is recorded as evidence only, with no verification state',
    ])
  })
})

describe('FilingView', () => {
  it('shows the outcome verification apart from the verification state (BF-01)', () => {
    render(
      <FilingView
        detail={detail({ outcomeVerification: 'NOT_DECLARED' })}
        labels={{ users: {}, versions: {}, evidence: {} }}
      />,
    )
    expect(
      screen.getByText(/Outcome not verified: no outcome criterion is declared/),
    ).toBeInTheDocument()
  })

  it('announces the current stage and shows each cycle with its own exact versions', () => {
    const d = detail({
      filing: {
        requirementId: 'r1',
        authorityPartyId: 'p1',
        stage: 'AUTHORITY_REVIEW',
        negativeOpen: false,
        currentCycle: 2,
        signatureNotRequired: false,
      },
      cycles: [
        {
          id: 'c1',
          no: 1,
          openedInEpoch: 0,
          requestRef: '',
          ownerId: 'u1',
          dueAt: null,
          openedAt: 'a',
          submittedAt: 'b',
          submissionId: 's1',
        },
        {
          id: 'c2',
          no: 2,
          openedInEpoch: 0,
          requestRef: 'REQ-1',
          ownerId: 'u1',
          dueAt: null,
          openedAt: 'c',
          submittedAt: 'd',
          submissionId: 's2',
        },
      ],
      submissions: [
        {
          id: 's1',
          cycleNo: 1,
          reference: 'SUB-1',
          submittedAt: '2026-10-01T00:00:00Z',
          versionIds: ['v1'],
          externalRefs: [],
          recordedBy: 'u1',
          recordedAt: 'x',
        },
        {
          id: 's2',
          cycleNo: 2,
          reference: 'RESP-2',
          submittedAt: '2026-10-02T00:00:00Z',
          versionIds: ['v2'],
          externalRefs: [],
          recordedBy: 'u1',
          recordedAt: 'y',
        },
      ],
    })
    render(<FilingView detail={d} labels={labels} />)
    const stages = screen.getByRole('list', { name: 'Filing stages' })
    expect(
      within(stages)
        .getByText(/Authority review/)
        .closest('li'),
    ).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Initial filing')).toBeInTheDocument()
    expect(screen.getByText(/Supplement cycle 1/)).toBeInTheDocument()
    expect(screen.getByText('SPA · v1 · spa.pdf')).toBeInTheDocument()
    expect(screen.getByText(/version v2/)).toBeInTheDocument()
    expect(screen.getByText(/Authority request REQ-1/)).toBeInTheDocument()
  })

  it('says that a rejection stands and blocks approval', () => {
    const d = detail({
      filing: {
        requirementId: 'r1',
        authorityPartyId: 'p1',
        stage: 'RECEIPT',
        negativeOutcome: 'REJECTED',
        negativeOpen: true,
        currentCycle: 1,
        signatureNotRequired: false,
      },
    })
    render(<FilingView detail={d} labels={labels} />)
    expect(screen.getByRole('status')).toHaveTextContent(/rejected is recorded/)
  })

  it('shows a correction beside the original, not instead of it', () => {
    const base = {
      from: 'SUBMISSION',
      to: 'SUBMISSION',
      evidenceIds: [],
      actor: 'u1',
      recordedAt: 'r',
      cycleNo: 1,
      proofEpoch: 0,
      observedAt: 'o',
    }
    const d = detail({
      observations: [
        {
          ...base,
          id: 'o1',
          seq: 1,
          kind: 'STAGE',
          reference: 'SUB-1',
          reason: '',
          correctsId: null,
        },
        {
          ...base,
          id: 'o2',
          seq: 2,
          kind: 'CORRECTION',
          reference: 'SUB-1b',
          reason: 'typo',
          correctsId: 'o1',
        },
      ],
    })
    render(<FilingView detail={d} labels={labels} />)
    expect(screen.getByText('Reference SUB-1')).toBeInTheDocument()
    expect(screen.getByText(/reference is now SUB-1b/)).toBeInTheDocument()
  })
})

describe('AdvanceForm', () => {
  const versions = [{ id: 'v1', label: 'SPA · v1 · spa.pdf' }]

  it('asks for exactly the facts of the chosen stage and sends the filing ETag', async () => {
    actions.advance.mockResolvedValue({ ok: true })
    render(
      <AdvanceForm
        matterId="m1"
        detail={detail()}
        versions={versions}
        evidence={[]}
        members={[]}
      />,
    )
    expect(screen.getByLabelText(/Submission reference/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /spa.pdf/ })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Submission reference/), { target: { value: 'SUB-1' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /spa.pdf/ }))
    fireEvent.click(screen.getByRole('button', { name: /Record submission/ }))
    await waitFor(() => expect(actions.advance).toHaveBeenCalled())
    expect(actions.advance.mock.calls[0]![0]).toMatchObject({
      matterId: 'm1',
      filingId: 'f1',
      ifMatch: '"filing-4"',
      to: 'SUBMISSION',
      reference: 'SUB-1',
      versionIds: 'v1',
    })
  })

  it('offers supplement details only for a supplement', () => {
    const d = detail({
      filing: {
        requirementId: 'r1',
        authorityPartyId: 'p1',
        stage: 'AUTHORITY_REVIEW',
        negativeOpen: false,
        currentCycle: 1,
        signatureNotRequired: false,
      },
      next: ['SUPPLEMENT', 'APPROVAL'],
    })
    render(
      <AdvanceForm
        matterId="m1"
        detail={d}
        versions={versions}
        evidence={[]}
        members={[{ id: 'u1', label: 'Alice' }]}
      />,
    )
    expect(screen.getByLabelText(/Authority request reference/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Move to/), { target: { value: 'APPROVAL' } })
    expect(screen.queryByLabelText(/Authority request reference/)).toBeNull()
    expect(screen.getByText(/Authority outcome evidence/)).toBeInTheDocument()
  })

  it('shows the domain’s own reason when the guard refuses, and nothing is assumed saved', async () => {
    actions.advance.mockResolvedValue({
      ok: false,
      kind: 'rejected',
      error: 'The change was refused. Nothing was changed.',
      rejection: {
        code: 'guard-failed',
        message: 'package criteria are not satisfied: Signed form (MISSING)',
        alternatives: [],
        gates: [],
        path: [],
      },
    })
    render(
      <AdvanceForm
        matterId="m1"
        detail={detail()}
        versions={versions}
        evidence={[]}
        members={[]}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Submission reference/), { target: { value: 'SUB-1' } })
    fireEvent.click(screen.getByRole('button', { name: /Record submission/ }))
    expect(await screen.findByText(/Nothing was changed/)).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()
  })
})

describe('OwnerStepForm', () => {
  it('needs a reason before reopening and sends the ETag', async () => {
    actions.owner.mockResolvedValue({ ok: true })
    render(<OwnerStepForm matterId="m1" detail={detail()} step="reopening" />)
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'appeal granted' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reopen this filing' }))
    await waitFor(() => expect(actions.owner).toHaveBeenCalled())
    expect(actions.owner.mock.calls[0]![0]).toMatchObject({
      step: 'reopening',
      ifMatch: '"filing-4"',
      reason: 'appeal granted',
    })
  })
})

describe('signature applicability (F03)', () => {
  const waived = (over: Partial<FilingDetail['filing']> = {}) =>
    detail({
      filing: {
        requirementId: 'r1',
        authorityPartyId: 'p1',
        stage: 'SIGNATURE',
        negativeOpen: false,
        currentCycle: 1,
        signatureNotRequired: true,
        signatureNotRequiredReason: 'informational filing',
        signatureNotRequiredBy: 'u1',
        signatureNotRequiredAt: '2026-10-27T02:00:00Z',
        ...over,
      },
    })

  it('says the guard applies until an owner decides otherwise', () => {
    render(<FilingView detail={detail()} labels={labels} />)
    expect(
      screen.getByText(/needs an observed signature on a submitted version/),
    ).toBeInTheDocument()
  })

  it('shows the retained decision with its reason, decider and time', () => {
    render(<FilingView detail={waived()} labels={labels} />)
    expect(screen.getByText(/Recorded as not required by Alice/)).toBeInTheDocument()
    expect(screen.getByText(/informational filing/)).toBeInTheDocument()
  })

  it('sends the decision with the filing ETag it read, and requires a reason', async () => {
    actions.signatures.mockResolvedValue({ ok: true })
    render(<SignatureApplicabilityForm matterId="m1" detail={detail()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record that no signatures apply' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Record that no/ })).toBeEnabled(),
    )
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'authority needs none' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record that no signatures apply' }))
    await waitFor(() => expect(actions.signatures).toHaveBeenCalled())
    expect(actions.signatures).toHaveBeenLastCalledWith({
      matterId: 'm1',
      filingId: 'f1',
      ifMatch: detail().etag,
      signatureNotRequired: 'yes',
      reason: 'authority needs none',
    })
  })

  it('offers to withdraw an existing decision', async () => {
    actions.signatures.mockResolvedValue({ ok: true })
    render(<SignatureApplicabilityForm matterId="m1" detail={waived()} />)
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'authority changed its mind' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Require signatures again' }))
    await waitFor(() => expect(actions.signatures).toHaveBeenCalled())
    expect(actions.signatures).toHaveBeenLastCalledWith(
      expect.objectContaining({ signatureNotRequired: 'no' }),
    )
  })
})
