import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form'
import { WorkspaceList } from '@/features/workspaces/components/workspace-list'
import { workspaceRepository } from '@/features/workspaces/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Matters' }

export default function WorkspacesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Matters" vi="Hồ sơ" />}
        description={
          <LocalizedText
            en="Choose a workspace, then open one of its matters or create a new one."
            vi="Chọn không gian làm việc, rồi mở một hồ sơ của nó hoặc tạo hồ sơ mới."
          />
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <Workspaces />
      </Suspense>
    </div>
  )
}

async function Workspaces() {
  // Request-time data first, so the session check is never evaluated (or baked in) at build time.
  await connection()
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref="/workspaces" />
  const read = await attempt(() => workspaceRepository.listMine())
  if (!read.ok)
    return <ReadFailure kind={read.kind} retryHref="/workspaces" subject="workspace list" />
  const page = read.value
  return (
    <WorkspaceList items={page.items} total={page.page.total} action={<CreateWorkspaceForm />} />
  )
}

function ListSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <span className="sr-only">
        <LocalizedText en="Loading workspaces…" vi="Đang tải không gian làm việc…" />
      </span>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
