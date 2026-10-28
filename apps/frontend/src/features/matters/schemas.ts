import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

export const MATTER_ROLES = ['OWNER', 'EDITOR', 'VIEWER'] as const

export const matterSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  revision: z.number().int(),
  eventSeq: z.number().int(),
  callerRole: z.string(),
  lastRecordedAt: z.string(),
})
export const matterPageSchema = pageOf(matterSchema)

export const matterMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  role: z.string(),
  status: z.string(),
  revision: z.number().int(),
})
export const matterMemberPageSchema = pageOf(matterMemberSchema)

export const membershipChangeSchema = z.object({
  scope: z.string(),
  workspaceId: z.string(),
  matterId: z.string().nullable(),
  userId: z.string(),
  role: z.string(),
  status: z.string(),
  revision: z.number().int(),
  recordedAt: z.string(),
})

export const eventSchema = z.object({
  seq: z.number().int(),
  id: z.string(),
  type: z.string(),
  schemaVersion: z.number().int(),
  actorKind: z.string(),
  actorId: z.string().nullable(),
  targetKind: z.string(),
  targetId: z.string(),
  effectiveAt: z.string(),
  recordedAt: z.string(),
  reason: z.string().nullable(),
  causeSeq: z.number().int().nullable(),
  correlationId: z.string().nullable(),
  commandKey: z.string().nullable(),
  before: z.json(),
  after: z.json(),
})
export const eventPageSchema = pageOf(eventSchema)

export type Matter = z.infer<typeof matterSchema>
export type MatterMember = z.infer<typeof matterMemberSchema>
export type MatterEvent = z.infer<typeof eventSchema>

const keySchema = z.string().min(1).max(100)

export const createMatterInputSchema = z.object({
  idempotencyKey: keySchema,
  workspaceId: idSchema,
  title: z.string().trim().min(1, 'Enter a title').max(300),
  /** Strong ETag of the workspace as the caller last read it (CAS). */
  ifMatch: z.string().min(1),
})

export const grantMatterMemberInputSchema = z.object({
  matterId: idSchema,
  userId: z.string().trim().min(1, 'Enter the user id of an active workspace member').max(100),
  role: z.enum(MATTER_ROLES),
  ifMatch: z.string().min(1),
})

export const revokeMatterMemberInputSchema = z.object({
  matterId: idSchema,
  userId: idSchema,
  ifMatch: z.string().min(1),
})
