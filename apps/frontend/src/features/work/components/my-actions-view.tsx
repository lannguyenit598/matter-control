import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import { Inbox } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { EmptyState } from '@/components/molecules/empty-state'
import { withFrom } from '@/lib/mc/paths'

import type { Assigned, MyActions } from '../schemas'

import {
  AttentionBadge,
  DependencyBadge,
  ExecutionBadge,
  KindBadge,
  TimingBadge,
} from './work-badges'

/**
 * Four separate sections: what is ready to work on, what waits on someone else, what is blocked,
 * and what is finished. An assignment is not a recommendation: only ready Actions are "Next",
 * in the approved order, each with the reason it is listed.
 */
export function MyActionsView({ actions }: { actions: MyActions }) {
  const total =
    actions.next.length +
    actions.waiting.length +
    actions.blocked.length +
    actions.historical.length
  if (total === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title={<LocalizedText en="Nothing is assigned to you" vi="Bạn chưa được giao việc" />}
        description="No work in the matters you can access is assigned to you. Nothing is recommended in its place: follow-up work must be created and assigned explicitly."
      />
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <Section
        title={<LocalizedText en="Next actions" vi="Hành động tiếp theo" />}
        description="Ready Actions assigned to you: critical chain first, then earliest due date, then a stable order."
        empty={
          actions.waiting.length + actions.blocked.length > 0
            ? 'No ready Action is assigned to you. Your assigned work is waiting or blocked, listed below with the cause.'
            : 'No ready Action is assigned to you.'
        }
        rows={actions.next}
      />
      <Section
        title={<LocalizedText en="Waiting on others" vi="Đang chờ bên khác" />}
        description={
          <LocalizedText
            en="Waiting is not blocked: the work waits on an external party."
            vi="Đang chờ khác với bị chặn: công việc đang đợi bên ngoài."
          />
        }
        rows={actions.waiting}
      />
      <Section
        title={<LocalizedText en="Blocked" vi="Bị chặn" />}
        description={
          <LocalizedText
            en="Prerequisites are not yet satisfied, or this is a Requirement (not a next action)."
            vi="Điều kiện tiên quyết chưa đạt hoặc đây là Yêu cầu, không phải hành động tiếp theo."
          />
        }
        rows={actions.blocked}
      />
      <Section
        title={<LocalizedText en="Completed or cancelled" vi="Đã hoàn tất hoặc hủy" />}
        description={<LocalizedText en="Kept for context." vi="Giữ lại để tham khảo bối cảnh." />}
        rows={actions.historical}
      />
    </div>
  )
}

function Section({
  title,
  description,
  rows,
  empty,
}: {
  title: React.ReactNode
  description: React.ReactNode
  rows: Assigned[]
  empty?: React.ReactNode
}) {
  if (rows.length === 0 && !empty) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} ({rows.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ol className="divide-y rounded-md border">
            {rows.map((a) => (
              <li key={a.item.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={withFrom(`/matters/${a.matterId}/work/${a.item.id}`, '/my-actions')}
                    className="font-medium underline"
                  >
                    {a.item.title}
                  </Link>
                  <KindBadge kind={a.item.kind} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ExecutionBadge state={a.item.execution} />
                  <DependencyBadge state={a.item.dependency} />
                  <TimingBadge derived={a.derived} />
                  <AttentionBadge derived={a.derived} />
                  {a.item.dueAt && (
                    <span className="text-xs text-muted-foreground">
                      <LocalizedText en="Due" vi="Hạn" /> <LocalizedInstant iso={a.item.dueAt} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.reason}
                  {a.waitingOn ? `: waiting on ${a.waitingOn}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
