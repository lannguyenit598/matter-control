import type { z } from 'zod'

import type { checklistSchema, documentDetailSchema } from './schemas'

type Checklist = z.infer<typeof checklistSchema>
type DocDetail = z.infer<typeof documentDetailSchema>

export type BasisClaim = {
  claimId: string
  claimedBy: string
  claimedAt: string
  disputed: boolean
  satisfying: boolean
  reason: string | undefined
  evidence: {
    kind: 'DOCUMENT_VERSION' | 'EXTERNAL_REFERENCE'
    description: string
    /** A user-entered label for an outside source: never validated, never a stored quotation or page. */
    reference: string | undefined
    submittedBy: string
    submittedAt: string
    validFrom: string
    validUntil: string | null
    withdrawnAt: string | null
  } | null
  version: {
    documentName: string
    no: number
    filename: string
    sha256: string
    uploadedBy: string
    uploadedAt: string
    current: boolean
  } | null
  assessment: {
    verdict: 'ACCEPTED' | 'REJECTED'
    reviewer: string
    rationale: string
    recordedAt: string
    revokedAt: string | null
    effectiveUntil: string | null
    /** The assessed version (when the verdict named one) and whether it is still the current one. */
    assessedVersion: { label: string; current: boolean } | null
  } | null
  /**
   * Why this claim does not (or no longer) support the criterion. Judgements come from the server's
   * per-claim result code (`reason`), the single authority for validity windows and version rules;
   * only plainly stored facts (withdrawn, revoked, challenged) are also read from the records.
   * Nothing is re-derived from timestamps or from `version.current`.
   */
  flags: {
    withdrawn: boolean
    /** The accepted version is not the one the rule requires (CURRENT_AUTHORITATIVE or FIXED). */
    staleVersion: boolean
    epochStale: boolean
    expired: boolean
    notYetValid: boolean
    revoked: boolean
    disputed: boolean
  }
}

export type CriterionBasis = {
  criterion: Checklist['criteria'][number]
  /** What the criterion's version rule points at, as named records. */
  rule: {
    kind: 'NONE' | 'CURRENT_AUTHORITATIVE' | 'FIXED'
    document: string | null
    version: string | null
  }
  claims: BasisClaim[]
  asOf: string
}

/**
 * The exact basis of one criterion's result: criterion, rule, each offered evidence, the exact
 * version it names, and the verifier's disposition with the facts that make it current or not.
 * Required proofs (criteria), offered evidence (claims) and verification (assessments) stay three
 * separate things. Null when the id is not in this checklist.
 */
export function criterionBasis(
  checklist: Checklist,
  docs: DocDetail[],
  criterionId: string,
): CriterionBasis | null {
  const criterion = checklist.criteria.find((c) => c.id === criterionId)
  if (!criterion) return null
  const versions = new Map<string, { name: string; v: DocDetail['versions'][number] }>()
  for (const d of docs) for (const v of d.versions) versions.set(v.id, { name: d.document.name, v })
  const evidenceById = new Map(checklist.evidence.map((e) => [e.id, e]))
  const disputedAssessments = new Set(checklist.openDisputes.map((d) => d.assessmentId))
  const label = (id: string | null) => {
    const hit = id ? versions.get(id) : undefined
    return hit
      ? { label: `${hit.name} · v${hit.v.no} · ${hit.v.filename}`, current: hit.v.current }
      : null
  }
  const doc = criterion.documentId
    ? docs.find((d) => d.document.id === criterion.documentId)
    : undefined
  const claims = criterion.claims.map((c): BasisClaim => {
    const ev = evidenceById.get(c.evidenceId) ?? null
    const ver = ev?.versionId ? versions.get(ev.versionId) : undefined
    const a = c.assessment
    return {
      claimId: c.id,
      claimedBy: c.claimedBy,
      claimedAt: c.claimedAt,
      disputed: c.disputed,
      satisfying: c.satisfying,
      reason: c.reason,
      evidence: ev
        ? {
            kind: ev.kind,
            description: ev.description,
            reference: ev.reference,
            submittedBy: ev.submittedBy,
            submittedAt: ev.submittedAt,
            validFrom: ev.validFrom,
            validUntil: ev.validUntil,
            withdrawnAt: ev.withdrawnAt,
          }
        : null,
      version: ver
        ? {
            documentName: ver.name,
            no: ver.v.no,
            filename: ver.v.filename,
            sha256: ver.v.sha256,
            uploadedBy: ver.v.uploadedBy,
            uploadedAt: ver.v.uploadedAt,
            current: ver.v.current,
          }
        : null,
      assessment: a
        ? {
            verdict: a.verdict,
            reviewer: a.reviewer,
            rationale: a.rationale,
            recordedAt: a.recordedAt,
            revokedAt: a.revokedAt,
            effectiveUntil: a.effectiveUntil,
            assessedVersion: label(a.assessedVersionId),
          }
        : null,
      flags: {
        withdrawn: c.reason === 'WITHDRAWN' || Boolean(ev?.withdrawnAt),
        staleVersion: c.reason === 'VERSION_SUPERSEDED',
        epochStale: c.reason === 'OLD_EPOCH',
        expired: c.reason === 'EXPIRED',
        notYetValid: c.reason === 'NOT_YET_VALID',
        revoked: c.reason === 'REVOKED' || Boolean(a?.revokedAt),
        disputed:
          c.reason === 'DISPUTED' || c.disputed || Boolean(a && disputedAssessments.has(a.id)),
      },
    }
  })
  return {
    criterion,
    rule: {
      kind: criterion.versionRule,
      document: doc?.document.name ?? null,
      version:
        criterion.versionRule === 'FIXED'
          ? (label(criterion.fixedVersionId)?.label ?? null)
          : criterion.versionRule === 'CURRENT_AUTHORITATIVE' && doc?.document.currentVersionId
            ? (label(doc.document.currentVersionId)?.label ?? null)
            : null,
    },
    claims,
    asOf: checklist.asOf,
  }
}
