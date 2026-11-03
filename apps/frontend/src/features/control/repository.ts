import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import { contextPageSchema, contextRecordSchema, controlRoomSchema, createdSchema } from './schemas'

const m = (id: string) => `/matters/${pathId(id)}`

/** Control Room and context records (contract §2.6). Every call carries the user's own token. */
export const controlRepository = {
  room: async (matterId: string) => {
    const res = await mcRequest(`${m(matterId)}/control-room`, {
      query: { changes: 20 },
      schema: controlRoomSchema,
    })
    return { room: res.data, asOf: res.asOf }
  },

  records: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/context-records`, { schema: contextPageSchema })).data.items,

  create: (matterId: string, body: Record<string, unknown>, idempotencyKey: string) =>
    mcRequest(`${m(matterId)}/context-records`, {
      method: 'POST',
      body,
      idempotencyKey,
      schema: createdSchema,
    }),

  update: (matterId: string, recordId: string, body: Record<string, unknown>, ifMatch: string) =>
    mcRequest(`${m(matterId)}/context-records/${pathId(recordId)}`, {
      method: 'PATCH',
      body,
      ifMatch,
      schema: contextRecordSchema,
    }),
}
