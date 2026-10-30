import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  assess: vi.fn(),
  promote: vi.fn(),
  createDocument: vi.fn(),
}))
vi.mock('../actions', () => ({
  assessClaimAction: actions.assess,
  promoteVersionAction: actions.promote,
  createCriterionAction: vi.fn(),
  raiseDisputeAction: vi.fn(),
  resolveDisputeAction: vi.fn(),
  revokeAssessmentAction: vi.fn(),
  reviseCriterionAction: vi.fn(),
  setApplicabilityAction: vi.fn(),
  setVerifierAction: vi.fn(),
  submitEvidenceAction: vi.fn(),
  withdrawEvidenceAction: vi.fn(),
  createDocumentAction: actions.createDocument,
  recordSignatureAction: vi.fn(),
}))

import type { Checklist } from '../schemas'

import { CreateDocumentForm, PromoteForm, UploadVersionForm } from './document-forms'
import { ProofPanel, type ProofContext } from './proof-panel'

const ctx = (over: Partial<ProofContext> = {}): ProofContext => ({
  matterId: 'm1',
  role: 'EDITOR',
  itemEtag: '"item-1"',
  names: { alice: 'Alice', bob: 'Bob' },
  documents: [],
  versions: [],
  verifierCandidates: [],
  ...over,
})

const checklist = (callerId: string, over: Partial<Checklist> = {}): Checklist => ({
  subject: {
    id: 'r1',
    kind: 'REQUIREMENT',
    title: 'Signed SPA',
    execution: 'COMPLETED',
    proofRequired: true,
    verification: 'UNVERIFIED',
    verificationApplicability: 'REQUIRED',
    applicabilityReason: null,
    proofEpoch: 2,
    revision: 4,
  },
  verification: 'UNVERIFIED',
  criteria: [
    {
      id: 'c1',
      subjectId: 'r1',
      title: 'Signed copy',
      description: '',
      mandatory: true,
      versionRule: 'NONE',
      documentId: null,
      fixedVersionId: null,
      validDays: 0,
      retired: false,
      revision: 1,
      satisfied: false,
      reason: 'PENDING_REVIEW',
      etag: '"c1-1"',
      claims: [
        {
          id: 'k1',
          evidenceId: 'e1',
          criterionRevision: 1,
          claimedBy: 'alice',
          claimedAt: '2026-10-27T00:00:00Z',
          disputed: false,
          satisfying: false,
          assessment: null,
        },
      ],
    },
  ],
  evidence: [
    {
      id: 'e1',
      kind: 'EXTERNAL_REFERENCE',
      versionId: null,
      reference: 'synthetic-ref',
      description: '',
      submittedBy: 'alice',
      submittedAt: '2026-10-27T00:00:00Z',
      validFrom: '2026-10-27T00:00:00Z',
      validUntil: null,
      withdrawnAt: null,
    },
  ],
  verifiers: ['alice', 'bob'],
  openDisputes: [],
  dependents: [],
  callerId,
  asOf: '2026-10-27T01:00:00Z',
  ...over,
})

beforeEach(() => {
  router.refresh.mockClear()
  actions.assess.mockReset()
  actions.promote.mockReset()
  window.sessionStorage.clear()
})

it('continues confirmed document creation on its upload/detail screen', async () => {
  actions.createDocument.mockResolvedValue({ ok: true, id: 'document-1' })
  render(<CreateDocumentForm matterId="m1" matterTitle="Acme" />)
  fireEvent.click(screen.getByRole('button', { name: 'New document' }))
  fireEvent.change(screen.getByLabelText(/^Document name/), {
    target: { value: 'Board resolutions' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create document' }))
  await waitFor(() => expect(router.push).toHaveBeenCalledWith('/matters/m1/documents/document-1'))
})

describe('ProofPanel', () => {
  it('shows the derived state as read-only and the pending review as such', () => {
    render(<ProofPanel checklist={checklist('bob')} ctx={ctx()} />)
    expect(screen.getByText('Unverified')).toBeInTheDocument()
    expect(screen.getByText(/Offered, waiting for an independent verifier/)).toBeInTheDocument()
    expect(screen.getByText(/It cannot be edited/)).toBeInTheDocument()
  })

  it('offers the review form to an independent verifier and sends the epoch it read', async () => {
    actions.assess.mockResolvedValue({ ok: true })
    render(<ProofPanel checklist={checklist('bob')} ctx={ctx()} />)
    fireEvent.change(screen.getByLabelText(/Decision/), { target: { value: 'ACCEPTED' } })
    fireEvent.change(screen.getByLabelText(/Rationale/), { target: { value: 'checked' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record decision' }))
    await waitFor(() => expect(actions.assess).toHaveBeenCalled())
    expect(actions.assess).toHaveBeenCalledWith(
      expect.objectContaining({
        matterId: 'm1',
        claimId: 'k1',
        expectedSubjectEpoch: 2,
        verdict: 'ACCEPTED',
        rationale: 'checked',
        // F02: a first review states explicitly that it saw no assessment
        expectedAssessmentId: '',
      }),
    )
  })

  it('binds a re-review to the assessment it read, and starts a clean draft when that changes', async () => {
    actions.assess.mockResolvedValue({ ok: true })
    const withVerdict = (id: string) => {
      const base = checklist('bob')
      const claim = base.criteria[0]!.claims[0]!
      claim.assessment = {
        id,
        verdict: 'REJECTED',
        reviewer: 'carol',
        rationale: 'blurry scan',
        assessedVersionId: null,
        effectiveUntil: null,
        recordedAt: '2026-10-27T00:30:00Z',
        revokedAt: null,
        revokedReason: null,
      } as never
      return base
    }
    const { rerender } = render(<ProofPanel checklist={withVerdict('a1')} ctx={ctx()} />)
    fireEvent.change(screen.getByLabelText(/Decision/), { target: { value: 'ACCEPTED' } })
    fireEvent.change(screen.getByLabelText(/Rationale/), { target: { value: 'reversal drafted' } })

    // someone else records a newer verdict while this reviewer is typing
    rerender(<ProofPanel checklist={withVerdict('a2')} ctx={ctx()} />)
    expect(screen.getByLabelText(/Rationale/)).toHaveValue('')

    fireEvent.change(screen.getByLabelText(/Decision/), { target: { value: 'ACCEPTED' } })
    fireEvent.change(screen.getByLabelText(/Rationale/), { target: { value: 'saw a2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record decision' }))
    await waitFor(() => expect(actions.assess).toHaveBeenCalled())
    expect(actions.assess).toHaveBeenCalledWith(
      expect.objectContaining({ claimId: 'k1', expectedAssessmentId: 'a2', rationale: 'saw a2' }),
    )
  })

  it('never offers a review to the person who supplied or offered the evidence', () => {
    render(<ProofPanel checklist={checklist('alice')} ctx={ctx()} />)
    expect(screen.queryByRole('button', { name: 'Record decision' })).toBeNull()
    expect(screen.getByText(/someone else must review it/)).toBeInTheDocument()
  })

  it('never offers a review to someone who is not a designated verifier', () => {
    render(<ProofPanel checklist={checklist('carol', { verifiers: ['bob'] })} ctx={ctx()} />)
    expect(screen.queryByRole('button', { name: 'Record decision' })).toBeNull()
  })

  it('a viewer sees the proof but no writing controls', () => {
    render(<ProofPanel checklist={checklist('carol')} ctx={ctx({ role: 'VIEWER' })} />)
    expect(screen.queryByText('Add a criterion')).toBeNull()
    expect(screen.queryByText('Offer evidence')).toBeNull()
    expect(screen.queryByText('Is proof needed?')).toBeNull()
  })

  it('says plainly when nothing could be verified yet', () => {
    render(<ProofPanel checklist={checklist('bob', { criteria: [], verifiers: [] })} ctx={ctx()} />)
    expect(screen.getByText(/nothing can be verified/)).toBeInTheDocument()
    expect(screen.getByText(/proof stays pending/)).toBeInTheDocument()
  })
})

describe('PromoteForm', () => {
  const detail = {
    document: {
      id: 'd1',
      matterId: 'm1',
      name: 'SPA',
      currentVersionId: 'v1',
      revision: 3,
      etag: '"d-3"',
    },
    versions: [],
    signatures: [],
    promotionImpact: { invalidatedCriteria: ['c1'], unaffectedCriteria: [], token: 'tok' },
    asOf: '2026-10-27T01:00:00Z',
  }

  it('does not send until the impact is acknowledged, then sends the exact guards', async () => {
    actions.promote.mockResolvedValueOnce({
      ok: false,
      kind: 'validation',
      error: 'Please fix the highlighted fields.',
      fieldErrors: { acknowledged: ['Confirm that you have read the impact.'] },
    })
    actions.promote.mockResolvedValue({ ok: true })
    render(
      <PromoteForm
        matterId="m1"
        detail={detail}
        etag='"d-3"'
        targetVersionId="v2"
        invalidated={['c1']}
        unaffected={[]}
        titles={{ c1: 'Current SPA' }}
      />,
    )
    expect(screen.getByText(/Current SPA/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'v2 is final' } })
    fireEvent.click(screen.getByRole('button', { name: 'Make this the current version' }))
    await waitFor(() => expect(actions.promote).toHaveBeenCalled())
    // Unchecked box -> the action receives an empty acknowledgement (the server action refuses it).
    expect(actions.promote.mock.calls[0]![0]).toMatchObject({ acknowledged: '' })
    await screen.findByText('Confirm that you have read the impact.')

    fireEvent.click(screen.getByLabelText(/I have read this impact/))
    const again = await screen.findByRole('button', { name: 'Make this the current version' })
    await waitFor(() => expect(again).toBeEnabled()) // a pending transition keeps it disabled for a tick
    fireEvent.click(again)
    await waitFor(() => expect(actions.promote).toHaveBeenCalledTimes(2))
    expect(actions.promote.mock.calls[1]![0]).toMatchObject({
      matterId: 'm1',
      documentId: 'd1',
      ifMatch: '"d-3"',
      targetVersionId: 'v2',
      expectedCurrentVersionId: 'v1',
      impactToken: 'tok',
      acknowledged: 'yes',
      reason: 'v2 is final',
    })
  })
})

describe('UploadVersionForm', () => {
  const file = () => new File(['hello'], 'spa.pdf', { type: 'application/pdf' })

  function choose() {
    render(<UploadVersionForm matterId="m1" documentId="d1" />)
    fireEvent.change(screen.getByLabelText(/File/), { target: { files: [file()] } })
  }

  it('retries an interrupted upload with the SAME idempotency key, and a new file gets a new one', async () => {
    const calls: Headers[] = []
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (_u: string, init: RequestInit) => {
        calls.push(new Headers(init.headers))
        throw new TypeError('network down')
      })
      .mockImplementationOnce(async (_u: string, init: RequestInit) => {
        calls.push(new Headers(init.headers))
        return new Response(JSON.stringify({ ok: true, id: 'v9', replayed: true }), { status: 201 })
      })
    vi.stubGlobal('fetch', fetchMock)
    choose()
    fireEvent.click(screen.getByRole('button', { name: 'Upload version' }))
    await screen.findByText('Outcome not confirmed')
    fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }))
    await screen.findByText('This file had already been stored.')
    expect(calls).toHaveLength(2)
    expect(calls[0]!.get('Idempotency-Key')).toBe(calls[1]!.get('Idempotency-Key'))
    expect(calls[0]!.get('X-Filename')).toBe('spa.pdf')
    expect(router.refresh).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('shows the server refusal without asserting a rollback it cannot know', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: false,
              kind: 'forbidden',
              error: 'You do not have permission to do this.',
            }),
            { status: 403 },
          ),
      ),
    )
    choose()
    fireEvent.click(screen.getByRole('button', { name: 'Upload version' }))
    await screen.findByText('You do not have permission to do this.')
    expect(screen.queryByRole('button', { name: 'Retry upload' })).toBeNull()
    vi.unstubAllGlobals()
  })
})
