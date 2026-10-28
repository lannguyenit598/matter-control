import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CreateMatterForm } from '@/features/matters/components/create-matter-form'
import { MatterList } from '@/features/matters/components/matter-list'
import { matterRepository } from '@/features/matters/repository'
import { WorkspaceMembers } from '@/features/workspaces/components/workspace-members'
import { workspaceRepository } from '@/features/workspaces/repository'
import { getSession } from '@/lib/auth'
import { attempt, McError } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Workspace' }

export default function WorkspacePage({ params }: PageProps<'/workspaces/[workspaceId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Workspace params={params} />
    </Suspense>
  )
}

async function Workspace({ params }: Pick<PageProps<'/workspaces/[workspaceId]'>, 'params'>) {
  const { workspaceId } = await params
  const here = `/workspaces/${workspaceId}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [{ workspace, etag }, matters] = await Promise.all([
      workspaceRepository.get(workspaceId),
      matterRepository.listInWorkspace(workspaceId),
    ])
    // Membership administration is OWNER-only. The API refuses everyone else (403), and that
    // refusal is the signal: nothing here is inferred from IdP roles or cached rights.
    const members = await workspaceRepository.members(workspaceId).catch((error: unknown) => {
      if (error instanceof McError && error.code === 'forbidden') return null
      throw error
    })
    return { workspace, etag, matters, members }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="workspace" />
  const { workspace, etag, matters, members } = read.value
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={workspace.name}
        description={
          members ? 'You are an owner of this workspace.' : 'You are a member of this workspace.'
        }
      />
      <section aria-labelledby="matters-heading" className="flex flex-col gap-3">
        <h2 id="matters-heading" className="text-lg font-semibold">
          <LocalizedText en="Matters" vi="Hồ sơ" />
        </h2>
        <MatterList items={matters.items} total={matters.page.total} />
      </section>
      {members && etag && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                <LocalizedText en="New matter" vi="Hồ sơ mới" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateMatterForm workspaceId={workspaceId} ifMatch={etag} />
            </CardContent>
          </Card>
          <WorkspaceMembers workspaceId={workspaceId} members={members.items} etag={etag} />
        </>
      )}
    </div>
  )
}
