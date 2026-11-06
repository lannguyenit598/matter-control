import { z } from 'zod'

import { pageOf } from '@/lib/mc/schemas'

export const TERM_FIELDS = [
  'PARTY',
  'EFFECTIVE_DATE',
  'RENEWAL_DATE',
  'NOTICE_PERIOD',
  'VALUE_AMOUNT',
  'VALUE_CURRENCY',
  'GOVERNING_LAW',
  'NOTE',
] as const
export type TermField = (typeof TERM_FIELDS)[number]

/** One contract term line: a typed fact with its source pin and (maybe) its promotion link. */
export const termLineSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  documentVersionId: z.string(),
  field: z.enum(TERM_FIELDS),
  valueText: z.string().nullable(),
  valueDate: z.string().nullable(),
  rowKey: z.string(),
  sourceHash: z.string(),
  promotedRef: z.string().optional().default(''),
  promotedKind: z.string().optional().default(''),
  updatedAt: z.string(),
  revision: z.number().int(),
})
export type TermLine = z.infer<typeof termLineSchema>

export const termLinePageSchema = pageOf(termLineSchema).extend({
  matterRevision: z.number().int().positive(),
})

/**
 * The client projection of one term line: only what the panel renders or sends back (id,
 * revision for the CAS, the promotion link). Matter id travels once as a prop, never per line,
 * and rowKey/updatedAt never cross the serialization boundary (server-dedup-props).
 */
export type TermSheetLine = Pick<
  TermLine,
  | 'id'
  | 'documentVersionId'
  | 'field'
  | 'valueText'
  | 'valueDate'
  | 'sourceHash'
  | 'promotedRef'
  | 'promotedKind'
  | 'revision'
>

/** Server-side projection from the API shape to the client shape. */
export const toSheetLine = (line: TermLine): TermSheetLine => ({
  id: line.id,
  documentVersionId: line.documentVersionId,
  field: line.field,
  valueText: line.valueText,
  valueDate: line.valueDate,
  sourceHash: line.sourceHash,
  promotedRef: line.promotedRef,
  promotedKind: line.promotedKind,
  revision: line.revision,
})

export const termSheetImportResultSchema = z.object({
  documentVersionId: z.string(),
  created: z.number().int(),
  replaced: z.number().int(),
  unchanged: z.number().int(),
  replayed: z.boolean(),
  rejected: z.array(z.object({ rowKey: z.string(), code: z.string(), detail: z.string() })),
})
export type TermSheetImportResult = z.infer<typeof termSheetImportResultSchema>

export const termSheetPromoteResultSchema = z.object({
  termLineId: z.string(),
  targetId: z.string(),
  targetMissing: z.boolean().default(false),
  targetKind: z.enum(['context_record', 'milestone', 'action', 'requirement']),
  replayed: z.boolean(),
})
