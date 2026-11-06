import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CreateMatterForm } from '@/features/matters/components/create-matter-form'
import { MatterList } from '@/features/matters/components/matter-list'
import { matterRepository } from '@/features/matters/repository'
import { playbookRepository } from '@/features/playbooks/repository'
import { PlaybookPanel } from '@/features/playbooks/components/playbook-panel'
import { WorkspaceMembers } from '@/features/workspaces/components/workspace-members'
import { workspaceRepository } from '@/features/workspaces/repository'
import { getSession } from '@/lib/auth'
import { attempt, McError } from '@/lib/mc/errors'
import { pageMetadata } from '@/lib/page-metadata'

export const generateMetadata = pageMetadata('Workspace', 'Không gian làm việc')

export default function WorkspacePage({ params }: PageProps<'/workspaces/[workspaceId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Workspace params={params} />
    </Suspense>
  )
}

async function Workspace({ params }: Pick<PageProps<'/workspaces/[workspaceId]'>, 'params'>) {
  const { workspaceId } = await params
  await connection()
  const here = `/workspaces/${workspaceId}`
  // UX-L-05: the failure keeps the page's h1 — the hub link and the raw id, never a stale name.
  const fallbackHeading = (
    <nav aria-label="Current scope" className="flex items-center gap-2 text-sm font-normal">
      <Link className="underline" href="/workspaces">
        <LocalizedText en="Workspaces" vi="Không gian làm việc" />
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-muted-foreground">{workspaceId}</span>
    </nav>
  )
  if (!(await getSession()))
    return <ReadFailure kind="sign-in" retryHref={here} heading={fallbackHeading} />
  const read = await attempt(async () => {
    const [{ workspace, etag }, matters, playbooks] = await Promise.all([
      workspaceRepository.get(workspaceId),
      matterRepository.listInWorkspace(workspaceId),
      // Playbook reads fail only for non-members; members always see the panel shell.
      attempt(() => playbookRepository.list(workspaceId)).catch(() => null),
    ])
    // Membership administration is OWNER-only. The API refuses everyone else (403), and that
    // refusal is the signal: nothing here is inferred from IdP roles or cached rights.
    const members = await workspaceRepository.members(workspaceId).catch((error: unknown) => {
      if (error instanceof McError && error.code === 'forbidden') return null
      throw error
    })
    return { workspace, etag, matters, members, playbooks }
  })
  if (!read.ok)
    return (
      <ReadFailure
        kind={read.kind}
        retryHref={here}
        subject="workspace"
        heading={fallbackHeading}
      />
    )
  const { workspace, etag, matters, members, playbooks } = read.value
  // The members read is OWNER-only; its success is the authorization signal.
  const isOwner = members !== null && etag !== null
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={workspace.name}
        description={
          <LocalizedText
            en="Matters organize each legal engagement. Choose an existing matter or create a new one to start tracking its work."
            vi="Mỗi hồ sơ tập hợp một vụ việc hoặc giao dịch. Mở hồ sơ có sẵn hoặc tạo hồ sơ mới để bắt đầu theo dõi công việc."
          />
        }
      />
      <MatterList
        items={matters.items}
        total={matters.page.total}
        action={
          members &&
          etag && (
            <CreateMatterForm
              workspaceId={workspaceId}
              workspaceName={workspace.name}
              ifMatch={etag}
            />
          )
        }
      />
      {members && etag && (
        <WorkspaceMembers workspaceId={workspaceId} members={members.items} etag={etag} />
      )}
      {isOwner && (
        <Disclosure id="playbooks" title={<LocalizedText en="Playbooks" vi="Playbook" />}>
          <PlaybookPanel
            workspaceId={workspaceId}
            wsEtag={etag}
            playbooks={playbooks && playbooks.ok ? playbooks.value.items : []}
          />
        </Disclosure>
      )}
    </div>
  )
}

/** Secondary controls stay one deliberate step away; the content stays mounted. */
function Disclosure({
  id,
  title,
  children,
}: {
  id: string
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <details id={id} className="group flex flex-col gap-3 border-t pt-4">
      <summary className="control-target flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
        {title}
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      {children}
    </details>
  )
}
