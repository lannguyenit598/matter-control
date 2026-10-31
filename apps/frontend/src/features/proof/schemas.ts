import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

/** The part of the proof subject this feature reads (features never import each other). */
const subjectSchema = z.object({
  id: z.string(),
  kind: z.enum(['REQUIREMENT', 'ACTION']),
  title: z.string(),
  execution: z.string(),
  proofRequired: z.boolean(),
  verification: z.string().nullable(),
  verificationApplicability: z.string().nullable(),
  applicabilityReason: z.string().nullable(),
  proofEpoch: z.number().int(),
  revision: z.number().int(),
})

export const documentSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  name: z.string(),
  currentVersionId: z.string().nullable(),
  revision: z.number().int(),
  etag: z.string(),
})
export const documentPageSchema = pageOf(documentSchema)

export const versionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  no: z.number().int(),
  predecessorId: z.string().nullable(),
  filename: z.string(),
  mediaType: z.string(),
  sha256: z.string(),
  sizeBytes: z.number().int(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  current: z.boolean(),
})

const signatureSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  signer: z.string(),
  signedAt: z.string(),
  observedBy: z.string(),
  recordedAt: z.string(),
})

export const documentDetailSchema = z.object({
  document: documentSchema,
  versions: z.array(versionSchema),
  signatures: z.array(signatureSchema),
  promotionImpact: z
    .object({
      invalidatedCriteria: z.array(z.string()),
      unaffectedCriteria: z.array(z.string()),
      token: z.string(),
    })
    .nullable(),
  asOf: z.string(),
})

const assessmentSchema = z.object({
  id: z.string(),
  verdict: z.enum(['ACCEPTED', 'REJECTED']),
  reviewer: z.string(),
  rationale: z.string(),
  subjectEpoch: z.number().int(),
  assessedVersionId: z.string().nullable(),
  effectiveUntil: z.string().nullable(),
  recordedAt: z.string(),
  revokedAt: z.string().nullable(),
  revokedReason: z.string().optional(),
})

const claimSchema = z.object({
  id: z.string(),
  evidenceId: z.string(),
  criterionRevision: z.number().int(),
  claimedBy: z.string(),
  claimedAt: z.string(),
  disputed: z.boolean(),
  satisfying: z.boolean(),
  reason: z.string().optional(),
  assessment: assessmentSchema.nullable(),
})

export const criterionSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  title: z.string(),
  description: z.string(),
  mandatory: z.boolean(),
  /** PACKAGE gates a filing submission; OUTCOME is the authority decision accepted later. */
  purpose: z.enum(['PACKAGE', 'OUTCOME']),
  versionRule: z.enum(['NONE', 'CURRENT_AUTHORITATIVE', 'FIXED']),
  documentId: z.string().nullable(),
  fixedVersionId: z.string().nullable(),
  validDays: z.number().int(),
  retired: z.boolean(),
  revision: z.number().int(),
  satisfied: z.boolean(),
  reason: z.string().optional(),
  claims: z.array(claimSchema),
  etag: z.string(),
})

export const evidenceSchema = z.object({
  id: z.string(),
  kind: z.enum(['DOCUMENT_VERSION', 'EXTERNAL_REFERENCE']),
  versionId: z.string().nullable(),
  reference: z.string().optional(),
  description: z.string(),
  submittedBy: z.string(),
  submittedAt: z.string(),
  validFrom: z.string(),
  validUntil: z.string().nullable(),
  withdrawnAt: z.string().nullable(),
})

/** Criteria of one purpose: how many are declared and how many mandatory ones are satisfied. */
const proofPartSchema = z.object({
  declared: z.boolean(),
  total: z.number().int(),
  mandatory: z.number().int(),
  satisfied: z.number().int(),
  ready: z.boolean(),
})

export const checklistSchema = z.object({
  subject: subjectSchema,
  verification: z.string(),
  package: proofPartSchema,
  outcome: proofPartSchema,
  criteria: z.array(criterionSchema),
  evidence: z.array(evidenceSchema),
  verifiers: z.array(z.string()),
  openDisputes: z.array(
    z.object({
      id: z.string(),
      assessmentId: z.string(),
      raisedBy: z.string(),
      reason: z.string(),
      raisedAt: z.string(),
    }),
  ),
  dependents: z.array(z.string()),
  callerId: z.string(),
  asOf: z.string(),
})

/** One claim the caller, as a designated independent verifier, could assess now (BF-05). */
export const pendingAssessmentSchema = z.object({
  matterId: z.string(),
  matterTitle: z.string(),
  subjectId: z.string(),
  subjectKind: z.enum(['REQUIREMENT', 'ACTION']),
  subjectTitle: z.string(),
  subjectEpoch: z.number().int(),
  criterionId: z.string(),
  criterionTitle: z.string(),
  criterionRevision: z.number().int(),
  criterionPurpose: z.enum(['PACKAGE', 'OUTCOME']),
  claimId: z.string(),
  claimedAt: z.string(),
  claimedBy: z.string(),
  claimedByName: z.string(),
  evidenceId: z.string(),
  evidenceKind: z.enum(['DOCUMENT_VERSION', 'EXTERNAL_REFERENCE']),
  evidenceReference: z.string(),
  submittedBy: z.string(),
  submittedByName: z.string(),
  versionId: z.string().nullable(),
  versionLabel: z.string(),
  reason: z.enum(['PENDING_REVIEW', 'OLD_EPOCH']),
})
export const pendingAssessmentPageSchema = pageOf(pendingAssessmentSchema)
export type PendingAssessment = z.infer<typeof pendingAssessmentSchema>

export const verifiersSchema = z.object({ verifiers: z.array(z.string()) })
export const createdSchema = z.object({ id: z.string(), kind: z.string(), seq: z.number().int() })

export type ProofSubject = z.infer<typeof subjectSchema>
export type DocumentRow = z.infer<typeof documentSchema>
export type DocumentDetail = z.infer<typeof documentDetailSchema>
export type DocumentVersion = z.infer<typeof versionSchema>
export type Checklist = z.infer<typeof checklistSchema>
export type Criterion = z.infer<typeof criterionSchema>
export type Evidence = z.infer<typeof evidenceSchema>

// ---- command inputs (re-validated by every Server Action) ----

const key = z.string().min(1).max(100)
const text = (max: number) => z.string().trim().max(max)
const reason = text(2000)

export const createDocumentInputSchema = z.object({
  matterId: idSchema,
  idempotencyKey: key,
  name: text(200).min(1, 'Enter a name.'),
})

export const promoteInputSchema = z.object({
  matterId: idSchema,
  documentId: idSchema,
  ifMatch: z.string().min(1),
  targetVersionId: idSchema,
  expectedCurrentVersionId: z.string().max(100),
  impactToken: z.string().min(1),
  acknowledged: z.literal('yes', { error: 'Confirm that you have read the impact.' }),
  reason: reason.min(1, 'A reason is required.'),
})

export const signatureInputSchema = z.object({
  matterId: idSchema,
  versionId: idSchema,
  signer: text(200).min(1, 'Enter the signer.'),
  signedAt: z.string().min(1, 'Enter when the signature was observed.'),
})

export const criterionInputSchema = z.object({
  matterId: idSchema,
  itemId: idSchema,
  title: text(200).min(1, 'Enter a title.'),
  description: text(2000),
  mandatory: z.enum(['yes', 'no']),
  /** Empty keeps the criterion's purpose on a revision; a creation defaults to PACKAGE. */
  purpose: z.enum(['', 'PACKAGE', 'OUTCOME']).default(''),
  versionRule: z.enum(['NONE', 'CURRENT_AUTHORITATIVE', 'FIXED']),
  documentId: z.string().max(100),
  fixedVersionId: z.string().max(100),
  validDays: z.coerce.number().int().min(0).max(36500),
})

export const reviseCriterionInputSchema = criterionInputSchema.extend({
  criterionId: idSchema,
  ifMatch: z.string().min(1),
  reason: reason.min(1, 'A reason is required.'),
  retire: z.enum(['yes', 'no']),
})

export const applicabilityInputSchema = z.object({
  matterId: idSchema,
  itemId: idSchema,
  ifMatch: z.string().min(1),
  notRequired: z.enum(['yes', 'no']),
  reason: reason.min(1, 'A reason is required.'),
})

export const submitEvidenceInputSchema = z.object({
  matterId: idSchema,
  idempotencyKey: key,
  versionId: z.string().max(100),
  reference: text(500),
  description: text(2000),
  validFrom: z.string(),
  validUntil: z.string(),
  claims: z.string(), // comma-joined criterion ids (IntentForm joins multi-value fields)
})

export const claimInputSchema = z.object({
  matterId: idSchema,
  evidenceId: idSchema,
  criterionId: idSchema,
})

export const reasonedInputSchema = z.object({
  matterId: idSchema,
  targetId: idSchema,
  reason: reason.min(1, 'A reason is required.'),
})

export const assessInputSchema = z.object({
  matterId: idSchema,
  claimId: idSchema,
  expectedSubjectEpoch: z.coerce.number().int().min(0),
  verdict: z.enum(['ACCEPTED', 'REJECTED']),
  rationale: reason.min(1, 'A rationale is required.'),
  assessedVersionId: z.string().max(100),
  validDays: z.coerce.number().int().min(0).max(36500),
  // The id of the assessment the reviewer saw; '' states that none existed (a first review).
  // Required, so a form that lost it cannot silently supersede an intervening verdict.
  expectedAssessmentId: z.string().max(100),
})

export const resolveInputSchema = z.object({
  matterId: idSchema,
  disputeId: idSchema,
  resolution: reason.min(1, 'A resolution is required.'),
})

export const verifierInputSchema = z.object({
  matterId: idSchema,
  userId: idSchema,
  revoke: z.boolean(),
})
