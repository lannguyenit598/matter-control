import { z } from 'zod'

import { idSchema, pageMetaSchema } from '@/lib/mc/schemas'

// RLF-06: matter-scoped human intake. The requester is attributable free text, never a
// membership; conversion creates ordinary work and completes nothing.

export const intakeStatuses = ['PENDING', 'CONVERTED', 'DECLINED'] as const

export const intakeRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  requestText: z.string(),
  requester: z.string(),
  receivedAt: z.string(),
  attachments: z.array(z.string()).nullable().catch([]),
  status: z.enum(intakeStatuses),
  triageReason: z.string().catch(''),
  triagedBy: z.string().nullable().catch(null),
  triagedAt: z.string().nullable().catch(null),
  itemId: z.string().nullable().catch(null),
  revision: z.number().int(),
  createdAt: z.string(),
  etag: z.string(),
})
export type IntakeRecord = z.infer<typeof intakeRecordSchema>
export const intakePageSchema = z.object({
  items: z.array(intakeRecordSchema),
  page: pageMetaSchema,
})

const key = z.string().min(1).max(100)
const etag = z.string().min(1).max(200)

export const createIntakeInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  title: z.string().trim().min(1).max(300),
  requestText: z.string().trim().max(10000).optional().catch(''),
  requester: z.string().trim().max(200).optional().catch(''),
  receivedAt: z.string().optional().catch(undefined),
})

export const declineIntakeInputSchema = z.object({
  matterId: idSchema,
  intakeId: idSchema,
  ifMatch: etag,
  reason: z.string().trim().min(1).max(2000),
})

export const convertIntakeInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  intakeId: idSchema,
  kind: z.enum(['REQUIREMENT', 'ACTION']),
  title: z.string().trim().min(1).max(300),
  outcome: z.string().trim().min(1).max(5000),
  owner: z.string().max(100).optional().catch(undefined),
})
