import { z } from 'zod'

import { UUID_V7 } from '@/lib/mc/idempotency'

export const bulkPreviewRowSchema = z.object({
  rowKey: z.string(),
  itemId: z.string(),
  found: z.boolean().optional(),
  title: z.string().optional(),
  outcome: z.string().optional(),
  owner: z.string().nullable().optional(),
  due: z.string().nullable().optional(),
  revision: z.number().optional(),
  valid: z.boolean().optional(),
  code: z.string().optional(),
})

export const bulkPreviewResultSchema = z.object({
  previewId: z.string(),
  rows: z.array(bulkPreviewRowSchema),
  asOf: z.string(),
})

export const ROW_STATUSES = ['SUCCESS', 'SUCCESS_REPLAYED', 'FAILURE', 'UNKNOWN'] as const
export type RowStatus = (typeof ROW_STATUSES)[number]

export const bulkRowResultSchema = z.object({
  rowKey: z.string(),
  itemId: z.string().optional(),
  status: z.enum(ROW_STATUSES),
  code: z.string().optional(),
  revision: z.number().optional(),
  detail: z.string().optional(),
})

export const importRowPlanSchema = z.object({
  rowKey: z.string(),
  kind: z.string(),
  title: z.string(),
  importedVerificationClaim: z.string().optional(),
  outcome: z.string().optional(),
  owner: z.string().nullable().optional(),
  due: z.string().nullable().optional(),
  dependencies: z.array(z.string()).optional().default([]),
  contentHash: z.string().optional(),
  errors: z.array(z.string()).optional().default([]),
})

export const importGroupSchema = z.object({
  id: z.number(),
  rowIdx: z.array(z.number()),
  valid: z.boolean(),
})

export const importPreviewResultSchema = z.object({
  sourceName: z.string(),
  rows: z.array(importRowPlanSchema),
  groups: z.array(importGroupSchema),
  asOf: z.string(),
})

export const importRowResultSchema = z.object({
  rowKey: z.string(),
  itemId: z.string().optional(),
  status: z.enum(ROW_STATUSES),
  code: z.string().optional(),
  contentHash: z.string().optional(),
  detail: z.string().optional(),
})

export const briefChangeSchema = z.object({
  seq: z.number(),
  id: z.string(),
  type: z.string(),
  targetKind: z.string(),
  targetId: z.string(),
  /** The name the change itself recorded for its target, as it was then; empty when none. */
  targetLabel: z.string().optional().default(''),
  actorId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  recordedAt: z.string(),
  effectiveAt: z.string().optional(),
  lateRecorded: z.boolean().optional().default(false),
})

export const briefOutstandingItemSchema = z.object({
  itemId: z.string(),
  kind: z.string(),
  title: z.string(),
  importedVerificationClaim: z.string().optional(),
  outcome: z.string().optional(),
  owner: z.string().nullable().optional(),
  due: z.string().nullable().optional(),
  execution: z.string().optional(),
  dependency: z.string().optional(),
  verification: z.string().optional(),
  revision: z.number().optional(),
  proofExpired: z.boolean().optional().default(false),
})

export const briefResultSchema = z.object({
  matterId: z.string(),
  t1: z.string(),
  t2: z.string(),
  changes: z.array(briefChangeSchema),
  outstanding: z.array(briefOutstandingItemSchema),
  asOf: z.string(),
})

export type BulkPreviewResult = z.infer<typeof bulkPreviewResultSchema>
export type BulkRowResult = z.infer<typeof bulkRowResultSchema>
export type ImportPreviewResult = z.infer<typeof importPreviewResultSchema>
export type ImportRowResult = z.infer<typeof importRowResultSchema>
export type BriefResult = z.infer<typeof briefResultSchema>

const itemId = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/, 'Enter the item id.')
const v7 = z.string().regex(UUID_V7, 'Must be a UUIDv7.')

/** One requested change. An absent field is "unchanged"; owner and due may be cleared with "". */
export const bulkRowInputSchema = z.object({
  rowKey: z.string().min(1).max(100),
  itemId,
  expectedRevision: z.coerce.number().int().positive(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  internalOwner: z.string().max(100).optional(),
  due: z.string().max(40).optional(),
})
export type BulkRowInput = z.infer<typeof bulkRowInputSchema>

/** A commit is the frozen intent: one attempt key and one key per row, minted once. */
export const bulkCommitInputSchema = z.object({
  attemptKey: v7,
  rows: z
    .array(bulkRowInputSchema.extend({ idempotencyKey: v7 }))
    .min(1, 'Select at least one row.')
    .max(500),
})
export type BulkCommitInput = z.infer<typeof bulkCommitInputSchema>

export const importPlanSchema = z.object({
  runKey: v7,
  rowKeys: z.record(z.string().min(1).max(200), v7),
})
export type ImportPlan = z.infer<typeof importPlanSchema>
