import { z } from 'zod'

import { idSchema, pageMetaSchema } from '@/lib/mc/schemas'

// RLF-07: matter-scoped versioned guidance. Drafts append; only the matter OWNER publishes an
// immutable revision. Guidance never satisfies criteria and never changes legal state.

export const guidanceSourceRefSchema = z.object({
  versionId: z.string().max(100).optional().catch(undefined),
  reference: z.string().max(500).optional().catch(undefined),
  note: z.string().max(500).optional().catch(undefined),
})
export type GuidanceSourceRef = z.infer<typeof guidanceSourceRefSchema>

export const guidanceRevisionSchema = z.object({
  id: z.string(),
  no: z.number().int(),
  body: z.string(),
  sourceRefs: z.array(guidanceSourceRefSchema).catch([]),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  createdAt: z.string(),
})
export type GuidanceRevision = z.infer<typeof guidanceRevisionSchema>

export const guidanceDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  revisions: z.array(guidanceRevisionSchema),
})
export type GuidanceDoc = z.infer<typeof guidanceDocSchema>
export const guidancePageSchema = z.object({
  items: z.array(guidanceDocSchema),
  page: pageMetaSchema,
})

const key = z.string().min(1).max(100)

export const createGuidanceInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(20000),
  sourceRefs: z.array(guidanceSourceRefSchema).max(20).optional().catch([]),
})

export const addGuidanceDraftInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  documentId: idSchema,
  body: z.string().trim().min(1).max(20000),
  sourceRefs: z.array(guidanceSourceRefSchema).max(20).optional().catch([]),
})

export const publishGuidanceInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  documentId: idSchema,
  revisionId: idSchema,
})
