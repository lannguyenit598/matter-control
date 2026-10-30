import Link from 'next/link'
import { CalendarDays, Clock3, Flag, ListTodo } from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

import {
  AGENDA_SOURCES,
  AGENDA_TIMINGS,
  type AgendaQuery,
  type AgendaSource,
  type AgendaTiming,
} from '../agenda'

const SOURCE: Record<AgendaSource, { en: string; vi: string }> = {
  all: { en: 'All dates', vi: 'Tất cả' },
  work: { en: 'Work items', vi: 'Công việc' },
  milestone: { en: 'Milestones', vi: 'Cột mốc' },
}
const TIMING: Record<AgendaTiming, { en: string; vi: string }> = {
  OVERDUE: { en: 'Overdue', vi: 'Quá hạn' },
  DUE_SOON: { en: 'Due soon', vi: 'Sắp đến hạn' },
  ON_TRACK: { en: 'On track', vi: 'Đúng hạn' },
}
const SOURCE_ICON = { all: CalendarDays, work: ListTodo, milestone: Flag }

/** Filters are plain links: the URL is the whole state, so a reload or shared link keeps them. */
export function AgendaFilters({ basePath, query }: { basePath: string; query: AgendaQuery }) {
  const href = (next: Partial<AgendaQuery> & { timing?: AgendaTiming | undefined }) => {
    const merged = { ...query, ...next }
    const qs = new URLSearchParams()
    if (merged.source !== 'all') qs.set('source', merged.source)
    if (merged.timing) qs.set('timing', merged.timing)
    return qs.size ? `${basePath}?${qs}` : basePath
  }
  const chip = (active: boolean) =>
    cn(
      'control-target inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm',
      active ? 'border-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:bg-accent',
    )
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Agenda source" className="flex flex-wrap gap-2">
        {AGENDA_SOURCES.map((s) => {
          const Icon = SOURCE_ICON[s]
          return (
            <Link
              key={s}
              href={href({ source: s })}
              aria-current={s === query.source ? 'true' : undefined}
              className={chip(s === query.source)}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <LocalizedText en={SOURCE[s].en} vi={SOURCE[s].vi} />
            </Link>
          )
        })}
      </nav>
      <nav aria-label="Agenda timing" className="flex flex-wrap gap-2">
        <Link
          href={href({ timing: undefined })}
          aria-current={!query.timing ? 'true' : undefined}
          className={chip(!query.timing)}
        >
          <Clock3 aria-hidden className="size-4 shrink-0" />
          <LocalizedText en="Any timing" vi="Mọi thời hạn" />
        </Link>
        {AGENDA_TIMINGS.map((t) => (
          <Link
            key={t}
            href={href({ timing: t })}
            aria-current={t === query.timing ? 'true' : undefined}
            className={chip(t === query.timing)}
          >
            <Clock3 aria-hidden className="size-4 shrink-0" />
            <LocalizedText en={TIMING[t].en} vi={TIMING[t].vi} />
          </Link>
        ))}
      </nav>
    </div>
  )
}
