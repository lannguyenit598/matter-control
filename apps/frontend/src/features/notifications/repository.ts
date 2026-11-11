import 'server-only'

import { z } from 'zod'

import { mcRequest } from '@/lib/mc/client'

import { notificationsPageSchema } from './schemas'

/**
 * The caller's own feed and seen marker. Reads and the seen command both carry the user's own
 * token; the seen command needs no idempotency key because marking seen is safely repeatable.
 */
export const notificationsRepository = {
  list: async (limit: number) =>
    (await mcRequest('/me/notifications', { query: { limit }, schema: notificationsPageSchema }))
      .data,

  markSeen: () =>
    mcRequest('/me/notifications/seen', {
      method: 'POST',
      body: {},
      schema: z.object({ seenAt: z.string() }),
    }),
}
