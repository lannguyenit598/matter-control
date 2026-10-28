import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  eventPageSchema,
  matterMemberPageSchema,
  matterPageSchema,
  matterSchema,
  membershipChangeSchema,
} from './schemas'

export const matterRepository = {
  listInWorkspace: async (workspaceId: string, cursor?: string) =>
    (
      await mcRequest(`/workspaces/${pathId(workspaceId)}/matters`, {
        query: { limit: 50, cursor },
        schema: matterPageSchema,
      })
    ).data,

  get: async (id: string) => {
    const res = await mcRequest(`/matters/${pathId(id)}`, { schema: matterSchema })
    return { matter: res.data, etag: res.etag, asOf: res.asOf }
  },

  members: async (id: string) =>
    (await mcRequest(`/matters/${pathId(id)}/members`, { schema: matterMemberPageSchema })).data,

  history: async (id: string, cursor?: string) => {
    const res = await mcRequest(`/matters/${pathId(id)}/events`, {
      query: { limit: 50, cursor },
      schema: eventPageSchema,
    })
    return { ...res.data, asOf: res.asOf }
  },

  create: (
    workspaceId: string,
    input: { idempotencyKey: string; title: string },
    ifMatch: string,
  ) =>
    mcRequest(`/workspaces/${pathId(workspaceId)}/matters`, {
      method: 'POST',
      body: { title: input.title },
      ifMatch,
      idempotencyKey: input.idempotencyKey,
      schema: matterSchema,
    }),

  grantMember: (id: string, body: { userId: string; role: string }, ifMatch: string) =>
    mcRequest(`/matters/${pathId(id)}/members`, {
      method: 'POST',
      body,
      ifMatch,
      schema: membershipChangeSchema,
    }),

  revokeMember: (id: string, userId: string, ifMatch: string) =>
    mcRequest(`/matters/${pathId(id)}/members/${pathId(userId)}/revocation`, {
      method: 'POST',
      ifMatch,
      schema: membershipChangeSchema,
    }),
}
