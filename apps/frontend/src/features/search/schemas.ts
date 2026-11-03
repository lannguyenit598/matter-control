import { z } from 'zod'
import { idSchema } from '@/lib/mc/schemas'

export const GROUPS = ['workspaces', 'matters', 'workItems', 'documents'] as const
export type SearchGroupName = (typeof GROUPS)[number]
const group = z.enum(GROUPS)
const query = z
  .string()
  .refine((q) => !/[\u0000-\u001f\u007f-\u009f]/.test(q), 'Control characters are not allowed')
  .trim()
  .refine((q) => [...q].length >= 2 && [...q].length <= 100, 'Enter 2–100 characters')
export const searchInputSchema = z
  .object({
    q: query,
    epoch: z.string().regex(/^[a-f0-9]{24}$/),
    types: z
      .array(group)
      .min(1)
      .max(4)
      .refine((t) => new Set(t).size === t.length)
      .optional(),
    matterId: idSchema.optional(),
    limit: z.number().int().min(1).max(25).optional(),
    cursors: z.partialRecord(group, z.string().max(2048)).optional(),
  })
  .strict()
export type SearchInput = z.infer<typeof searchInputSchema>
export const resultSchema = z
  .object({
    sameName: z.boolean(),
    id: idSchema,
    kind: z.enum(['WORKSPACE', 'MATTER', 'ACTION', 'REQUIREMENT', 'FILING', 'DOCUMENT']),
    label: z.string(),
    workspaceId: idSchema,
    workspaceName: z.string(),
    matterId: z.union([idSchema, z.literal('')]),
    matterTitle: z.string(),
    role: z.string(),
    outcome: z.string(),
    execution: z.string(),
    dueAt: z.iso.datetime({ offset: true }).nullable(),
    version: z.number().int().nonnegative(),
    uploadedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .refine((row) => row.kind === 'WORKSPACE' || row.matterId !== '')
export type SearchItem = z.infer<typeof resultSchema>
export const searchGroupSchema = z.object({
  status: z.enum(['ok', 'unavailable', 'stale']),
  items: z.array(resultSchema).max(25),
  hasMore: z.boolean(),
  nextCursor: z.string().max(2048),
  asOf: z.iso.datetime({ offset: true }),
})
export const searchResponseSchema = z.object({ groups: z.partialRecord(group, searchGroupSchema) })
export type SearchResponse = z.infer<typeof searchResponseSchema>

export function resultHref(row: SearchItem) {
  const checked = resultSchema.parse(row)
  if (checked.kind === 'WORKSPACE') return `/workspaces/${checked.id}`
  if (checked.kind === 'MATTER') return `/matters/${checked.id}`
  return `/matters/${checked.matterId}/${checked.kind === 'DOCUMENT' ? 'documents' : 'work'}/${checked.id}`
}
