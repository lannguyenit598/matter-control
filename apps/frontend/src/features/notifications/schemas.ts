import { z } from 'zod'

// Current authorized notifications carry this user's durable acknowledgement state.

export const NOTIFICATION_KINDS = ['OVERDUE', 'BLOCKED', 'DUE_SOON', 'REVIEW_PENDING'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export const notificationItemSchema = z.object({
  id: z.string(),
  seenKey: z.string().regex(/^[0-9a-f]{64}$/),
  seen: z.boolean(),
  kind: z.enum(NOTIFICATION_KINDS),
  matterId: z.string().nullable(),
  matterTitle: z.string().nullable(),
  itemId: z.string().nullable(),
  title: z.string(),
  dueAt: z.string().nullable(),
  createdAt: z.string(),
})
export type NotificationItem = z.infer<typeof notificationItemSchema>

// This /me envelope has no cursor: the feed is a bounded window, not a walkable list.
export const notificationsPageSchema = z.object({
  items: z.array(notificationItemSchema),
  page: z.object({ limit: z.number().int(), maxLimit: z.number().int(), total: z.number().int() }),
  seenAt: z.string().nullable(),
  asOf: z.string(),
})
export type NotificationsPage = z.infer<typeof notificationsPageSchema>

export const notificationKeysSchema = z
  .array(z.string().regex(/^[0-9a-f]{64}$/))
  .max(200)
  .refine((keys) => new Set(keys).size === keys.length)

/** The badge counts unread rows in this digest, not a global archive. */
export function unreadOf(items: NotificationItem[]): number {
  return items.filter((item) => !item.seen).length
}
