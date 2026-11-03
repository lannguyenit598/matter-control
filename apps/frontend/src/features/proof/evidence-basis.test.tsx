import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { z } from 'zod'

import { EvidenceBasis } from './components/evidence-basis'
import { criterionBasis } from './evidence-basis'
import type { checklistSchema, documentDetailSchema } from './schemas'

type Checklist = z.infer<typeof checklistSchema>
type Doc = z.infer<typeof documentDetailSchema>

const ASOF = '2026-10-29T08:00:00Z'

/** v1/v2 of one document; `currentNo` null = nothing was ever promoted. */
const doc = (currentNo: number | null): Doc =>
  ({
    document: {
      id: 'd1',
      name: 'Share purchase agreement',
      currentVersionId: currentNo ? `v${currentNo}` : null,
    },
    versions: [1, 2].map((no) => ({
      id: `v${no}`,
      documentId: 'd1',
      no,
      filename: `spa-${no}.pdf`,
      sha256: 'ab'.repeat(32),
      uploadedBy: 'u1',
      uploadedAt: '2026-10-01T09:00:00Z',
      current: no === currentNo,
      mediaType: 'application/pdf',
      sizeBytes: 1,
      predecessorId: null,
    })),
    signatures: [],
    promotionImpact: null,
    asOf: ASOF,
  }) as unknown as Doc

type Opts = {
  rule?: 'NONE' | 'CURRENT_AUTHORITATIVE' | 'FIXED'
  fixedVersionId?: string | null
  /** The server's per-claim result: a reason code, or satisfying with no reason. */
  reason?: string
  satisfying?: boolean
  evidenceKind?: 'DOCUMENT_VERSION' | 'EXTERNAL_REFERENCE'
  evidenceVersionId?: string | null
  assessedVersionId?: string | null
  effectiveUntil?: string | null
  evidenceValidUntil?: string | null
  withdrawn?: boolean
}

const checklist = (o: Opts = {}): Checklist => {
  const kind = o.evidenceKind ?? 'DOCUMENT_VERSION'
  return {
    subject: { proofEpoch: 0 },
    asOf: ASOF,
    openDisputes: [],
    criteria: [
      {
        id: 'c1',
        title: 'Signed SPA',
        description: 'The executed agreement',
        mandatory: true,
        versionRule: o.rule ?? 'CURRENT_AUTHORITATIVE',
        documentId: 'd1',
        fixedVersionId: o.fixedVersionId ?? null,
        satisfied: Boolean(o.satisfying),
        reason: o.reason,
        claims: [
          {
            id: 'k1',
            evidenceId: 'e1',
            claimedBy: 'u1',
            claimedAt: '2026-10-02T09:00:00Z',
            disputed: false,
            satisfying: Boolean(o.satisfying),
            reason: o.reason,
            assessment: {
              id: 'a1',
              verdict: 'ACCEPTED',
              reviewer: 'u2',
              rationale: 'Matches the executed copy',
              subjectEpoch: 0,
              assessedVersionId: o.assessedVersionId === undefined ? 'v1' : o.assessedVersionId,
              effectiveUntil: o.effectiveUntil ?? null,
              recordedAt: '2026-10-03T09:00:00Z',
              revokedAt: null,
            },
          },
        ],
      },
      {
        id: 'c2',
        title: 'Board minutes',
        description: '',
        mandatory: false,
        versionRule: 'NONE',
        documentId: null,
        fixedVersionId: null,
        satisfied: true,
        claims: [],
      },
    ],
    evidence: [
      {
        id: 'e1',
        kind,
        versionId: kind === 'DOCUMENT_VERSION' ? (o.evidenceVersionId ?? 'v1') : null,
        reference: kind === 'EXTERNAL_REFERENCE' ? 'Registry extract 12 Oct' : undefined,
        description: 'Signed copy',
        submittedBy: 'u1',
        submittedAt: '2026-10-02T09:00:00Z',
        validFrom: '2026-10-02T09:00:00Z',
        validUntil: o.evidenceValidUntil ?? null,
        withdrawnAt: o.withdrawn ? '2026-10-05T09:00:00Z' : null,
      },
    ],
  } as unknown as Checklist
}

const none = {
  withdrawn: false,
  staleVersion: false,
  epochStale: false,
  expired: false,
  notYetValid: false,
  revoked: false,
  disputed: false,
}

describe('criterionBasis: flags come from the server result, not from guesses', () => {
  it('CBHI-F01: a never-promoted v1 accepted by a FIXED rule is valid, only annotated as not current', () => {
    const b = criterionBasis(
      checklist({ rule: 'FIXED', fixedVersionId: 'v1', satisfying: true }),
      [doc(null)],
      'c1',
    )!
    expect(b.claims[0]!.flags).toEqual(none)
    expect(b.claims[0]!.version?.current).toBe(false) // neutral fact, no history invented
  })

  it('CBHI-F01: a satisfied FIXED claim stays valid although v2 is the current version', () => {
    const b = criterionBasis(
      checklist({ rule: 'FIXED', fixedVersionId: 'v1', satisfying: true }),
      [doc(2)],
      'c1',
    )!
    expect(b.claims[0]!.flags).toEqual(none)
    expect(b.claims[0]!.version?.current).toBe(false)
  })

  it('CBHI-F01: a genuine CURRENT_AUTHORITATIVE mismatch is flagged because the server says so', () => {
    const b = criterionBasis(checklist({ reason: 'VERSION_SUPERSEDED' }), [doc(2)], 'c1')!
    expect(b.claims[0]!.flags).toEqual({ ...none, staleVersion: true })
  })

  it('CBHI-F02: expiry at the exact boundary is flagged when the server reports EXPIRED', () => {
    const b = criterionBasis(
      checklist({ reason: 'EXPIRED', effectiveUntil: ASOF }),
      [doc(1)],
      'c1',
    )!
    expect(b.claims[0]!.flags.expired).toBe(true)
    expect(b.claims[0]!.assessment?.effectiveUntil).toBe(ASOF) // shown exactly as stored
  })

  it('CBHI-F02: evidence validUntil expiry is flagged while the assessment endpoint is later', () => {
    const b = criterionBasis(
      checklist({
        reason: 'EXPIRED',
        evidenceValidUntil: ASOF,
        effectiveUntil: '2027-01-01T00:00:00Z',
      }),
      [doc(1)],
      'c1',
    )!
    expect(b.claims[0]!.flags.expired).toBe(true)
    expect(b.claims[0]!.evidence?.validUntil).toBe(ASOF)
    expect(b.claims[0]!.assessment?.effectiveUntil).toBe('2027-01-01T00:00:00Z')
  })

  it('CBHI-F02: a timestamp in the past never overrides a satisfying claim', () => {
    const b = criterionBasis(
      checklist({ satisfying: true, effectiveUntil: '2026-10-01T00:00:00Z' }),
      [doc(1)],
      'c1',
    )!
    expect(b.claims[0]!.flags).toEqual(none)
  })

  it('stored facts that are not rule judgements still show: withdrawn evidence', () => {
    const b = criterionBasis(checklist({ withdrawn: true }), [doc(1)], 'c1')!
    expect(b.claims[0]!.flags.withdrawn).toBe(true)
  })

  it('an unknown criterion is null', () => {
    expect(criterionBasis(checklist(), [doc(1)], 'nope')).toBeNull()
  })
})

describe('EvidenceBasis', () => {
  const link = (id: string | null) =>
    `/matters/m1/work/i1?from=%2Fmy-actions${id ? `&criterion=${id}` : ''}`
  const names = { u1: 'Alice', u2: 'Bob' }
  const open = (o: Opts, docs: Doc[] = [doc(1)], selectedId = 'c1') =>
    render(
      <EvidenceBasis
        checklist={checklist(o)}
        docs={docs}
        names={names}
        selectedId={selectedId}
        linkTo={link}
      />,
    )
  const detail = () => within(screen.getByLabelText('Evidence basis detail'))

  it('lists proofs with their state and opens one by a stable deep link', () => {
    render(
      <EvidenceBasis
        checklist={checklist({ reason: 'VERSION_SUPERSEDED' })}
        docs={[doc(2)]}
        names={names}
        selectedId={undefined}
        linkTo={link}
      />,
    )
    expect(screen.getByRole('link', { name: /Signed SPA/ })).toHaveAttribute(
      'href',
      `${link('c1')}#evidence-basis`,
    )
    expect(
      screen.getByText('Accepted on a version that is no longer the required one'),
    ).toBeInTheDocument()
    expect(screen.getByText('Satisfied')).toBeInTheDocument()
  })

  it('shows version, submitter, verifier decision and exact validity endpoints, never a page or quote', () => {
    open({ reason: 'EXPIRED', effectiveUntil: ASOF, evidenceValidUntil: '2026-10-20T00:00:00Z' })
    expect(detail().getAllByText(/spa-1\.pdf/)).toHaveLength(3) // required, offered and assessed version
    expect(detail().getByText(/Alice/)).toBeInTheDocument()
    expect(detail().getByText('Accepted')).toBeInTheDocument()
    expect(detail().getByText(/Bob/)).toBeInTheDocument()
    expect(detail().getByText('Matches the executed copy')).toBeInTheDocument()
    expect(detail().getByText('Past its validity')).toBeInTheDocument()
    expect(detail().getByText(/evidence valid until/i)).toBeInTheDocument()
    expect(detail().getByText(/decision effective until/i)).toBeInTheDocument()
    expect(detail().getByText(/No page or quotation anchor is recorded/)).toBeInTheDocument()
    expect(detail().getByRole('link', { name: 'Close' })).toHaveAttribute('href', link(null))
  })

  it('CBHI-F01 (rendered): a valid FIXED claim on a non-current version carries no stale warning and no "superseded"', () => {
    open({ rule: 'FIXED', fixedVersionId: 'v1', satisfying: true }, [doc(null)])
    expect(detail().getByText(/not the current version/)).toBeInTheDocument()
    expect(detail().queryByText(/superseded/i)).toBeNull()
    expect(detail().queryByText('Accepted on a version that is not the required one')).toBeNull()
  })

  it('CBHI-F01 (rendered): a real mismatch shows the server-derived warning', () => {
    open({ reason: 'VERSION_SUPERSEDED' }, [doc(2)])
    expect(
      detail().getByText('Accepted on a version that is not the required one'),
    ).toBeInTheDocument()
  })

  it('CBHI-F03: missing DOCUMENT_VERSION metadata is "unavailable", never an outside reference', () => {
    open({ evidenceKind: 'DOCUMENT_VERSION', evidenceVersionId: 'v9' }, [doc(1)])
    expect(detail().getByText(/version details are unavailable/i)).toBeInTheDocument()
    expect(detail().queryByText(/typed by a person/)).toBeNull()
    expect(detail().queryByText(/not validated/)).toBeNull()
  })

  it('CBHI-F03: a real outside reference keeps its disclaimer; an exact version shows the version', () => {
    const { unmount } = open({ evidenceKind: 'EXTERNAL_REFERENCE' })
    expect(detail().getByText(/Registry extract 12 Oct/)).toBeInTheDocument()
    expect(detail().getByText(/typed by a person; not validated/)).toBeInTheDocument()
    unmount()
    open({})
    expect(detail().getAllByText(/spa-1\.pdf/).length).toBeGreaterThan(0)
    expect(detail().queryByText(/typed by a person/)).toBeNull()
    expect(detail().queryByText(/details are unavailable/i)).toBeNull()
  })

  it('an id that is not in this record is explained, not rendered', () => {
    open({}, [doc(1)], 'gone')
    expect(screen.getByRole('status')).toHaveTextContent('no longer part of this record')
    expect(screen.queryByLabelText('Evidence basis detail')).toBeNull()
  })

  it('a proof with no offered evidence says so', () => {
    open({}, [doc(1)], 'c2')
    expect(screen.getByText(/No evidence has been offered/)).toBeInTheDocument()
  })
})
