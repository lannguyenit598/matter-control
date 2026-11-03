import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

export const WORKSPACE_ROLES = ['OWNER', 'MEMBER'] as const

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  revision: z.number().int(),
})

export const workspaceListItemSchema = workspaceSchema.extend({
  callerRole: z.enum(WORKSPACE_ROLES),
})
export const workspacePageSchema = pageOf(workspaceListItemSchema)

export const memberSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  role: z.string(),
  status: z.string(),
  revision: z.number().int(),
})
export const memberPageSchema = pageOf(memberSchema)

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

export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceListItem = z.infer<typeof workspaceListItemSchema>
export type Member = z.infer<typeof memberSchema>

// ---- action inputs (untrusted: every Server Action re-validates) ----

const keySchema = z.string().min(1).max(100)
const nameSchema = z.string().trim().min(1, 'Enter a name').max(200)

export const createWorkspaceInputSchema = z.object({ idempotencyKey: keySchema, name: nameSchema })

export const grantWorkspaceMemberInputSchema = z.object({
  workspaceId: idSchema,
  userId: z.string().trim().min(1, 'Select a person').max(100),
  role: z.enum(WORKSPACE_ROLES),
  ifMatch: z.string().min(1),
})

export const revokeWorkspaceMemberInputSchema = z.object({
  workspaceId: idSchema,
  userId: idSchema,
  ifMatch: z.string().min(1),
})

export const searchWorkspacePeopleInputSchema = z.object({
  workspaceId: idSchema,
  // The API bounds the query to 100 BYTES (Go len), not UTF-16 units; the repository sends it as a
  // query string, never a path.
  query: z
    .string()
    .trim()
    .refine((q) => new TextEncoder().encode(q).length <= 100),
})
