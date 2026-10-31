import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { ReviewQueue } from '@/features/proof/components/review-queue'
import { proofRepository } from '@/features/proof/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Reviews due' }

export default function MyReviewsPage({ searchParams }: PageProps<'/my-reviews'>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Reviews due" vi="Cần xác minh" />}
        description={
          <LocalizedText
            en="Evidence others have offered that you can decide on as a designated, independent verifier. This is not your assigned work."
            vi="Bằng chứng người khác cung cấp mà bạn có thể quyết định với tư cách người xác minh độc lập được chỉ định. Đây không phải việc được giao cho bạn."
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Reviews searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function Reviews({ searchParams }: Pick<PageProps<'/my-reviews'>, 'searchParams'>) {
  const raw = await searchParams
  await connection()
  const cursor = typeof raw.cursor === 'string' && raw.cursor.length <= 400 ? raw.cursor : undefined
  const here = cursor ? `/my-reviews?cursor=${encodeURIComponent(cursor)}` : '/my-reviews'
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => proofRepository.reviewQueue(cursor))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="review list" />
  const page = read.value
  return (
    <div className="flex flex-col gap-3">
      <ReviewQueue
        items={page.items}
        total={page.page.total}
        here={here}
        nextHref={
          page.page.nextCursor
            ? `/my-reviews?cursor=${encodeURIComponent(page.page.nextCursor)}`
            : null
        }
        firstHref={cursor ? '/my-reviews' : null}
      />
    </div>
  )
}
