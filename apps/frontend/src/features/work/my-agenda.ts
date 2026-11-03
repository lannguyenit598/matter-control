import { AGENDA_TIMINGS, type AgendaEntry, type AgendaQuery } from './agenda'
import type { agendaRowSchema } from './schemas'

import type { z } from 'zod'

export type AgendaRow = z.infer<typeof agendaRowSchema>

/**
 * Untrusted URL date bound: only a strict YYYY-MM-DD day is accepted, anything else means "no
 * bound". The API re-validates and rejects anything unsafe, and every bound applies to recorded
 * due dates only — no deadline is ever computed.
 */
export function parseAgendaDay(raw: string | string[] | undefined): string | undefined {
  const one = typeof raw === 'string' ? raw : undefined
  return one && /^\d{4}-\d{2}-\d{2}$/.test(one) ? one : undefined
}

/**
 * Maps the authorized cross-Matter rows (RLF-03) onto the shared agenda entry shape. The same
 * source/timing filters as a Matter agenda apply here: a timing filter hides milestones (they
 * have no derived timing) and never becomes one. Timing comes from the server's read snapshot;
 * nothing is re-derived on the client.
 */
export function myAgendaEntries(rows: AgendaRow[], query: AgendaQuery): AgendaEntry[] {
  const entries: AgendaEntry[] = []
  for (const r of rows) {
    if (query.source === 'work' && r.kind !== 'work') continue
    if (query.source === 'milestone' && r.kind !== 'milestone') continue
    if (query.timing && (r.kind !== 'work' || !AGENDA_TIMINGS.includes(r.timing as never))) continue
    if (query.timing && r.timing !== query.timing) continue
    entries.push({
      key: `${r.kind === 'work' ? 'w' : 'm'}:${r.matterId}:${r.itemId}`,
      kind: r.kind,
      title: r.title,
      matterName: r.matterTitle,
      dueAt: r.dueAt,
      href:
        r.kind === 'work'
          ? `/matters/${r.matterId}/work/${r.itemId}`
          : `/matters/${r.matterId}/planning`,
      timing:
        r.kind === 'work' && AGENDA_TIMINGS.includes(r.timing as never)
          ? (r.timing as AgendaEntry['timing'])
          : null,
      state: r.kind === 'work' ? r.execution : r.readiness,
      critical: r.critical,
    })
  }
  return entries.sort(
    (a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.key.localeCompare(b.key),
  )
}
