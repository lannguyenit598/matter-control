import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

export const FILING_STAGES = [
  'REQUIREMENT',
  'PACKAGE_PREPARATION',
  'SIGNATURE',
  'SUBMISSION',
  'RECEIPT',
  'AUTHORITY_REVIEW',
  'SUPPLEMENT',
  'RESPONSE',
  'APPROVAL',
] as const
export type FilingStage = (typeof FILING_STAGES)[number]

/** The part of the filing's work item this feature reads (features never import each other). */
const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  outcome: z.string(),
  execution: z.string(),
  proofRequired: z.boolean(),
  verification: z.string().nullable(),
  proofEpoch: z.number().int(),
  ownerId: z.string().nullable(),
  waitingPartyId: z.string().nullable(),
  waitingCondition: z.string().nullable(),
  completedAt: z.string().nullable(),
  revision: z.number().int(),
})

const derivedSchema = z.object({
  timing: z.string(),
  attention: z.string(),
  attentionReasons: z.array(z.string()),
})

const filingSchema = z.object({
  requirementId: z.string(),
  authorityPartyId: z.string(),
  stage: z.enum(FILING_STAGES),
  negativeOutcome: z.string().optional(),
  negativeOpen: z.boolean(),
  currentCycle: z.number().int(),
  // The OWNER's explicit no-signature decision (F03); independent of the outcome-proof flag.
  signatureNotRequired: z.boolean().default(false),
  signatureNotRequiredReason: z.string().optional(),
  signatureNotRequiredBy: z.string().nullable().optional(),
  signatureNotRequiredAt: z.string().nullable().optional(),
})

export const cycleSchema = z.object({
  id: z.string(),
  no: z.number().int(),
  openedInEpoch: z.number().int(),
  requestRef: z.string(),
  ownerId: z.string().nullable(),
  dueAt: z.string().nullable(),
  openedAt: z.string(),
  submittedAt: z.string().nullable(),
  submissionId: z.string().nullable(),
})

export const submissionSchema = z.object({
  id: z.string(),
  cycleNo: z.number().int(),
  reference: z.string(),
  submittedAt: z.string(),
  versionIds: z.array(z.string()),
  externalRefs: z.array(z.string()),
  recordedBy: z.string(),
  recordedAt: z.string(),
})

export const observationSchema = z.object({
  id: z.string(),
  seq: z.number().int(),
  kind: z.enum(['STAGE', 'NEGATIVE_OUTCOME', 'CLOSE_NEGATIVE', 'REOPEN', 'CORRECTION']),
  from: z.string(),
  to: z.string(),
  reference: z.string(),
  observedAt: z.string(),
  evidenceIds: z.array(z.string()),
  actor: z.string(),
  reason: z.string(),
  correctsId: z.string().nullable(),
  outcome: z.string().optional(),
  recordedAt: z.string(),
  cycleNo: z.number().int(),
  proofEpoch: z.number().int(),
})

export const filingDetailSchema = z.object({
  item: itemSchema,
  derived: derivedSchema,
  etag: z.string(),
  filing: filingSchema,
  cycles: z.array(cycleSchema),
  submissions: z.array(submissionSchema),
  observations: z.array(observationSchema),
  next: z.array(z.enum(FILING_STAGES)),
  asOf: z.string(),
})

export const filingSummarySchema = z.object({
  item: itemSchema,
  derived: derivedSchema,
  etag: z.string(),
  filing: filingSchema,
})
export const filingPageSchema = pageOf(filingSummarySchema)

export const evidenceRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  versionId: z.string().nullable(),
  reference: z.string().optional(),
  description: z.string(),
  submittedAt: z.string(),
  withdrawnAt: z.string().nullable(),
})
export const evidencePageSchema = pageOf(evidenceRowSchema)

export const createdSchema = z.object({ id: z.string(), kind: z.string(), seq: z.number().int() })

export type FilingDetail = z.infer<typeof filingDetailSchema>
export type FilingSummary = z.infer<typeof filingSummarySchema>
export type EvidenceRow = z.infer<typeof evidenceRowSchema>

// ---- command inputs (re-validated by every Server Action) ----

const key = z.string().min(1).max(100)
const text = (max: number) => z.string().trim().max(max)

export const createFilingInputSchema = z.object({
  matterId: idSchema,
  idempotencyKey: key,
  title: text(200).min(1, 'Enter a title.'),
  outcome: text(2000).min(1, 'Enter the outcome this filing seeks.'),
  requirementId: idSchema,
  authorityPartyId: idSchema,
  ownerId: z.string().max(100),
  proofRequired: z.enum(['yes', 'no']),
})

export const advanceInputSchema = z.object({
  matterId: idSchema,
  filingId: idSchema,
  ifMatch: z.string().min(1),
  to: z.enum(FILING_STAGES),
  reference: text(500),
  observedAt: z.string(),
  evidenceIds: z.string(), // comma-joined ids
  versionIds: z.string(),
  externalRefs: text(2000),
  requestRef: text(500),
  cycleOwnerId: z.string().max(100),
  cycleDue: z.string(),
  reason: text(2000),
})

export const negativeInputSchema = z.object({
  matterId: idSchema,
  filingId: idSchema,
  ifMatch: z.string().min(1),
  outcome: z.enum(['REJECTED', 'WITHDRAWN']),
  reference: text(500),
  observedAt: z.string(),
  evidenceIds: z.string(),
})

export const ownerStepInputSchema = z.object({
  matterId: idSchema,
  filingId: idSchema,
  ifMatch: z.string().min(1),
  step: z.enum(['closure', 'reopening']),
  reason: text(2000).min(1, 'A reason is required.'),
})

export const applicabilityInputSchema = z.object({
  matterId: idSchema,
  filingId: idSchema,
  ifMatch: z.string().min(1),
  // 'yes': signatures do not apply; 'no': withdraw that decision.
  signatureNotRequired: z.enum(['yes', 'no']),
  reason: text(2000).min(1, 'A reason is required.'),
})

export const correctionInputSchema = z.object({
  matterId: idSchema,
  filingId: idSchema,
  ifMatch: z.string().min(1),
  observationId: idSchema,
  reference: text(500),
  observedAt: z.string(),
  reason: text(2000).min(1, 'A reason is required.'),
})
