import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { MatterHistory } from '@/features/matters/components/matter-history'
import { MatterTabs } from '@/features/matters/components/matter-tabs'
import { MatterMembers } from '@/features/matters/components/matter-members'
import { matterRepository } from '@/features/matters/repository'
import { CreateRequirementForm } from '@/features/requirements/components/create-requirement-form'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Matter' }

export default function MatterPage({ params }: PageProps<'/matters/[matterId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Matter params={params} />
    </Suspense>
  )
}

async function Matter({ params }: Pick<PageProps<'/matters/[matterId]'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${encodeURIComponent(matterId)}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, members, history] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      matterRepository.history(matterId),
    ])
    return { ...matter, members, history }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, etag, asOf, members, history } = read.value
  // The caller's role comes from the API for THIS matter; UI affordances only mirror it.
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={asOf ? `Read at ${asOf}` : undefined}
        actions={<Badge variant="primary">{matter.callerRole}</Badge>}
      />
      <MatterTabs matterId={matterId} active="overview" />
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="New requirement" vi="Yêu cầu mới" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateRequirementForm matterId={matterId} />
          </CardContent>
        </Card>
      )}
      {etag && (
        <MatterMembers
          matterId={matterId}
          members={members.items}
          etag={etag}
          canAdminister={matter.callerRole === 'OWNER'}
        />
      )}
      <section aria-labelledby="history-heading" className="flex flex-col gap-3">
        <h2 id="history-heading" className="text-lg font-semibold">
          <LocalizedText en="History" vi="Lịch sử" />
        </h2>
        <MatterHistory
          events={history.items}
          asOf={history.asOf}
          nextHref={
            history.page.nextCursor
              ? `${here}/history?cursor=${encodeURIComponent(history.page.nextCursor)}`
              : null
          }
        />
      </section>
    </div>
  )
}
