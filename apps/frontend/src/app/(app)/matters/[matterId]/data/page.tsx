import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { DataTransferPanel } from '@/features/data-transfer/components/data-transfer-panel'
import { matterRepository } from '@/features/matters/repository'
import { workRepository } from '@/features/work/repository'
import { attempt } from '@/lib/mc/errors'
import { ReadFailure } from '@/components/organisms/read-failure'

export const metadata: Metadata = { title: 'Data' }

export default function DataPage({ params }: PageProps<'/matters/[matterId]/data'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Data params={params} />
    </Suspense>
  )
}

async function Data({ params }: Pick<PageProps<'/matters/[matterId]/data'>, 'params'>) {
  const { matterId } = await params
  const choices = await attempt(async () => {
    const members = await matterRepository.members(matterId)
    const items: { id: string; title: string; revision: number }[] = []
    let cursor: string | undefined
    do {
      const { page } = await workRepository.list(matterId, { cursor }, 200)
      items.push(
        ...page.items.map(({ item }) => ({
          id: item.id,
          title: item.title,
          revision: item.revision,
        })),
      )
      cursor = page.page.nextCursor ?? undefined
    } while (cursor)
    return { members: members.items, items }
  })
  if (!choices.ok)
    return (
      <ReadFailure kind={choices.kind} retryHref={`/matters/${matterId}/data`} subject="matter" />
    )
  return (
    <>
      <PageHeader
        title={<LocalizedText en="Data" vi="Dữ liệu" />}
        description={
          <LocalizedText
            en="Bulk edit, import, export and delta brief for this matter."
            vi="Sửa hàng loạt, nhập/xuất dữ liệu và báo cáo thay đổi của hồ sơ này."
          />
        }
      />
      <DataTransferPanel matterId={matterId} {...choices.value} />
    </>
  )
}
