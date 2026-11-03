import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import { createdSchema, evidencePageSchema, filingDetailSchema, filingPageSchema } from './schemas'

const m = (id: string) => `/matters/${pathId(id)}`
const f = (matterId: string, filingId: string) => `${m(matterId)}/filings/${pathId(filingId)}`

/** Regulatory filings (contract §2.5). Every call carries the user's own token. */
export const filingRepository = {
  list: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/filings`, { schema: filingPageSchema })).data,

  get: async (matterId: string, filingId: string) => {
    const res = await mcRequest(f(matterId, filingId), { schema: filingDetailSchema })
    return { detail: res.data, asOf: res.asOf }
  },

  evidence: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/evidence`, { schema: evidencePageSchema })).data.items,

  create: (matterId: string, body: Record<string, unknown>, idempotencyKey: string) =>
    mcRequest(`${m(matterId)}/filings`, {
      method: 'POST',
      body,
      idempotencyKey,
      schema: createdSchema,
    }),

  /** `path` is one of stage | negative-outcome | closure | reopening | signature-applicability. */
  command: (
    matterId: string,
    filingId: string,
    path: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`${f(matterId, filingId)}/${path}`, {
      method: 'POST',
      body,
      ifMatch,
      schema: filingDetailSchema,
    }),

  correct: (
    matterId: string,
    filingId: string,
    observationId: string,
    body: Record<string, unknown>,
    ifMatch: string,
  ) =>
    mcRequest(`${f(matterId, filingId)}/observations/${pathId(observationId)}/correction`, {
      method: 'POST',
      body,
      ifMatch,
      schema: filingDetailSchema,
    }),
}
