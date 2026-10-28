import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form'
import { WorkspaceList } from '@/features/workspaces/components/workspace-list'
import { workspaceRepository } from '@/features/workspaces/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Workspaces' }

export default function WorkspacesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<LocalizedText en="Workspaces" vi="Không gian làm việc" />}
        description={
          <LocalizedText
            en="The workspaces you belong to."
            vi="Các không gian làm việc bạn tham gia."
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
    <div className="flex flex-col gap-6">
      <WorkspaceList items={page.items} total={page.page.total} />
      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="New workspace" vi="Không gian làm việc mới" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
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
