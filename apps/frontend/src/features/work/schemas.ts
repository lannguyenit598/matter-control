import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

export const EXECUTION_STATES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'WAITING',
  'COMPLETED',
  'CANCELLED',
] as const
export type ExecutionState = (typeof EXECUTION_STATES)[number]

const gateReasonSchema = z.object({
  edgeId: z.string(),
  sourceId: z.string(),
  gate: z.enum(['COMPLETION', 'PROOF']),
  code: z.string(),
})

export const workItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['REQUIREMENT', 'ACTION']),
  matterId: z.string(),
  title: z.string(),
  outcome: z.string(),
  execution: z.enum(EXECUTION_STATES),
  dependency: z.enum(['READY', 'BLOCKED']),
  dependencyReasons: z.array(gateReasonSchema),
  importedVerificationClaim: z.string().optional(),
  proofRequired: z.boolean(),
  verification: z.string().nullable(),
  verificationApplicability: z.string().nullable(),
  applicabilityReason: z.string().nullable(),
  proofEpoch: z.number().int(),
  workstreamId: z.string().nullable(),
  ownerId: z.string().nullable(),
  dueAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  waitingPartyId: z.string().nullable(),
  waitingCondition: z.string().nullable(),
  escalation: z.string().nullable(),
  revision: z.number().int(),
})

export const derivedSchema = z.object({
  timing: z.enum(['ON_TRACK', 'DUE_SOON', 'OVERDUE']),
  noDueDate: z.boolean(),
  attention: z.enum(['NORMAL', 'ATTENTION', 'CRITICAL']),
  attentionReasons: z.array(z.string()),
  criticalChain: z.boolean(),
})

export const envelopeSchema = z.object({
  item: workItemSchema,
  derived: derivedSchema,
  etag: z.string(),
})
export const workPageSchema = pageOf(envelopeSchema)

const edgeSchema = z.object({
  id: z.string(),
  gate: z.enum(['COMPLETION', 'PROOF']),
  satisfied: z.boolean(),
  reason: z.string().nullable(),
  other: z.object({
    id: z.string(),
    kind: z.enum(['REQUIREMENT', 'ACTION']),
    title: z.string(),
    execution: z.enum(EXECUTION_STATES),
    dependency: z.enum(['READY', 'BLOCKED']),
  }),
})

export const detailSchema = envelopeSchema.extend({
  /** A filing keeps its package/signature checklist whatever its outcome-proof flag says. */
  isFiling: z.boolean(),
  /** Filings only: NOT_TRACKED | NOT_DECLARED | PENDING | ACCEPTED. */
  outcomeVerification: z.string().optional(),
  upstream: z.array(edgeSchema),
  downstream: z.array(edgeSchema),
})

const assignedSchema = z.object({
  matterId: z.string(),
  matterRevision: z.number().int(),
  class: z.enum(['ELIGIBLE', 'WAITING', 'BLOCKED', 'HISTORICAL']),
  reason: z.string(),
  waitingOn: z.string().nullable(),
  item: workItemSchema,
  derived: derivedSchema,
  etag: z.string(),
})

export const myActionsSchema = z.object({
  next: z.array(assignedSchema),
  waiting: z.array(assignedSchema),
  blocked: z.array(assignedSchema),
  historical: z.array(assignedSchema),
})

export const workstreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  revision: z.number().int(),
})
export const workstreamPageSchema = pageOf(workstreamSchema)

export const partySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  contact: z.string(),
  notes: z.string(),
  revision: z.number().int(),
  etag: z.string(),
})
export const partyPageSchema = pageOf(partySchema)

const milestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  dueAt: z.string().nullable(),
  critical: z.boolean(),
  prerequisites: z.array(z.string()),
  revision: z.number().int(),
})
export const milestoneViewSchema = z.object({
  etag: z.string(),
  milestone: milestoneSchema,
  status: z.object({
    state: z.enum(['UNASSESSED', 'READY', 'NOT_READY']),
    satisfied: z.number().int(),
    total: z.number().int(),
    unsatisfied: z.array(z.object({ itemId: z.string(), reasons: z.array(z.string()) })),
  }),
})
export const milestonePageSchema = pageOf(milestoneViewSchema)

export type WorkItem = z.infer<typeof workItemSchema>
export type Derived = z.infer<typeof derivedSchema>
export type Envelope = z.infer<typeof envelopeSchema>
export type Detail = z.infer<typeof detailSchema>
export type Assigned = z.infer<typeof assignedSchema>
export type MyActions = z.infer<typeof myActionsSchema>
export type Workstream = z.infer<typeof workstreamSchema>
export type Party = z.infer<typeof partySchema>
export type MilestoneView = z.infer<typeof milestoneViewSchema>

// ---- grid query (URL state; untrusted, invalid values fall back to "no filter") ----

const enumOrUndef = <T extends [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined)

export const gridQuerySchema = z.object({
  kind: enumOrUndef(['REQUIREMENT', 'ACTION']),
  execution: enumOrUndef(EXECUTION_STATES as unknown as [string, ...string[]]),
  dependency: enumOrUndef(['READY', 'BLOCKED']),
  timing: enumOrUndef(['ON_TRACK', 'DUE_SOON', 'OVERDUE']),
  attention: enumOrUndef(['NORMAL', 'ATTENTION', 'CRITICAL']),
  owner: z.string().max(100).optional().catch(undefined),
  workstream: idSchema.optional().catch(undefined),
  q: z.string().trim().max(200).optional().catch(undefined),
  sort: enumOrUndef(['due', 'title', 'execution', 'attention']),
  desc: z.enum(['true']).optional().catch(undefined),
  cursor: z.string().max(200).optional().catch(undefined),
})
export type GridQuery = z.infer<typeof gridQuerySchema>

/** Find-a-record read for pickers (BF-04): one bounded page of matching records, never a dump. */
export const searchWorkItemsInputSchema = z.object({
  matterId: idSchema,
  query: z.string().trim().max(100),
  kind: z.enum(['REQUIREMENT', 'ACTION']).optional(),
  excludeId: idSchema.optional(),
})

// ---- action inputs (untrusted: every Server Action re-validates) ----

const key = z.string().min(1).max(100)
const etag = z.string().min(1).max(200)
const text = (max: number, msg: string) => z.string().trim().min(1, msg).max(max)

export const createActionInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  title: text(300, 'Enter a title'),
  outcome: text(5000, 'Describe the outcome'),
})

/** Empty string clears a nullable field; an absent key leaves it alone. */
export const updateItemInputSchema = z.object({
  matterId: idSchema,
  itemId: idSchema,
  ifMatch: etag,
  title: text(300, 'Enter a title').optional(),
  outcome: text(5000, 'Describe the outcome').optional(),
  ownerId: z.string().max(100).optional(),
  dueAt: z.string().max(40).optional(),
  workstreamId: z.string().max(100).optional(),
})

export const transitionInputSchema = z.object({
  matterId: idSchema,
  itemId: idSchema,
  ifMatch: etag,
  to: z.enum(EXECUTION_STATES),
  reason: z.string().trim().max(2000).optional(),
  waitingPartyId: z.string().max(100).optional(),
  waitingCondition: z.string().trim().max(2000).optional(),
  completedAt: z.string().max(40).optional(),
})

export const escalateInputSchema = z.object({
  matterId: idSchema,
  itemId: idSchema,
  ifMatch: etag,
  reason: z.string().trim().max(2000),
})

export const addDependencyInputSchema = z.object({
  matterId: idSchema,
  targetId: idSchema,
  ifMatch: etag,
  sourceId: idSchema,
  gate: z.enum(['COMPLETION', 'PROOF']),
  reason: text(2000, 'A reason is required'),
})

export const removeDependencyInputSchema = z.object({
  matterId: idSchema,
  targetId: idSchema,
  edgeId: idSchema,
  ifMatch: etag,
  reason: text(2000, 'A reason is required'),
})

export const createNamedInputSchema = z.object({
  matterId: idSchema,
  name: text(200, 'Enter a name'),
})

export const createPartyInputSchema = createNamedInputSchema.extend({
  kind: z.string().trim().max(100).optional(),
  contact: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
})

export const updatePartyInputSchema = z.object({
  matterId: idSchema,
  partyId: idSchema,
  ifMatch: etag,
  name: text(200, 'Enter a name').optional(),
  kind: z.string().trim().max(100).optional(),
  contact: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(5000).optional(),
})

export const createMilestoneInputSchema = createNamedInputSchema.extend({
  dueAt: z.string().max(40).optional(),
  critical: z.boolean().optional(),
})

export const milestonePrerequisitesInputSchema = z.object({
  matterId: idSchema,
  milestoneId: idSchema,
  ifMatch: etag,
  prerequisites: z.array(idSchema).max(500),
  critical: z.boolean(),
  reason: text(2000, 'A reason is required'),
})
