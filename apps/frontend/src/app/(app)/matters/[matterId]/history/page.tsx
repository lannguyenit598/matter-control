import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PageHeader } from '@/components/molecules/page-header'
import { Skeleton } from '@/components/atoms/skeleton'
import { ReadFailure } from '@/components/organisms/read-failure'
import { MatterHistory } from '@/features/matters/components/matter-history'
import { MatterTabs } from '@/features/matters/components/matter-tabs'
import { matterRepository } from '@/features/matters/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Matter history' }

export default function HistoryPage(props: PageProps<'/matters/[matterId]/history'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <History {...props} />
    </Suspense>
  )
}

async function History({ params, searchParams }: PageProps<'/matters/[matterId]/history'>) {
  const { matterId } = await params
  const query = await searchParams
  const cursor =
    typeof query.cursor === 'string' && query.cursor.length <= 2000 ? query.cursor : undefined
  const here = `/matters/${encodeURIComponent(matterId)}/history`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => matterRepository.history(matterId, cursor))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="history" />
  const history = read.value
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Matter history" vi="Lịch sử hồ sơ" />}
        description={
          <LocalizedText
            en="Recorded changes and their provenance."
            vi="Các thay đổi đã ghi nhận và nguồn gốc của chúng."
          />
        }
      />
      <MatterTabs matterId={matterId} active="history" />
      <MatterHistory
        events={history.items}
        asOf={history.asOf}
        firstHref={cursor ? here : undefined}
        nextHref={
          history.page.nextCursor
            ? `${here}?cursor=${encodeURIComponent(history.page.nextCursor)}`
            : null
        }
      />
    </div>
  )
}
