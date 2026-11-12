import { attempt } from '@/lib/mc/errors'

import { unreadOf } from '../schemas'
import { notificationsRepository } from '../repository'

import { BellButton } from './bell-button'

/** One bounded window of the feed; the panel is a digest, not a walkable archive. */
const BELL_LIMIT = 50

/**
 * The shell header's notification bell. A failed read hides the bell (secondary chrome) instead of
 * blocking the shell; the rest of the page is unaffected.
 */
export async function NotificationBell() {
  const read = await attempt(() => notificationsRepository.list(BELL_LIMIT))
  if (!read.ok) return null
  const { items, seenAt } = read.value
  return <BellButton items={items} seenAt={seenAt} unread={unreadOf(items)} />
}
