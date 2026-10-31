import { Flag, ListChecks, Network, Pencil, Users } from 'lucide-react'
import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { IconDisclosure } from '@/components/molecules/icon-disclosure'
import { TaskDialog } from '@/components/organisms/form-dialog'
import { withFrom } from '@/lib/mc/paths'

import { MILESTONE_REASON, MILESTONE_STATE_LABEL } from '../labels'
import type { Envelope, MilestoneView, Party, Workstream } from '../schemas'

import { AttentionBadge, ExecutionBadge, TimingBadge } from './work-badges'
import {
  CreateMilestoneForm,
  CreatePartyForm,
  CreateWorkstreamForm,
  EditPartyForm,
  MilestonePrerequisitesForm,
} from './planning-forms'

/** Milestone readiness shows counts and reasons; a percentage never implies readiness. */
export function MilestoneList({
  matterId,
  milestones,
  titles,
  requirements,
  isOwner,
}: {
  matterId: string
  milestones: MilestoneView[]
  titles: Record<string, string>
  requirements: { id: string; title: string }[]
  isOwner: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>
            <LocalizedText en="Milestones" vi="Cột mốc" />
          </CardTitle>
          <CardDescription>
            A milestone is ready only when every required Requirement is completed, verified (or
            explicitly not required) and not blocked.
          </CardDescription>
        </div>
        {isOwner && (
          <TaskDialog
            trigger={
              <>
                {' '}
                <Flag aria-hidden />
                <LocalizedText en="Add milestone" vi="Thêm cột mốc" />
              </>
            }
            title={<LocalizedText en="Add milestone" vi="Thêm cột mốc" />}
            description={
              <LocalizedText
                en="A point in the matter that is ready only when its required Requirements are met. Required Requirements are chosen afterwards."
                vi="Một mốc của hồ sơ, chỉ sẵn sàng khi các yêu cầu bắt buộc được đáp ứng. Các yêu cầu bắt buộc được chọn sau."
              />
            }
            successNotice={<LocalizedText en="Milestone added." vi="Đã thêm cột mốc." />}
          >
            <CreateMilestoneForm matterId={matterId} />
          </TaskDialog>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText en="No milestones yet." vi="Chưa có cột mốc." />
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {milestones.map((v) => (
              <li key={v.milestone.id} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{v.milestone.name}</h3>
                  {v.milestone.critical && (
                    <Badge variant="destructive">
                      <LocalizedText en="Critical" vi="Nghiêm trọng" />
                    </Badge>
                  )}
                  <Badge
                    variant={
                      v.status.state === 'READY'
                        ? 'success'
                        : v.status.state === 'NOT_READY'
                          ? 'warning'
                          : 'outline'
                    }
                  >
                    {MILESTONE_STATE_LABEL[v.status.state]}
                  </Badge>
                  {v.milestone.dueAt && (
                    <span className="text-xs text-muted-foreground">
                      <LocalizedText en="Due" vi="Hạn" />{' '}
                      <LocalizedInstant iso={v.milestone.dueAt} />
                    </span>
                  )}
                </div>
                {v.status.total > 0 && (
                  <p className="text-sm" aria-live="polite">
                    {v.status.satisfied} of {v.status.total} required Requirements satisfied
                  </p>
                )}
                {v.status.unsatisfied.length > 0 && (
                  <ul className="list-disc pl-5 text-sm">
                    {v.status.unsatisfied.map((u) => (
                      <li key={u.itemId}>
                        <Link
                          href={withFrom(
                            `/matters/${matterId}/work/${u.itemId}`,
                            `/matters/${matterId}/planning`,
                          )}
                          className="underline"
                        >
                          {titles[u.itemId] ?? 'A required Requirement'}
                        </Link>
                        : {u.reasons.map((r) => MILESTONE_REASON[r] ?? r).join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
                {isOwner && (
                  <IconDisclosure
                    icon={<ListChecks />}
                    label={{
                      en: 'Change required Requirements',
                      vi: 'Đổi các yêu cầu bắt buộc',
                    }}
                  >
                    <MilestonePrerequisitesForm
                      matterId={matterId}
                      view={v}
                      requirements={requirements}
                    />
                  </IconDisclosure>
                )}
              </li>
            ))}
          </ul>
        )}
        {!isOwner && (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Milestone settings are limited to matter owners."
              vi="Chỉ chủ sở hữu hồ sơ được thay đổi cột mốc."
            />
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function PartyList({
  matterId,
  parties,
  canEdit,
}: {
  matterId: string
  parties: Party[]
  canEdit: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>
            <LocalizedText en="External parties" vi="Các bên ngoài" />
          </CardTitle>
          <CardDescription>
            <LocalizedText
              en="Context for who work waits on. A party is not a user: it has no account, role or access."
              vi="Bối cảnh về bên mà công việc đang chờ. Bên ngoài không có tài khoản, vai trò hay quyền truy cập."
            />
          </CardDescription>
        </div>
        {canEdit && (
          <TaskDialog
            trigger={
              <>
                {' '}
                <Users aria-hidden />
                <LocalizedText en="Add external party" vi="Thêm bên ngoài" />
              </>
            }
            title={<LocalizedText en="Add external party" vi="Thêm bên ngoài" />}
            description={
              <LocalizedText
                en="Someone outside the matter that work can wait on, such as an authority. It gets no account or access."
                vi="Một bên ngoài hồ sơ mà công việc có thể phải chờ, ví dụ cơ quan nhà nước. Bên này không có tài khoản hay quyền truy cập."
              />
            }
            successNotice={<LocalizedText en="Party added." vi="Đã thêm bên ngoài." />}
          >
            <CreatePartyForm matterId={matterId} />
          </TaskDialog>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {parties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText en="No external parties yet." vi="Chưa có bên ngoài." />
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {parties.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium break-words">{p.name}</span>
                  {p.kind && <Badge variant="outline">{p.kind}</Badge>}
                </div>
                {p.contact && (
                  <p className="text-sm break-words text-muted-foreground">{p.contact}</p>
                )}
                {canEdit && (
                  <IconDisclosure
                    icon={<Pencil />}
                    label={{ en: `Edit ${p.name}`, vi: `Sửa ${p.name}` }}
                  >
                    <EditPartyForm matterId={matterId} party={p} />
                  </IconDisclosure>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function WorkstreamList({
  matterId,
  workstreams,
  canEdit,
}: {
  matterId: string
  workstreams: Workstream[]
  canEdit: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle>
            <LocalizedText en="Workstreams" vi="Nhóm công việc" />
          </CardTitle>
          <CardDescription>
            <LocalizedText
              en="Organise records. A workstream is not an access boundary."
              vi="Tổ chức các bản ghi. Nhóm công việc không phải ranh giới phân quyền."
            />
          </CardDescription>
        </div>
        {canEdit && (
          <TaskDialog
            trigger={
              <>
                {' '}
                <Network aria-hidden />
                <LocalizedText en="Add workstream" vi="Thêm nhóm công việc" />
              </>
            }
            title={<LocalizedText en="Add workstream" vi="Thêm nhóm công việc" />}
            description={
              <LocalizedText
                en="A label for organising records. It does not limit who can see them."
                vi="Một nhãn để sắp xếp các bản ghi. Nhóm này không giới hạn người xem."
              />
            }
            successNotice={<LocalizedText en="Workstream added." vi="Đã thêm nhóm công việc." />}
          >
            <CreateWorkstreamForm matterId={matterId} />
          </TaskDialog>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {workstreams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText en="No workstreams yet." vi="Chưa có nhóm công việc." />
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {workstreams.map((w) => (
              <li key={w.id}>
                <Badge variant="outline">{w.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Everything currently waiting, with who it waits on and who is accountable. */
export function WaitingOnList({
  matterId,
  items,
  parties,
  members,
}: {
  matterId: string
  items: Envelope[]
  parties: Party[]
  members: { userId: string; displayName: string }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting on ({items.length})</CardTitle>
        <CardDescription>
          Waiting is not blocked: these records wait on an external party and keep an accountable
          owner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText en="Nothing is waiting." vi="Không có công việc đang chờ." />
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {items.map((e) => (
              <li key={e.item.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={withFrom(
                      `/matters/${matterId}/work/${e.item.id}`,
                      `/matters/${matterId}/planning`,
                    )}
                    className="font-medium underline"
                  >
                    {e.item.title}
                  </Link>
                  <ExecutionBadge state={e.item.execution} />
                  <TimingBadge derived={e.derived} />
                  <AttentionBadge derived={e.derived} />
                </div>
                <p className="text-sm">
                  <LocalizedText en="Waiting on" vi="Đang chờ" />{' '}
                  <strong>
                    {parties.find((p) => p.id === e.item.waitingPartyId)?.name ??
                      'an external party'}
                  </strong>
                  : {e.item.waitingCondition}
                </p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText en="Accountable:" vi="Chịu trách nhiệm:" />{' '}
                  {members.find((m) => m.userId === e.item.ownerId)?.displayName ??
                    'no active owner'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
