import { FilePlus } from 'lucide-react'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { TaskDialog } from '@/components/organisms/form-dialog'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CloseContextForm, CreateContextForm } from '@/features/control/components/context-forms'
import { ControlRoomView } from '@/features/control/components/control-room-view'
import { KIND_LABEL } from '@/features/control/labels'
import { roomTitles } from '@/features/control/room-labels'
import { controlRepository } from '@/features/control/repository'
import { matterRepository } from '@/features/matters/repository'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Control Room' }

export default function ControlRoomPage({ params }: PageProps<'/matters/[matterId]/control-room'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ControlRoom params={params} />
    </Suspense>
  )
}

async function ControlRoom({
  params,
}: Pick<PageProps<'/matters/[matterId]/control-room'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${matterId}/control-room`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    // Facts come from the room alone (one snapshot). The other reads only supply names and the
    // choices offered by the edit form below, which carries its own boundary.
    const [matter, members, parties, all, { room }] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.parties(matterId),
      workRepository.list(matterId, {}, 200),
      controlRepository.room(matterId),
    ])
    return {
      matter: matter.matter,
      members: members.items,
      parties: parties.items,
      all: all.page.items,
      allAsOf: all.asOf,
      room,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="Control Room" />
  const { matter, members, parties, all, allAsOf, room } = read.value
  const records = room.records
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  const titles = roomTitles(room)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={<LocalizedText en="Control Room" vi="Phòng điều hành" />}
      />
      <ControlRoomView
        matterId={matterId}
        room={room}
        labels={{
          users: Object.fromEntries(members.map((m) => [m.userId, m.displayName])),
          parties: Object.fromEntries(parties.map((p) => [p.id, p.name])),
          titles,
        }}
      />
      <Card id="records">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>
              <LocalizedText
                en="Decisions, findings, risks and entities"
                vi="Quyết định, phát hiện, rủi ro và thực thể"
              />
            </CardTitle>
            <CardDescription>
              Notes that explain the work. They never change a record’s status, proof or
              dependencies, and an entity never grants access.
            </CardDescription>
          </div>
          {canEdit && (
            <TaskDialog
              trigger={
                <>
                  {' '}
                  <FilePlus aria-hidden />
                  <LocalizedText en="Add context record" vi="Thêm bản ghi bối cảnh" />
                </>
              }
              title={<LocalizedText en="Add context record" vi="Thêm bản ghi bối cảnh" />}
              description={
                <LocalizedText
                  en="A factual note that explains the work. It is not authoritative and never changes status, proof or dependencies."
                  vi="Ghi chú thực tế giải thích công việc. Ghi chú không có giá trị quyết định và không thay đổi trạng thái, bằng chứng hay phụ thuộc."
                />
              }
              successNotice={<LocalizedText en="Record added." vi="Đã thêm bản ghi." />}
            >
              <p className="mb-3 text-sm text-muted-foreground">
                The records you can link here were read separately
                {allAsOf ? ` at ${allAsOf}` : ''}; the room above is as of {room.asOf}. A link to a
                record that no longer exists is refused.
              </p>
              <CreateContextForm
                matterId={matterId}
                items={all.map((e) => ({
                  id: e.item.id,
                  label: `${e.item.kind === 'REQUIREMENT' ? 'Requirement' : 'Action'}: ${e.item.title}`,
                }))}
              />
            </TaskDialog>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LocalizedText en="Nothing is recorded yet." vi="Chưa có bản ghi." />
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {records.map((r) => (
                <li data-slot="record-row" key={r.id} className="flex flex-col gap-1 py-3 text-sm">
                  <p>
                    <span className="font-medium">{KIND_LABEL[r.kind]}</span> · {r.title}
                    {r.status === 'CLOSED' && (
                      <span className="text-muted-foreground"> (closed: {r.closedReason})</span>
                    )}
                  </p>
                  {r.body && (
                    <p className="break-words whitespace-pre-wrap text-muted-foreground">
                      {r.body}
                    </p>
                  )}
                  {r.links.length > 0 && (
                    <p>Concerns: {r.links.map((l) => titles[l] ?? l.slice(0, 8)).join(', ')}</p>
                  )}
                  {canEdit && <CloseContextForm matterId={matterId} record={r} />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
