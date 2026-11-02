import { z } from 'zod'

export const uiSessionSchema = z
  .object({
    principalKey: z.string().regex(/^[a-f0-9]{64}$/),
    epoch: z.string().regex(/^[a-f0-9]{24}$/),
    validUntil: z.iso.datetime(),
  })
  .strict()
export type UiSession = z.infer<typeof uiSessionSchema>
