import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { ChevronDown } from 'lucide-react'
import { Suspense } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { Alert } from '@/components/molecules/alert'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { MatterHistory } from '@/features/matters/components/matter-history'
import { MatterMembers } from '@/features/matters/components/matter-members'
import { matterRepository } from '@/features/matters/repository'
import { CreateRequirementForm } from '@/features/requirements/components/create-requirement-form'
import { MatterAttention } from '@/features/work/components/matter-attention'
import { workRepository } from '@/features/work/repository'
import { CreateActionForm } from '@/features/work/components/create-action-form'
import { AddWorkDialog } from '@/features/work/components/add-work-dialog'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Matter' }

export default function MatterPage({ params, searchParams }: PageProps<'/matters/[matterId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Matter params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Matter({
  params,
  searchParams,
}: Pick<PageProps<'/matters/[matterId]'>, 'params' | 'searchParams'>) {
  const { matterId } = await params
  // Set by the create-matter flow; the banner also checks the data, so a refresh or a shared link
  // after people were added never repeats a claim that is no longer true.
  const created = (await searchParams).created === '1'
  const here = `/matters/${encodeURIComponent(matterId)}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, members, history] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      matterRepository.history(matterId),
    ])
    // Context for the lead section only: each may fail without hiding the rest of the Matter.
    const [blocked, mine] = await Promise.all([
      attempt(() => workRepository.list(matterId, { kind: 'ACTION', dependency: 'BLOCKED' }, 5)),
      attempt(() => workRepository.myActions()),
    ])
    const candidates =
      matter.matter.callerRole === 'OWNER'
        ? await attempt(() => matterRepository.memberCandidates(matterId))
        : null
    return { ...matter, members, history, candidates, blocked, mine }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, etag, asOf, members, history, candidates, blocked, mine } = read.value
  // The caller's role comes from the API for THIS matter; UI affordances only mirror it.
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={
          asOf ? (
            <>
              <LocalizedText en="Read at" vi="Đọc lúc" /> <LocalizedInstant iso={asOf} />
            </>
          ) : undefined
        }
        actions={
          <>
            <Badge variant="primary">{matter.callerRole}</Badge>
            {canEdit && (
              <AddWorkDialog
                actionForm={<CreateActionForm matterId={matterId} />}
                requirementForm={<CreateRequirementForm matterId={matterId} />}
              />
            )}
          </>
        }
      />
      {created && matter.callerRole === 'OWNER' && members.items.length === 1 && (
        <Alert title={<LocalizedText en="Matter created" vi="Đã tạo hồ sơ" />}>
          <LocalizedText
            en="You are its owner and nobody else has access yet. Next:"
            vi="Bạn là chủ sở hữu và chưa ai khác có quyền truy cập. Bước tiếp theo:"
          />{' '}
          {canEdit && (
            <>
              <LocalizedText
                en="use Add work at the top of the page"
                vi="dùng nút Thêm công việc ở đầu trang"
              />
              {' · '}
            </>
          )}
          <Link className="underline" href="#matter-members">
            <LocalizedText en="add people to the matter" vi="thêm người vào hồ sơ" />
          </Link>
        </Alert>
      )}
      <MatterAttention
        matterId={matterId}
        here={here}
        blocked={blocked.ok ? blocked.value.page.items : null}
        blockedTotal={blocked.ok ? blocked.value.page.page.total : null}
        mine={
          mine.ok
            ? {
                ready: mine.value.actions.next.filter((a) => a.matterId === matterId),
                waiting: mine.value.actions.waiting.filter((a) => a.matterId === matterId),
                blocked: mine.value.actions.blocked.filter((a) => a.matterId === matterId),
                history: mine.value.actions.historical.filter((a) => a.matterId === matterId),
              }
            : null
        }
      />
      {etag && (
        <MatterMembers
          matterId={matterId}
          members={members.items}
          etag={etag}
          canAdminister={matter.callerRole === 'OWNER'}
          candidates={candidates?.ok ? candidates.value.items : null}
        />
      )}
      <details className="group flex flex-col gap-3 border-t pt-4">
        <summary className="control-target flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
          <LocalizedText en="History" vi="Lịch sử" />
          <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <MatterHistory
          events={history.items}
          asOf={history.asOf}
          actorNames={Object.fromEntries(members.items.map((m) => [m.userId, m.displayName]))}
          nextHref={
            history.page.nextCursor
              ? `${here}/history?cursor=${encodeURIComponent(history.page.nextCursor)}`
              : null
          }
        />
      </details>
    </div>
  )
}
