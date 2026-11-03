import 'server-only'

import { z } from 'zod'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  addGuidanceDraftInputSchema,
  createGuidanceInputSchema,
  guidancePageSchema,
  publishGuidanceInputSchema,
} from './schemas'

/** Guidance reads and commands (RLF-07). Every call carries the user's own token. */
export const guidanceRepository = {
  list: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/guidance`, { schema: guidancePageSchema })).data,

  create: (input: z.infer<typeof createGuidanceInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/guidance`, {
      method: 'POST',
      body: { title: input.title, body: input.body, sourceRefs: input.sourceRefs ?? [] },
      idempotencyKey: input.idempotencyKey,
      schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
    }),

  addDraft: (input: z.infer<typeof addGuidanceDraftInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/guidance/${pathId(input.documentId)}/revisions`, {
      method: 'POST',
      body: { body: input.body, sourceRefs: input.sourceRefs ?? [] },
      idempotencyKey: input.idempotencyKey,
      schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
    }),

  publish: (input: z.infer<typeof publishGuidanceInputSchema>) =>
    mcRequest(
      `/matters/${pathId(input.matterId)}/guidance/${pathId(input.documentId)}/publication`,
      {
        method: 'POST',
        body: { revisionId: input.revisionId },
        idempotencyKey: input.idempotencyKey,
        schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
      },
    ),
}
