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
import { parseAgendaQuery } from '@/features/work/agenda'
import { myAgendaEntries, parseAgendaDay } from '@/features/work/my-agenda'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'
import { pageMetadata } from '@/lib/page-metadata'

export const generateMetadata = pageMetadata('My Agenda', 'Lịch của tôi')

export default function MyAgendaPage({ searchParams }: PageProps<'/agenda'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MyAgenda searchParams={searchParams} />
    </Suspense>
  )
}

/**
 * My Agenda (RLF-03): every recorded due date across the Matters the caller can access, read as
 * ONE authorized aggregate (`GET /me/agenda`) — the server rechecks authorization for every
 * page, and the UI never enumerates Matters. Dates are recorded dates only: no legal deadline
 * is computed, nothing is scheduled, and no reminder is sent.
 */
async function MyAgenda({ searchParams }: Pick<PageProps<'/agenda'>, 'searchParams'>) {
  const raw = await searchParams
  const query = parseAgendaQuery(raw)
  const from = parseAgendaDay(raw.from)
  const until = parseAgendaDay(raw.until)
  const here = '/agenda'
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => workRepository.meAgenda({ from, until }))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="agenda" />
  const { items, truncated, asOf } = read.value
  const entries = myAgendaEntries(items, query)
  const qs = new URLSearchParams()
  if (query.source !== 'all') qs.set('source', query.source)
  if (query.timing) qs.set('timing', query.timing)
  if (from) qs.set('from', from)
  if (until) qs.set('until', until)
  const here2 = qs.size ? `${here}?${qs}` : here
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="My Agenda" vi="Lịch của tôi" />}
        description={
          <LocalizedText
            en="Recorded due dates of all Matters you can access, in date order. Read-only: no legal deadline is calculated and no reminder is sent."
            vi="Các hạn đã ghi của mọi hồ sơ bạn có quyền truy cập, theo thứ tự ngày. Chỉ đọc: hệ thống không tính hạn pháp lý và không gửi nhắc nhở."
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
      {(from || until) && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en={`Showing recorded due dates from ${from ?? 'the beginning'} through ${until ?? 'today and later'}.`}
            vi={`Hiển thị các hạn đã ghi từ ${from ?? 'đầu'} đến ${until ?? 'hôm nay và sau đó'}.`}
          />
        </p>
      )}
      {truncated && (
        <Alert>
          <LocalizedText
            en="Only the first 2,000 dated records were read. More records exist, so later dates may be missing from this agenda."
            vi="Mới đọc 2.000 bản ghi có hạn đầu tiên. Còn thêm bản ghi, nên các ngày sau có thể chưa hiển thị trong lịch này."
          />{' '}
          <LocalizedText
            en="Narrow the date range with from/until URL parameters."
            vi="Thu hẹp khoảng ngày bằng tham số from/until trên URL."
          />
        </Alert>
      )}
      <AgendaView entries={entries} here={here2} />
      {asOf && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText en="Read at" vi="Đọc lúc" /> <LocalizedInstant iso={asOf} />
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <LocalizedText
          en="This agenda reads the records you are authorized for at the moment you open it. A Matter whose access is revoked stops appearing immediately."
          vi="Lịch này đọc các bản ghi bạn được phép xem tại thời điểm mở. Hồ sơ bị thu hồi quyền sẽ không còn xuất hiện ngay lập tức."
        />{' '}
        <Link className="underline" href="/matters">
          <LocalizedText en="Open Matters" vi="Mở Hồ sơ" />
        </Link>
      </p>
    </div>
  )
}
