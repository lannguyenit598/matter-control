import { z } from 'zod'

import { idSchema } from '@/lib/mc/schemas'

// Email capture: one .eml file becomes an immutable document version, and the mail row is the
// readable projection of it. Direction is declared at intake, never inferred from the message.

export const mailDirectionSchema = z.enum(['INBOUND', 'OUTBOUND'])
export type MailDirection = z.infer<typeof mailDirectionSchema>

export const mailItemSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  versionId: idSchema,
  direction: mailDirectionSchema,
  sender: z.string(),
  recipients: z.array(z.string()).catch([]),
  subject: z.string(),
  sentAt: z.string().nullable(),
  excerpt: z.string(),
  createdAt: z.string(),
})
export type MailItem = z.infer<typeof mailItemSchema>

// This matter envelope has no cursor: the panel shows a bounded window, not a walkable archive.
export const mailPageSchema = z.object({
  items: z.array(mailItemSchema),
  page: z.object({ limit: z.number().int(), maxLimit: z.number().int(), total: z.number().int() }),
})

export const mailIntakeResultSchema = z.object({
  documentId: idSchema,
  versionId: idSchema,
  mailId: idSchema,
})
export type MailIntakeResult = z.infer<typeof mailIntakeResultSchema>

export const mailUploadOutcomeSchema = z.discriminatedUnion('ok', [
  mailIntakeResultSchema.extend({ ok: z.literal(true), replayed: z.boolean() }),
  z.object({
    ok: z.literal(false),
    kind: z.enum([
      'validation',
      'unauthenticated',
      'forbidden',
      'not-found',
      'stale',
      'unavailable',
      'outcome-unknown',
      'key-conflict',
      'last-owner',
      'rejected',
      'error',
    ]),
    error: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retrySameKey: z.boolean().optional(),
    requiresReread: z.boolean().optional(),
  }),
])
export type MailUploadOutcome = z.infer<typeof mailUploadOutcomeSchema>

/** Only .eml is accepted at intake, up to 25 MiB; the BFF route mirrors both limits server-side. */
export const MAX_EML_BYTES = 25 * 1024 * 1024

export function isEmlFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.eml')
}
