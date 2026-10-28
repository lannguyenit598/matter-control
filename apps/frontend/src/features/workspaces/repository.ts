import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  memberPageSchema,
  membershipChangeSchema,
  workspacePageSchema,
  workspaceSchema,
} from './schemas'

/**
 * Workspace reads and commands against the product API (contract §2). Every call goes through
 * mcRequest, which requires a session and forwards the user's own token: rights are decided by
 * the API per call, never inferred here.
 */
export const workspaceRepository = {
  listMine: async (cursor?: string) =>
    (await mcRequest('/workspaces', { query: { limit: 50, cursor }, schema: workspacePageSchema }))
      .data,

  /** The workspace plus the strong ETag a later membership command must present as If-Match. */
  get: async (id: string) => {
    const res = await mcRequest(`/workspaces/${pathId(id)}`, { schema: workspaceSchema })
    return { workspace: res.data, etag: res.etag }
  },

  members: async (id: string) =>
    (await mcRequest(`/workspaces/${pathId(id)}/members`, { schema: memberPageSchema })).data,

  create: (input: { idempotencyKey: string; name: string }) =>
    mcRequest('/workspaces', {
      method: 'POST',
      body: { name: input.name },
      idempotencyKey: input.idempotencyKey,
      schema: workspaceSchema,
    }),

  grantMember: (id: string, body: { userId: string; role: string }, ifMatch: string) =>
    mcRequest(`/workspaces/${pathId(id)}/members`, {
      method: 'POST',
      body,
      ifMatch,
      schema: membershipChangeSchema,
    }),

  revokeMember: (id: string, userId: string, ifMatch: string) =>
    mcRequest(`/workspaces/${pathId(id)}/members/${pathId(userId)}/revocation`, {
      method: 'POST',
      ifMatch,
      schema: membershipChangeSchema,
    }),
}
