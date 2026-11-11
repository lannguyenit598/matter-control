import 'server-only'

import { mcRequest, pathId } from '@/lib/mc/client'

import { mailIntakeResultSchema, mailPageSchema, type MailDirection } from './schemas'

/** Matter mail reads and the raw .eml intake command. Every call carries the user's own token. */
export const mailRepository = {
  list: async (matterId: string) =>
    (await mcRequest(`/matters/${pathId(matterId)}/mail`, { schema: mailPageSchema })).data,

  /**
   * Intake of one captured email. The bytes stream to the API untouched as the raw message (no
   * filename header: the API defaults to message.eml); direction travels as a query flag because
   * the body is the message itself.
   */
  intake: (matterId: string, file: File, direction: MailDirection, idempotencyKey: string) =>
    mcRequest(`/matters/${pathId(matterId)}/mail-intake`, {
      method: 'POST',
      query: { direction },
      raw: { body: file.stream(), contentType: 'message/rfc822' },
      idempotencyKey,
      schema: mailIntakeResultSchema,
      timeoutMs: 330_000,
    }),
}
