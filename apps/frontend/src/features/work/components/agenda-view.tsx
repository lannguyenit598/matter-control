'use client'

import { CalendarDays, Flag } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useLocale } from '@/hooks/use-locale'
import { useTimeZone } from '@/hooks/use-time-zone'
import { withFrom } from '@/lib/mc/paths'

import { dayKey, type AgendaEntry } from '../agenda'

import { ExecutionBadge } from './work-badges'

const TIMING: Record<NonNullable<AgendaEntry['timing']>, { en: string; vi: string }> = {
  OVERDUE: { en: 'Overdue', vi: 'Quá hạn' },
  DUE_SOON: { en: 'Due soon', vi: 'Sắp đến hạn' },
  ON_TRACK: { en: 'On track', vi: 'Đúng hạn' },
}
const MILESTONE_STATE: Record<string, { en: string; vi: string }> = {
  READY: { en: 'Ready', vi: 'Sẵn sàng' },
  NOT_READY: { en: 'Not ready', vi: 'Chưa sẵn sàng' },
  UNASSESSED: { en: 'Not assessed', vi: 'Chưa đánh giá' },
}

/**
 * Read-only agenda: the recorded due dates of this Matter grouped by calendar day in the viewer's
 * display zone. It shows what the records say; it calculates no legal deadline and sends nothing.
 */
export function AgendaView({ entries, here }: { entries: AgendaEntry[]; here: string }) {
  const locale = useLocale()
  const zone = useTimeZone()
  const tag = locale === 'vi' ? 'vi-VN' : 'en-GB'
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title={
          <LocalizedText en="No dated work to show" vi="Không có việc nào có hạn để hiển thị" />
        }
        description={
          <LocalizedText
            en="Nothing in the list that was read has a due date under these filters. Items without a due date are not scheduled and are not listed here."
            vi="Không mục nào trong danh sách đã đọc có hạn với bộ lọc này. Mục chưa có hạn không được lên lịch và không được liệt kê ở đây."
          />
        }
      />
    )
  }
  const days = new Map<string, AgendaEntry[]>()
  for (const e of entries) {
    const k = dayKey(e.dueAt, zone)
    days.set(k, [...(days.get(k) ?? []), e])
  }
  const time = new Intl.DateTimeFormat(tag, {
    timeStyle: 'short',
    timeZone: zone,
    hourCycle: 'h23',
  })
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        <LocalizedText
          en={`Times are shown in your device time zone (${zone}).`}
          vi={`Giờ hiển thị theo múi giờ thiết bị (${zone}).`}
        />
      </p>
      {[...days].map(([day, rows]) => (
        <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
          <h2 id={`day-${day}`} className="text-base font-semibold">
            <time dateTime={day}>
              {new Intl.DateTimeFormat(tag, { dateStyle: 'full', timeZone: 'UTC' }).format(
                new Date(`${day}T00:00:00Z`),
              )}
            </time>
          </h2>
          <ol className="divide-y rounded-lg border bg-card">
            {rows.map((e) => (
              <li key={e.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <time dateTime={e.dueAt} className="w-14 shrink-0 text-sm tabular-nums">
                  {time.format(new Date(e.dueAt))}
                </time>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={withFrom(e.href, here)}
                    className="font-medium break-words underline-offset-2 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {e.kind === 'work' ? (
                      <LocalizedText en="Work item due date" vi="Hạn của công việc" />
                    ) : (
                      <LocalizedText en="Milestone due date" vi="Hạn của cột mốc" />
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {e.critical && (
                    <Badge variant="attention">
                      <Flag aria-hidden className="size-3" />
                      <LocalizedText en="Critical chain" vi="Chuỗi tới hạn" />
                    </Badge>
                  )}
                  {e.timing && e.timing !== 'ON_TRACK' && (
                    <Badge variant="timing">
                      <LocalizedText en={TIMING[e.timing].en} vi={TIMING[e.timing].vi} />
                    </Badge>
                  )}
                  {e.kind === 'work' ? (
                    <ExecutionBadge state={e.state} />
                  ) : (
                    <Badge variant="outline">
                      <LocalizedText
                        en={(MILESTONE_STATE[e.state] ?? { en: e.state }).en}
                        vi={(MILESTONE_STATE[e.state] ?? { vi: e.state }).vi}
                      />
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
