import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { proofRepository } from '@/features/proof/repository'
import { CellDetail } from '@/features/review/components/cell-detail'
import { CreateGridDialog } from '@/features/review/components/create-grid-dialog'
import { GridStructureButtons } from '@/features/review/components/grid-structure-forms'
import { ReviewFilters } from '@/features/review/components/review-filters'
import { ReviewGridList } from '@/features/review/components/review-grid-list'
import { ReviewAccessProvider } from '@/features/review/components/review-access'
import { ReviewMatrix } from '@/features/review/components/review-matrix'
import { parseCell, parseMatrixFilter } from '@/features/review/matrix'
import { reviewRepository } from '@/features/review/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Reviews' }

const ID = /^[A-Za-z0-9_-]{1,100}$/

export default function ReviewsPage({
  params,
  searchParams,
}: PageProps<'/matters/[matterId]/reviews'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Reviews params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Reviews({
  params,
  searchParams,
}: Pick<PageProps<'/matters/[matterId]/reviews'>, 'params' | 'searchParams'>) {
  const { matterId } = await params
  const raw = await searchParams
  const gridParam = typeof raw.grid === 'string' && ID.test(raw.grid) ? raw.grid : undefined
  const here = `/matters/${encodeURIComponent(matterId)}/reviews`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, grids] = await Promise.all([
      matterRepository.get(matterId),
      reviewRepository.list(matterId),
    ])
    return { role: matter.matter.callerRole, grids }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="reviews" />
  const { role, grids } = read.value
  // The API decides every command; buttons only mirror the role it reported for THIS matter.
  const canWrite = role === 'OWNER' || role === 'EDITOR'
  const header = (
    <PageHeader
      title={<LocalizedText en="Reviews" vi="Rà soát" />}
      description={
        grids.asOf ? (
          <>
            <LocalizedText en="Read at" vi="Đọc lúc" /> <LocalizedInstant iso={grids.asOf} />
          </>
        ) : undefined
      }
    />
  )
  if (!gridParam) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ReviewGridList
          matterId={matterId}
          items={grids.items}
          action={canWrite ? <CreateGridDialog matterId={matterId} /> : undefined}
        />
      </div>
    )
  }

  const gridRead = await attempt(() => reviewRepository.get(matterId, gridParam))
  if (!gridRead.ok) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ReadFailure kind={gridRead.kind} retryHref={`${here}?grid=${gridParam}`} subject="grid" />
        <Link href={here} className="text-sm underline">
          <LocalizedText en="Back to all review grids" vi="Về danh sách bảng rà soát" />
        </Link>
      </div>
    )
  }
  const { view, etag, asOf } = gridRead.value
  const filter = parseMatrixFilter(raw)
  const parsed = parseCell(typeof raw.cell === 'string' ? raw.cell : undefined)
  const cell = parsed

  // Context reads degrade on their own: names fall back to "a former member", history is omitted,
  // and the version picker is empty (and says so) when documents cannot be read.
  const [members, history, docs] = await Promise.all([
    attempt(() => matterRepository.members(matterId)),
    cell
      ? attempt(() =>
          reviewRepository.history(matterId, gridParam, cell.versionId, cell.questionId),
        )
      : Promise.resolve(null),
    canWrite
      ? attempt(async () => {
          const list = await proofRepository.documents(matterId)
          return Promise.all(list.items.map((d) => proofRepository.document(matterId, d.id)))
        })
      : Promise.resolve(null),
  ])
  const names = members.ok
    ? Object.fromEntries(members.value.items.map((m) => [m.userId, m.displayName]))
    : {}
  const inGrid = new Set(view.versions.map((v) => v.versionId))
  const label = (doc: string, no: number, file: string) => `${doc} · v${no} · ${file}`
  const addable = docs?.ok
    ? docs.value.flatMap((d) =>
        d.detail.versions
          .filter((v) => !inGrid.has(v.id))
          .map((v) => ({ id: v.id, label: label(d.detail.document.name, v.no, v.filename) })),
      )
    : []
  const present = view.versions.map((v) => ({
    id: v.versionId,
    label: label(v.documentName, v.no, v.filename),
  }))

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="flex flex-col gap-1">
        <Link href={here} className="text-sm underline">
          <LocalizedText en="All review grids" vi="Tất cả bảng rà soát" />
        </Link>
        <ReviewAccessProvider backHref={here}>
          <h2 className="text-xl font-semibold break-words">{view.name}</h2>
          <p className="text-xs text-muted-foreground">
            <LocalizedText en="As of" vi="Tại thời điểm" />{' '}
            {asOf ? <LocalizedInstant iso={asOf} /> : null}.{' '}
            <LocalizedText
              en="Answers are people's recorded conclusions. They never verify a requirement or complete work."
              vi="Câu trả lời là kết luận do người ghi nhận. Chúng không xác minh yêu cầu hay hoàn tất công việc."
            />
          </p>
          {canWrite && etag && (
            <GridStructureButtons
              matterId={matterId}
              gridId={view.id}
              ifMatch={etag}
              addable={addable}
              present={present}
              questions={view.questions.map((q) => ({ id: q.id, label: q.text }))}
            />
          )}
          {canWrite && docs && !docs.ok && (
            <p role="status" className="text-sm text-muted-foreground">
              <LocalizedText
                en="Documents could not be read, so no version can be added right now."
                vi="Không đọc được tài liệu nên hiện chưa thể thêm phiên bản."
              />
            </p>
          )}
          <ReviewFilters matterId={matterId} gridId={view.id} filter={filter} />
          <ReviewMatrix matterId={matterId} view={view} filter={filter} selected={cell} />
          {cell && (
            <CellDetail
              key={`${cell.versionId}:${cell.questionId}`}
              matterId={matterId}
              view={view}
              cell={cell}
              filter={filter}
              history={history?.ok ? history.value : null}
              names={names}
              canWrite={canWrite}
            />
          )}
        </ReviewAccessProvider>
      </div>
    </div>
  )
}
