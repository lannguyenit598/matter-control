import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import {
  MilestoneList,
  PartyList,
  WaitingOnList,
  WorkstreamList,
} from '@/features/work/components/planning-view'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Planning' }

export default function PlanningPage({ params }: PageProps<'/matters/[matterId]/planning'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Planning params={params} />
    </Suspense>
  )
}

async function Planning({ params }: Pick<PageProps<'/matters/[matterId]/planning'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${matterId}/planning`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, members, milestones, parties, workstreams, waiting, all] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.milestones(matterId),
      workRepository.parties(matterId),
      workRepository.workstreams(matterId),
      workRepository.waitingOn(matterId),
      workRepository.list(matterId, { kind: 'REQUIREMENT' }, 200),
    ])
    return {
      matter: matter.matter,
      members: members.items,
      milestones: milestones.items,
      parties: parties.items,
      workstreams: workstreams.items,
      waiting: waiting.items,
      requirements: all.page.items,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, members, milestones, parties, workstreams, waiting, requirements } = read.value
  const role = matter.callerRole
  const canEdit = role === 'OWNER' || role === 'EDITOR'
  const titles = Object.fromEntries(requirements.map((e) => [e.item.id, e.item.title]))
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={
          <LocalizedText
            en="Milestones, external parties and what is waiting"
            vi="Cột mốc, bên ngoài và các công việc đang chờ"
          />
        }
      />
      <MilestoneList
        matterId={matterId}
        milestones={milestones}
        titles={titles}
        requirements={requirements.map((e) => ({ id: e.item.id, title: e.item.title }))}
        isOwner={role === 'OWNER'}
      />
      <WaitingOnList matterId={matterId} items={waiting} parties={parties} members={members} />
      <PartyList matterId={matterId} parties={parties} canEdit={canEdit} />
      <WorkstreamList matterId={matterId} workstreams={workstreams} canEdit={canEdit} />
    </div>
  )
}
