import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

import { ProofPanel, type ProofContext } from './proof-panel'
import { checklistSchema } from '../schemas'

// OV-F1-01 (D-9, fix-wave #2 G1): the API contract gained the SIGNATURE criterion purpose and a
// `signature` proof part. The proof checklist must parse such a payload and the panel must show
// the signature axis (criteria rows and the purpose selector), so a proof-required filing can be
// prepared through the UI again.

// Untyped on purpose: before the fix this payload fails schema parsing at runtime.
const signatureChecklistPayload = {
  subject: {
    id: 'f1',
    kind: 'ACTION',
    title: 'Merger filing',
    execution: 'IN_PROGRESS',
    proofRequired: true,
    verification: 'PARTIALLY_VERIFIED',
    verificationApplicability: 'REQUIRED',
    applicabilityReason: null,
    proofEpoch: 0,
    revision: 3,
  },
  verification: 'PARTIALLY_VERIFIED',
  package: { declared: true, total: 1, mandatory: 1, satisfied: 1, ready: true },
  signature: { declared: true, total: 1, mandatory: 1, satisfied: 0, ready: false },
  outcome: { declared: true, total: 1, mandatory: 1, satisfied: 0, ready: false },
  criteria: [
    {
      id: 'c-pkg',
      subjectId: 'f1',
      title: 'Package complete',
      description: '',
      mandatory: true,
      purpose: 'PACKAGE',
      versionRule: 'NONE',
      documentId: null,
      fixedVersionId: null,
      validDays: 0,
      retired: false,
      revision: 1,
      satisfied: true,
      reason: '',
      etag: '"pkg-1"',
      claims: [
        {
          id: 'k-pkg',
          evidenceId: 'e-pkg',
          criterionRevision: 1,
          claimedBy: 'alice',
          claimedAt: '2026-11-01T00:00:00Z',
          disputed: false,
          satisfying: true,
          assessment: {
            id: 'a-pkg',
            verdict: 'ACCEPTED',
            reviewer: 'bob',
            rationale: 'checked',
            subjectEpoch: 0,
            assessedVersionId: null,
            effectiveUntil: null,
            recordedAt: '2026-11-01T00:01:00Z',
            revokedAt: null,
          },
        },
      ],
    },
    {
      id: 'c-sig',
      subjectId: 'f1',
      title: 'Signed filing form',
      description: '',
      mandatory: true,
      purpose: 'SIGNATURE',
      versionRule: 'NONE',
      documentId: null,
      fixedVersionId: null,
      validDays: 0,
      retired: false,
      revision: 1,
      satisfied: false,
      reason: 'MISSING',
      etag: '"sig-1"',
      claims: [],
    },
    {
      id: 'c-out',
      subjectId: 'f1',
      title: 'Authority decision accepted',
      description: '',
      mandatory: true,
      purpose: 'OUTCOME',
      versionRule: 'NONE',
      documentId: null,
      fixedVersionId: null,
      validDays: 0,
      retired: false,
      revision: 1,
      satisfied: false,
      reason: 'MISSING',
      etag: '"out-1"',
      claims: [],
    },
  ],
  evidence: [
    {
      id: 'e-pkg',
      kind: 'EXTERNAL_REFERENCE',
      versionId: null,
      reference: 'package-proof',
      description: '',
      submittedBy: 'alice',
      submittedAt: '2026-11-01T00:00:00Z',
      validFrom: '2026-11-01T00:00:00Z',
      validUntil: null,
      withdrawnAt: null,
    },
  ],
  verifiers: ['bob'],
  openDisputes: [],
  dependents: [],
  callerId: 'alice',
  asOf: '2026-11-01T00:02:00Z',
}

const ctx = (over: Partial<ProofContext> = {}): ProofContext => ({
  matterId: 'm1',
  role: 'OWNER',
  itemEtag: '"item-1"',
  names: { alice: 'Alice', bob: 'Bob' },
  documents: [],
  versions: [],
  verifierCandidates: [],
  isFiling: true,
  ...over,
})

describe('D-9 signature purpose through the UI (OV-F1-01)', () => {
  it('parses a checklist with a SIGNATURE criterion and the signature part', () => {
    const parsed = checklistSchema.parse(signatureChecklistPayload)
    expect(parsed.signature.declared).toBe(true)
    expect(parsed.signature.ready).toBe(false)
    const sig = parsed.criteria.find((c) => c.purpose === 'SIGNATURE')
    expect(sig?.title).toBe('Signed filing form')
  })

  it('shows the signature axis on the panel instead of filtering it out', () => {
    render(<ProofPanel checklist={checklistSchema.parse(signatureChecklistPayload)} ctx={ctx()} />)
    const section = screen.getByRole('heading', { name: 'Signature' }).closest('section')!
    expect(within(section).getByText('Signed filing form')).toBeInTheDocument()
    expect(within(section).getByText(/Pending:/)).toBeInTheDocument()
  })

  it('offers SIGNATURE in the criterion purpose selector', () => {
    render(<ProofPanel checklist={checklistSchema.parse(signatureChecklistPayload)} ctx={ctx()} />)
    const select = screen.getByLabelText('What does it prove?')
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value)
    expect(options).toEqual(expect.arrayContaining(['PACKAGE', 'SIGNATURE', 'OUTCOME']))
  })
})
