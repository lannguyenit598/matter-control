import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { Alert } from '@/components/molecules/alert'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { AgendaFilters } from '@/features/work/components/agenda-filters'
import { AgendaView } from '@/features/work/components/agenda-view'
import { buildAgenda, parseAgendaQuery } from '@/features/work/agenda'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Agenda' }

export default function AgendaPage({
  params,
  searchParams,
}: PageProps<'/matters/[matterId]/agenda'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Agenda params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Agenda({
  params,
  searchParams,
}: Pick<PageProps<'/matters/[matterId]/agenda'>, 'params' | 'searchParams'>) {
  const { matterId } = await params
  const query = parseAgendaQuery(await searchParams)
  const here = `/matters/${encodeURIComponent(matterId)}/agenda`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  // Two bounded reads of existing read models: work items in the server's due-date order (one
  // page) and the milestones page. Neither is a complete calendar, and the page says so.
  const read = await attempt(async () => {
    const [work, milestones] = await Promise.all([
      query.source === 'milestone'
        ? null
        : workRepository.list(matterId, { sort: 'due', timing: query.timing }, 200),
      query.source === 'work' ? null : workRepository.milestones(matterId),
    ])
    return { work, milestones }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="agenda" />
  const { work, milestones } = read.value
  const entries = buildAgenda(matterId, work?.page.items ?? [], milestones?.items ?? [], query)
  const more = Boolean(work?.page.page.nextCursor || milestones?.page.nextCursor)
  const qs = new URLSearchParams()
  if (query.source !== 'all') qs.set('source', query.source)
  if (query.timing) qs.set('timing', query.timing)
  const here2 = qs.size ? `${here}?${qs}` : here
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Agenda" vi="Lịch công việc" />}
        description={
          <LocalizedText
            en="Recorded due dates of this matter, in date order. Read-only: no legal deadline is calculated and no reminder is sent."
            vi="Các hạn đã ghi của hồ sơ này, theo thứ tự ngày. Chỉ đọc: hệ thống không tính hạn pháp lý và không gửi nhắc nhở."
          />
        }
      />
      <AgendaFilters basePath={here} query={query} />
      {query.timing && query.source !== 'work' && (
        <Alert>
          <LocalizedText
            en="A timing filter applies to work items only: milestones have no derived timing and are hidden while it is on."
            vi="Bộ lọc thời hạn chỉ áp dụng cho công việc: cột mốc không có thời hạn suy ra nên bị ẩn khi bật bộ lọc."
          />
        </Alert>
      )}
      {more && (
        <Alert>
          <LocalizedText
            en="Only the first page of records was read. More records exist, so later dates may be missing from this agenda."
            vi="Mới đọc trang đầu của dữ liệu. Còn thêm bản ghi, nên các ngày sau có thể chưa hiển thị trong lịch này."
          />{' '}
          <Link className="underline" href={`/matters/${encodeURIComponent(matterId)}/work`}>
            <LocalizedText en="Open the full Work grid" vi="Mở bảng Công việc đầy đủ" />
          </Link>
        </Alert>
      )}
      <AgendaView entries={entries} here={here2} />
      {(work?.asOf ?? milestones === null) && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText en="Read at" vi="Đọc lúc" />{' '}
          {work?.asOf && <LocalizedInstant iso={work.asOf} />}
        </p>
      )}
    </div>
  )
}
