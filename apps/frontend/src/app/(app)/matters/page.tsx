import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { MatterDiscovery } from '@/features/matters/components/matter-discovery'
import { matterRepository } from '@/features/matters/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Matters' }

const first = (v: string | string[] | undefined, max: number) =>
  typeof v === 'string' && v.length <= max ? v : ''

export default function MattersPage({ searchParams }: PageProps<'/matters'>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Matters" vi="Hồ sơ" />}
        description={
          <LocalizedText
            en="Find a matter by name across all your workspaces. Workspaces and their members are managed separately."
            vi="Tìm hồ sơ theo tên trong mọi không gian làm việc của bạn. Không gian làm việc và thành viên được quản lý riêng."
          />
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Matters searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function Matters({ searchParams }: Pick<PageProps<'/matters'>, 'searchParams'>) {
  const raw = await searchParams
  await connection()
  const q = first(raw.q, 100).trim()
  const cursor = first(raw.cursor, 400) || undefined
  const here = q ? `/matters?q=${encodeURIComponent(q)}` : '/matters'
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => matterRepository.discover(q, cursor))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter list" />
  const page = read.value
  const params = (c?: string) => {
    const s = new URLSearchParams()
    if (q) s.set('q', q)
    if (c) s.set('cursor', c)
    const qs = s.toString()
    return qs ? `/matters?${qs}` : '/matters'
  }
  return (
    <MatterDiscovery
      query={q}
      items={page.items}
      total={page.page.total}
      nextHref={page.page.nextCursor ? params(page.page.nextCursor) : null}
      firstHref={cursor ? params() : null}
    />
  )
}
