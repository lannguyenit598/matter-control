import 'server-only'

import { z } from 'zod'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  convertIntakeInputSchema,
  createIntakeInputSchema,
  declineIntakeInputSchema,
  intakePageSchema,
  intakeRecordSchema,
} from './schemas'

/** Intake reads and commands (RLF-06). Every call carries the user's own token. */
export const intakeRepository = {
  list: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/intake`, { schema: intakePageSchema })).data,

  create: (input: z.infer<typeof createIntakeInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/intake`, {
      method: 'POST',
      body: {
        title: input.title,
        requestText: input.requestText ?? '',
        requester: input.requester ?? '',
        receivedAt: input.receivedAt,
      },
      idempotencyKey: input.idempotencyKey,
      schema: z.object({ id: z.string(), kind: z.string(), seq: z.number() }),
    }),

  decline: (input: z.infer<typeof declineIntakeInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/intake/${pathId(input.intakeId)}/decline`, {
      method: 'POST',
      body: { reason: input.reason },
      ifMatch: input.ifMatch,
      schema: intakeRecordSchema,
    }),

  convert: (input: z.infer<typeof convertIntakeInputSchema>) =>
    mcRequest(`/matters/${pathId(input.matterId)}/intake/${pathId(input.intakeId)}/conversion`, {
      method: 'POST',
      body: {
        kind: input.kind,
        title: input.title,
        outcome: input.outcome,
        owner: input.owner ?? '',
      },
      idempotencyKey: input.idempotencyKey,
      schema: intakeRecordSchema,
    }),
}
