import { z } from 'zod'

/** The page envelope every list endpoint returns (contract §2.2). */
export const pageMetaSchema = z.object({
  limit: z.number().int(),
  maxLimit: z.number().int(),
  total: z.number().int().nullable(),
  nextCursor: z.string().nullable(),
})

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), page: pageMetaSchema })
}

export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)
