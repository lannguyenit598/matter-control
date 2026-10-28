import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import { ListChecks } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { cn } from '@/lib/utils'
import { withFrom } from '@/lib/mc/paths'

import type { Envelope, Workstream } from '../schemas'

import { RowTitleEdit } from './row-title-edit'
import {
  AttentionBadge,
  DependencyBadge,
  ExecutionBadge,
  KindBadge,
  VerificationBadge,
  TimingBadge,
} from './work-badges'

export type Person = { userId: string; displayName: string }

/**
 * The operational grid: one row per record, one column per independent axis. Derived columns
 * (dependency, timing, attention) are read-only by construction. `here` is this page's own URL so
 * a record opened from a row can offer a truthful Back.
 */
export function WorkGrid({
  matterId,
  items,
  total,
  canEdit,
  members,
  workstreams,
  here,
  density,
  nextHref,
  filtered,
}: {
  matterId: string
  items: Envelope[]
  total: number | null
  canEdit: boolean
  members: Person[]
  workstreams: Workstream[]
  here: string
  density: 'comfortable' | 'compact'
  nextHref: string | null
  filtered: boolean
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks />}
        title={filtered ? 'No work items match these filters' : 'No work items yet'}
        description={
          filtered
            ? 'Clear a filter to see more. A match of zero is shown as zero results, not as an error.'
            : 'Create an Action or a Requirement to start. Requirements record what must be true; Actions record work.'
        }
      />
    )
  }
  const owner = (id: string | null) => {
    if (!id)
      return (
        <span className="text-muted-foreground">
          <LocalizedText en="Unassigned" vi="Chưa phân công" />
        </span>
      )
    return (
      members.find((m) => m.userId === id)?.displayName ?? (
        <span className="text-muted-foreground">
          <LocalizedText en="Not an active member" vi="Không còn là thành viên hoạt động" />
        </span>
      )
    )
  }
  const wsName = (id: string | null) =>
    id ? (workstreams.find((w) => w.id === id)?.name ?? '—') : '—'
  const cell = density === 'compact' ? 'px-2 py-1' : 'px-3 py-2.5'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total ?? items.length} {(total ?? items.length) === 1 ? 'record' : 'records'}
      </p>
      <div
        className="overflow-x-auto rounded-lg border"
        tabIndex={0}
        aria-label="Work items table, scrollable"
      >
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">
            <LocalizedText
              en="Work items with their independent states"
              vi="Các bản ghi công việc và các trục trạng thái độc lập"
            />
          </caption>
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              {[
                'Title',
                'Type',
                'Execution',
                'Verification',
                'Dependency',
                'Timing',
                'Attention',
                'Owner',
                'Due',
                'Workstream',
              ].map((h) => (
                <th key={h} scope="col" className={cn('font-medium', cell)}>
                  <LocalizedText
                    en={h}
                    vi={
                      (
                        {
                          Title: 'Tiêu đề',
                          Type: 'Loại',
                          Execution: 'Thực hiện',
                          Verification: 'Xác minh',
                          Dependency: 'Phụ thuộc',
                          Timing: 'Thời hạn',
                          Attention: 'Mức chú ý',
                          Owner: 'Người phụ trách',
                          Due: 'Hạn',
                          Workstream: 'Nhóm công việc',
                        } as Record<string, string>
                      )[h] ?? h
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((e) => (
              <tr
                key={e.item.id}
                data-row-id={e.item.id}
                className={cn('align-top', density === 'compact' ? 'h-9' : 'h-11')}
              >
                <th scope="row" className={cn('max-w-xs font-normal', cell)}>
                  <div className="flex flex-col gap-1">
                    <RowTitleEdit
                      matterId={matterId}
                      itemId={e.item.id}
                      title={e.item.title}
                      etag={e.etag}
                      canEdit={canEdit}
                    />
                    <Link
                      href={withFrom(`/matters/${matterId}/work/${e.item.id}`, here)}
                      className="w-fit text-xs underline"
                      aria-label={`Open details of ${e.item.title}`}
                    >
                      <LocalizedText en="Open details" vi="Mở chi tiết" />
                    </Link>
                  </div>
                </th>
                <td className={cell}>
                  <KindBadge kind={e.item.kind} />
                </td>
                <td className={cell}>
                  <ExecutionBadge state={e.item.execution} />
                </td>
                <td className={cell}>
                  <VerificationBadge item={e.item} />
                </td>
                <td className={cell}>
                  <DependencyBadge state={e.item.dependency} />
                </td>
                <td className={cell}>
                  <TimingBadge derived={e.derived} />
                </td>
                <td className={cell}>
                  <AttentionBadge derived={e.derived} />
                </td>
                <td className={cell}>{owner(e.item.ownerId)}</td>
                <td className={cn(cell, 'whitespace-nowrap')}>
                  {e.item.dueAt ? (
                    <LocalizedInstant iso={e.item.dueAt} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className={cell}>{wsName(e.item.workstreamId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nextHref && (
        <div>
          <Link href={nextHref} className={buttonVariants({ variant: 'outline' })}>
            <LocalizedText en="Next page" vi="Trang tiếp" />
          </Link>
        </div>
      )}
    </div>
  )
}
