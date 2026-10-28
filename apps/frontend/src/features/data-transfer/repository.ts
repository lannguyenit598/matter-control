import 'server-only'

import { z } from 'zod'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  bulkPreviewResultSchema,
  bulkRowResultSchema,
  briefResultSchema,
  importPreviewResultSchema,
  importRowResultSchema,
  type BulkPreviewResult,
  type BriefResult,
  type ImportPreviewResult,
} from './schemas'

/**
 * W6 data-operations repository (contract §2.7). Every call is server-only: the
 * browser never sees a bearer token, and UNKNOWN rows surface as UNKNOWN, never as
 * success or failure.
 */
export const dataTransferRepository = {
  authorizeRecovery: async (matterId: string) =>
    mcRequest(`/matters/${pathId(matterId)}`, { schema: z.object({ id: z.string() }) }),
  bulkPreview: async (
    matterId: string,
    rows: Array<{
      rowKey: string
      itemId: string
      expectedRevision: number
      title?: string
      description?: string
      internalOwner?: string
      due?: string
    }>,
  ): Promise<BulkPreviewResult> => {
    const res = await mcRequest(`/matters/${pathId(matterId)}/bulk/preview`, {
      method: 'POST',
      body: { rows },
      schema: bulkPreviewResultSchema,
    })
    return res.data
  },

  bulkCommit: async (
    matterId: string,
    attemptKey: string,
    rows: Array<{
      rowKey: string
      idempotencyKey: string
      itemId: string
      expectedRevision: number
      title?: string
      description?: string
      internalOwner?: string
      due?: string
    }>,
  ) => {
    const res = await mcRequest(`/matters/${pathId(matterId)}/bulk/commit`, {
      method: 'POST',
      body: { attemptKey, rows },
      receiptedInBody: true,
      schema: bulkRowResultSchema.array(),
    })
    return res.data
  },

  importPreview: async (
    matterId: string,
    upload: { sourceName: string; format: string; content: Uint8Array },
  ): Promise<ImportPreviewResult> => {
    const form = new FormData()
    form.set('file', new Blob([upload.content as BlobPart]), upload.sourceName)
    form.set('sourceName', upload.sourceName)
    form.set('format', upload.format)
    const res = await mcRequest(`/matters/${pathId(matterId)}/import/preview`, {
      method: 'POST',
      raw: { body: form, contentType: 'multipart/form-data' },
      schema: importPreviewResultSchema,
    })
    return res.data
  },

  importCommit: async (
    matterId: string,
    upload: { sourceName: string; format: string; content: Uint8Array },
    plan: { runKey: string; rowKeys: Record<string, string> },
  ) => {
    const form = new FormData()
    form.set('file', new Blob([upload.content as BlobPart]), upload.sourceName)
    form.set('sourceName', upload.sourceName)
    form.set('format', upload.format)
    form.set('plan', JSON.stringify(plan))
    const res = await mcRequest(`/matters/${pathId(matterId)}/import/commit`, {
      method: 'POST',
      raw: { body: form, contentType: 'multipart/form-data' },
      receiptedInBody: true,
      schema: importRowResultSchema.array(),
    })
    return res.data
  },

  brief: async (matterId: string, t1: string, t2: string): Promise<BriefResult> => {
    const res = await mcRequest(`/matters/${pathId(matterId)}/brief`, {
      query: { t1, t2 },
      schema: briefResultSchema,
    })
    return res.data
  },
}
