import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import { requirementSchema } from './schemas'

export const requirementRepository = {
  get: async (id: string) => {
    const res = await mcRequest(`/requirements/${pathId(id)}`, { schema: requirementSchema })
    return { requirement: res.data, etag: res.etag, asOf: res.asOf }
  },

  create: (matterId: string, input: { idempotencyKey: string; title: string; outcome: string }) =>
    mcRequest(`/matters/${pathId(matterId)}/requirements`, {
      method: 'POST',
      body: { title: input.title, outcome: input.outcome },
      idempotencyKey: input.idempotencyKey,
      schema: requirementSchema,
    }),
}
