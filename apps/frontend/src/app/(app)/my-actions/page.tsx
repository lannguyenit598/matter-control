import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { MyActionsView } from '@/features/work/components/my-actions-view'
import { selectMyWork } from '@/features/work/my-work-selection'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'My Work' }

export default function MyActionsPage({ searchParams }: PageProps<'/my-actions'>) {
  return (
    <div className="my-work-page flex flex-col">
      <PageHeader
        title={<LocalizedText en="My work" vi="Việc của tôi" />}
        description={
          <LocalizedText
            en="One task at a time, with the context you need. Only ready Actions are recommended."
            vi="Mỗi lần một việc, kèm bối cảnh bạn cần. Chỉ các hành động sẵn sàng mới được đề xuất."
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <MyActions searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

const param = (v: string | string[] | undefined) =>
  typeof v === 'string' && v.length <= 100 ? v : undefined

async function MyActions({ searchParams }: Pick<PageProps<'/my-actions'>, 'searchParams'>) {
  const query = await searchParams
  await connection()
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref="/my-actions" />
  const read = await attempt(() => workRepository.myActions())
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref="/my-actions" subject="list" />
  const selection = selectMyWork(read.value.actions, {
    queue: param(query.queue),
    item: param(query.item),
  })
  // Bounded, authorized, server-side: the selected item's detail and the names of the (at most
  // four) Matters on screen. A failed read leaves the name or cause out; it is never replaced by an
  // id. A name field on /me/actions would remove these calls (docs/testing/.../backend-requests.md).
  const shown = [selection.selected, ...selection.upNext].filter((a) => a !== null)
  const matterIds = [...new Set(shown.map((a) => a.matterId))]
  const [detail, names] = await Promise.all([
    selection.selected
      ? attempt(() => workRepository.get(selection.selected!.matterId, selection.selected!.item.id))
      : null,
    Promise.all(matterIds.map((id) => attempt(() => matterRepository.get(id)))),
  ])
  const matterNames = Object.fromEntries(
    matterIds.flatMap((id, i) => {
      const r = names[i]
      return r?.ok ? [[id, r.value.matter.title]] : []
    }),
  )
  return (
    <div className="flex flex-1 flex-col">
      <MyActionsView
        selection={selection}
        matterNames={matterNames}
        detail={detail?.ok ? detail.value.detail : null}
      />
      {read.value.asOf && (
        <p className="work-read-at text-xs text-muted-foreground">
          <LocalizedText en="Read at" vi="Đọc lúc" /> <LocalizedInstant iso={read.value.asOf} />
        </p>
      )}
    </div>
  )
}
