import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { MyActionsView } from '@/features/work/components/my-actions-view'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'My Actions' }

export default function MyActionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="My Actions" vi="Việc của tôi" />}
        description={
          <LocalizedText
            en="Work assigned to you in the matters you can access. Only ready Actions are recommended."
            vi="Công việc được giao trong các hồ sơ bạn được truy cập. Chỉ các hành động sẵn sàng mới được đề xuất."
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <MyActions />
      </Suspense>
    </div>
  )
}

async function MyActions() {
  await connection()
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref="/my-actions" />
  const read = await attempt(() => workRepository.myActions())
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref="/my-actions" subject="list" />
  return (
    <div className="flex flex-col gap-2">
      {read.value.asOf && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText en="Read at" vi="Đọc lúc" /> {read.value.asOf}
        </p>
      )}
      <MyActionsView actions={read.value.actions} />
    </div>
  )
}
