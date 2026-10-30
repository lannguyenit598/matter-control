import type { Envelope, MilestoneView } from './schemas'

export const AGENDA_SOURCES = ['all', 'work', 'milestone'] as const
export type AgendaSource = (typeof AGENDA_SOURCES)[number]
export const AGENDA_TIMINGS = ['OVERDUE', 'DUE_SOON', 'ON_TRACK'] as const
export type AgendaTiming = (typeof AGENDA_TIMINGS)[number]

export type AgendaQuery = { source: AgendaSource; timing?: AgendaTiming }

/** Untrusted URL state: anything unknown falls back to "no filter". */
export function parseAgendaQuery(raw: Record<string, string | string[] | undefined>): AgendaQuery {
  const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)
  const source = AGENDA_SOURCES.find((s) => s === one(raw.source)) ?? 'all'
  const timing = AGENDA_TIMINGS.find((t) => t === one(raw.timing))
  return timing ? { source, timing } : { source }
}

export type AgendaEntry = {
  key: string
  kind: 'work' | 'milestone'
  title: string
  /** The recorded instant, never a computed deadline. */
  dueAt: string
  /** Where the date comes from. */
  href: string
  /** Server-derived timing for work items; milestones have none and are never given one. */
  timing: AgendaTiming | null
  /** Short, already-worded state, e.g. the execution state or the milestone readiness. */
  state: string
  critical: boolean
}

/**
 * Merges recorded due dates into one list ordered by instant. A timing filter applies to work items
 * only (milestones have no derived timing), so it hides milestones and the page says so.
 */
export function buildAgenda(
  matterId: string,
  work: Envelope[],
  milestones: MilestoneView[],
  query: AgendaQuery,
): AgendaEntry[] {
  const entries: AgendaEntry[] = []
  if (query.source !== 'milestone') {
    for (const e of work) {
      if (!e.item.dueAt) continue
      if (query.timing && e.derived.timing !== query.timing) continue
      entries.push({
        key: `w:${e.item.id}`,
        kind: 'work',
        title: e.item.title,
        dueAt: e.item.dueAt,
        href: `/matters/${matterId}/work/${e.item.id}`,
        timing: e.derived.timing,
        state: e.item.execution,
        critical: e.derived.criticalChain,
      })
    }
  }
  if (query.source !== 'work' && !query.timing) {
    for (const v of milestones) {
      if (!v.milestone.dueAt) continue
      entries.push({
        key: `m:${v.milestone.id}`,
        kind: 'milestone',
        title: v.milestone.name,
        dueAt: v.milestone.dueAt,
        href: `/matters/${matterId}/planning`,
        timing: null,
        state: v.status.state,
        critical: v.milestone.critical,
      })
    }
  }
  return entries.sort(
    (a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.key.localeCompare(b.key),
  )
}

/** The calendar day of an instant in a display zone (YYYY-MM-DD): the same instant can fall on two days. */
export function dayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}
