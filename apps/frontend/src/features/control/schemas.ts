import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

/** The part of a work item the Control Room reads (features never import each other). */
const itemSchema = z.object({
  id: z.string(),
  kind: z.enum(['REQUIREMENT', 'ACTION']),
  title: z.string(),
  execution: z.string(),
  dependency: z.string(),
  verification: z.string().nullable(),
  ownerId: z.string().nullable(),
  dueAt: z.string().nullable(),
  waitingPartyId: z.string().nullable(),
  waitingCondition: z.string().nullable(),
  proofRequired: z.boolean(),
})
const derivedSchema = z.object({
  timing: z.string(),
  attention: z.string(),
  attentionReasons: z.array(z.string()),
  criticalChain: z.boolean(),
})
const rowSchema = z.object({ item: itemSchema, derived: derivedSchema, etag: z.string() })

export const CONTEXT_KINDS = ['DECISION', 'FINDING', 'RISK', 'ENTITY'] as const
export type ContextKind = (typeof CONTEXT_KINDS)[number]

export const contextRecordSchema = z.object({
  id: z.string(),
  kind: z.enum(CONTEXT_KINDS),
  title: z.string(),
  body: z.string(),
  status: z.enum(['OPEN', 'CLOSED']),
  closedReason: z.string().optional(),
  links: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
  revision: z.number().int(),
  etag: z.string(),
})
export const contextPageSchema = pageOf(contextRecordSchema)

export const controlRoomSchema = z.object({
  asOf: z.string(),
  sourceRevision: z.number().int(),
  state: z.object({
    total: z.number().int(),
    byExecution: z.record(z.string(), z.number().int()),
    blocked: z.number().int(),
    overdue: z.number().int(),
    critical: z.number().int(),
    awaitingProof: z.number().int(),
    openFilings: z.number().int(),
    negativeFilings: z.number().int(),
  }),
  blockers: z.array(
    rowSchema.extend({
      reasons: z.array(
        z.object({ edgeId: z.string(), sourceId: z.string(), gate: z.string(), code: z.string() }),
      ),
      upstream: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          execution: z.string(),
          verification: z.string().nullable(),
        }),
      ),
    }),
  ),
  nextActions: z.array(
    rowSchema.extend({ unblocks: z.array(z.string()), decisions: z.array(contextRecordSchema) }),
  ),
  waiting: z.array(rowSchema),
  milestones: z.array(
    z.object({
      milestone: z.object({
        id: z.string(),
        name: z.string(),
        dueAt: z.string().nullable(),
        critical: z.boolean(),
      }),
      status: z.object({
        state: z.enum(['UNASSESSED', 'READY', 'NOT_READY']),
        satisfied: z.number().int(),
        total: z.number().int(),
        unsatisfied: z.array(z.object({ itemId: z.string(), reasons: z.array(z.string()) })),
      }),
    }),
  ),
  gaps: z.array(z.object({ itemId: z.string(), kind: z.string() })),
  decisions: z.array(contextRecordSchema),
  risks: z.array(contextRecordSchema),
  findings: z.array(contextRecordSchema),
  // Every context record and the labels of the records they refer to, from the SAME snapshot as
  // the figures above (F04): the page never combines the room with another read.
  records: z.array(contextRecordSchema),
  titles: z.record(z.string(), z.string()),
  changes: z.array(
    z.object({
      seq: z.number().int(),
      id: z.string(),
      type: z.string(),
      targetKind: z.string(),
      targetId: z.string(),
      recordedAt: z.string(),
      reason: z.string().nullable(),
    }),
  ),
})

export const createdSchema = z.object({ id: z.string(), kind: z.string(), seq: z.number().int() })

export type ControlRoom = z.infer<typeof controlRoomSchema>
export type ContextRecord = z.infer<typeof contextRecordSchema>

const key = z.string().min(1).max(100)

export const createContextInputSchema = z.object({
  matterId: idSchema,
  idempotencyKey: key,
  kind: z.enum(CONTEXT_KINDS),
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  body: z.string().trim().max(4000),
  links: z.string(), // comma-joined ids
})

export const updateContextInputSchema = z.object({
  matterId: idSchema,
  recordId: idSchema,
  ifMatch: z.string().min(1),
  action: z.enum(['close', 'reopen']),
  reason: z.string().trim().max(2000),
})
