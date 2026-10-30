import type { Assigned, MyActions } from './schemas'

export const QUEUES = ['ready', 'waiting', 'blocked', 'history'] as const
export type Queue = (typeof QUEUES)[number]

const KEY = {
  ready: 'next',
  waiting: 'waiting',
  blocked: 'blocked',
  history: 'historical',
} as const satisfies Record<Queue, keyof MyActions>

export type MyWorkQuery = { queue?: string | undefined; item?: string | undefined }

export type MyWorkSelection = {
  queue: Queue
  /** Items of the chosen queue in the server's order; never re-sorted or re-scored here. */
  list: Assigned[]
  index: number
  selected: Assigned | null
  previous: Assigned | null
  next: Assigned | null
  upNext: Assigned[]
  /** Lengths of the lists the API returned. An item may sit in several lists: they never add up to a total. */
  counts: Record<Queue, number>
  /** `moved`: the requested item is now in another queue; `gone`: it is in none of them. */
  notice: 'moved' | 'gone' | null
}

/** The URL is the whole selection state, so a reload, Back or a shared link lands on the same item. */
export function myWorkHref(queue: Queue, itemId?: string): string {
  const params = new URLSearchParams({ queue })
  if (itemId) params.set('item', itemId)
  return `/my-actions?${params.toString()}`
}

export function selectMyWork(actions: MyActions, query: MyWorkQuery): MyWorkSelection {
  const rows = (q: Queue): Assigned[] => actions[KEY[q]]
  const has = (q: Queue, id: string) => rows(q).some((a) => a.item.id === id)

  let queue: Queue =
    QUEUES.find((q) => q === query.queue) ?? QUEUES.find((q) => rows(q).length > 0) ?? 'ready'
  let notice: MyWorkSelection['notice'] = null
  if (query.item && !has(queue, query.item)) {
    const other = QUEUES.find((q) => has(q, query.item!))
    if (other) {
      queue = other
      notice = 'moved'
    } else {
      notice = 'gone'
    }
  }

  const list = rows(queue)
  const found = query.item ? list.findIndex((a) => a.item.id === query.item) : -1
  const index = found >= 0 ? found : list.length > 0 ? 0 : -1
  return {
    queue,
    list,
    index,
    selected: list[index] ?? null,
    previous: list[index - 1] ?? null,
    next: list[index + 1] ?? null,
    upNext: index >= 0 ? list.slice(index + 1, index + 4) : [],
    counts: {
      ready: actions.next.length,
      waiting: actions.waiting.length,
      blocked: actions.blocked.length,
      history: actions.historical.length,
    },
    notice,
  }
}
