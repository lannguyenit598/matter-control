import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  termLinePageSchema,
  termSheetImportResultSchema,
  termSheetPromoteResultSchema,
  termSheetReceiptSchema,
} from './schemas'

const m = (id: string) => `/matters/${pathId(id)}`

export const termSheetRepository = {
  list: async (matterId: string) =>
    (await mcRequest(`${m(matterId)}/term-lines`, { schema: termLinePageSchema })).data,

  import: async (
    matterId: string,
    body: ReadableStream<Uint8Array>,
    contentType: string,
    key: string,
  ) =>
    (
      await mcRequest(`${m(matterId)}/term-lines/import`, {
        method: 'POST',
        raw: { body, contentType },
        idempotencyKey: key,
        schema: termSheetImportResultSchema,
        timeoutMs: 120_000,
      })
    ).data,

  /** Reads (never re-applies) the caller's receipt for `key`; 404 while none is stored. */
  reconcile: async (matterId: string, key: string) =>
    (
      await mcRequest(`${m(matterId)}/operations/${pathId(key)}/reconciliation`, {
        method: 'POST',
        schema: termSheetReceiptSchema,
      })
    ).data,

  promote: (
    matterId: string,
    termLineId: string,
    idempotencyKey: string,
    expectedRevision: number,
  ) =>
    mcRequest(`${m(matterId)}/term-lines/${pathId(termLineId)}/promotion`, {
      method: 'POST',
      body: { expectedRevision },
      idempotencyKey,
      schema: termSheetPromoteResultSchema,
    }),
}
