import type { ControlRoom } from './schemas'

/**
 * Display labels for a Control Room come from the room's own snapshot only: the titles it returns
 * for the records it refers to, completed by the rows it returned. A title read from any other
 * request could belong to a later moment than the figures it labels (F04).
 */
export function roomTitles(room: ControlRoom): Record<string, string> {
  const titles: Record<string, string> = { ...room.titles }
  for (const row of [...room.blockers, ...room.nextActions, ...room.waiting])
    titles[row.item.id] = row.item.title
  for (const b of room.blockers) for (const u of b.upstream) titles[u.id] = u.title
  return titles
}
