import { z } from 'zod'

// The caller's own notification feed. Unread is computed, not stored on items: an item is unread
// while createdAt > seenAt, and a null seenAt means everything is unread (first visit).

export const NOTIFICATION_KINDS = ['OVERDUE', 'BLOCKED', 'DUE_SOON', 'REVIEW_PENDING'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export const notificationItemSchema = z.object({
  id: z.string(),
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

/** Unread items of one page against the seen marker; the badge caps the display, not this count. */
export function unreadOf(items: NotificationItem[], seenAt: string | null): number {
  if (seenAt === null) return items.length
  const seen = Date.parse(seenAt)
  return items.filter((item) => Date.parse(item.createdAt) > seen).length
}
