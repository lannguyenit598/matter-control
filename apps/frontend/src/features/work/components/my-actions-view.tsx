import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Inbox,
  ListTodo,
  Clock3,
  CircleAlert,
  History,
} from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'
import { EmptyState } from '@/components/molecules/empty-state'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { withFrom } from '@/lib/mc/paths'
import { cn } from '@/lib/utils'

import { myWorkHref, QUEUES, type MyWorkSelection, type Queue } from '../my-work-selection'
import { GATE_REASON } from '../labels'
import type { Assigned, Detail } from '../schemas'

import {
  AttentionBadge,
  DependencyBadge,
  ExecutionBadge,
  KindBadge,
  TimingBadge,
} from './work-badges'

const QUEUE_LABEL: Record<Queue, { en: string; vi: string }> = {
  ready: { en: 'Ready', vi: 'Sẵn sàng' },
  waiting: { en: 'Waiting', vi: 'Đang chờ' },
  blocked: { en: 'Blocked', vi: 'Bị chặn' },
  history: { en: 'History', vi: 'Lịch sử' },
}

const QUEUE_ICON = { ready: ListTodo, waiting: Clock3, blocked: CircleAlert, history: History }

const WHY: Record<Assigned['class'], { en: string; vi: string }> = {
  ELIGIBLE: { en: 'Why this is next', vi: 'Vì sao đây là việc tiếp theo' },
  WAITING: { en: 'Why this is waiting', vi: 'Vì sao việc này đang chờ' },
  BLOCKED: { en: 'Why this is blocked', vi: 'Vì sao việc này bị chặn' },
  HISTORICAL: { en: 'Why this is listed', vi: 'Vì sao việc này được liệt kê' },
}

const GATE_VI: Record<string, string> = {
  NOT_COMPLETED: 'điều kiện tiên quyết chưa hoàn tất',
  NOT_VERIFIED: 'đã hoàn tất nhưng chưa được xác minh',
  UPSTREAM_BLOCKED: 'bản thân nó đang bị chặn',
  CANCELLED: 'đã hủy (hủy không làm thỏa điều kiện)',
}

/** The API's fixed reason sentences, shown in Vietnamese; any other server text is shown as sent. */
const REASON_VI: Record<string, string> = {
  'assigned to you, ready to work': 'giao cho bạn, sẵn sàng thực hiện',
  'waiting on an external condition': 'đang chờ một điều kiện bên ngoài',
  'an assigned requirement is not a next action':
    'yêu cầu được giao không phải là hành động tiếp theo',
  'blocked by unsatisfied prerequisites': 'bị chặn bởi điều kiện tiên quyết chưa đạt',
  'completed or cancelled': 'đã hoàn tất hoặc hủy',
}

/**
 * Focused workbench: a short queue rail, one dominant current item with its reason and one
 * permitted next step, and a small Up next list. The selection lives in the URL, so it survives a
 * reload and "Back" from the task returns here. An assignment is not a recommendation: only the
 * Ready queue says "next", in the server's order.
 */
export function MyActionsView({
  selection,
  matterNames = {},
  detail = null,
}: {
  selection: MyWorkSelection
  /** Names the page could read for the shown Matters. A missing name is never replaced by an id. */
  matterNames?: Record<string, string>
  /** The selected item's detail (upstream causes). Null when it could not be read. */
  detail?: Detail | null
}) {
  const { queue, selected, counts } = selection
  const total = counts.ready + counts.waiting + counts.blocked + counts.history
  if (total === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title={<LocalizedText en="Nothing is assigned to you" vi="Bạn chưa được giao việc" />}
        description={
          <LocalizedText
            en="No work in the matters you can access is assigned to you. Nothing is recommended in its place: follow-up work must be created and assigned explicitly."
            vi="Không có việc nào trong các hồ sơ bạn truy cập được giao cho bạn. Hệ thống không đề xuất gì thay thế: việc tiếp theo phải được tạo và giao một cách rõ ràng."
          />
        }
        action={
          <Link href="/workspaces" className={buttonVariants({ variant: 'outline' })}>
            <LocalizedText en="Go to Matters" vi="Đến Hồ sơ" />
          </Link>
        }
      />
    )
  }
  return (
    <div className="workbench flex flex-1 flex-col">
      <nav aria-label="Work queues" className="work-queues flex min-w-0 overflow-x-auto border-b">
        {QUEUES.map((q) => {
          const Icon = QUEUE_ICON[q]
          return (
            <Link
              key={q}
              href={myWorkHref(q)}
              aria-current={q === queue ? 'page' : undefined}
              className={cn(
                'control-target -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground',
                q === queue && 'border-primary font-medium text-foreground',
              )}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <LocalizedText en={QUEUE_LABEL[q].en} vi={QUEUE_LABEL[q].vi} />
              <span className="tabular-nums">{counts[q]}</span>
            </Link>
          )
        })}
      </nav>

      {selection.notice && (
        <Alert>
          {selection.notice === 'moved' ? (
            <LocalizedText
              en="That item has moved to another queue since you opened it. It is shown here."
              vi="Mục đó đã chuyển sang hàng đợi khác kể từ khi bạn mở. Mục được hiển thị ở đây."
            />
          ) : (
            <LocalizedText
              en="That item is no longer in your list: it may be reassigned, or you may no longer have access. Choose another item below."
              vi="Mục đó không còn trong danh sách của bạn: có thể đã giao lại hoặc bạn không còn quyền truy cập. Hãy chọn mục khác bên dưới."
            />
          )}
        </Alert>
      )}

      {!selected ? (
        <EmptyQueue queue={queue} counts={counts} />
      ) : (
        <div className="work-columns grid flex-1">
          <CurrentItem selection={selection} matterNames={matterNames} detail={detail} />
          <UpNext selection={selection} matterNames={matterNames} />
        </div>
      )}
    </div>
  )
}

function EmptyQueue({ queue, counts }: { queue: Queue; counts: MyWorkSelection['counts'] }) {
  const elsewhere = QUEUES.filter((q) => q !== queue && counts[q] > 0)
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        {queue === 'ready' ? (
          counts.waiting + counts.blocked > 0 ? (
            <LocalizedText
              en="No ready Action is assigned to you. Your assigned work is waiting or blocked, listed under those queues with the cause."
              vi="Bạn không có hành động sẵn sàng nào. Việc được giao đang chờ hoặc bị chặn, được liệt kê ở các hàng đợi đó cùng nguyên nhân."
            />
          ) : (
            <LocalizedText
              en="No ready Action is assigned to you."
              vi="Bạn không có hành động sẵn sàng nào."
            />
          )
        ) : (
          <LocalizedText en="Nothing in this queue." vi="Không có mục nào trong hàng đợi này." />
        )}
      </p>
      {elsewhere.length > 0 && (
        <p className="flex flex-wrap gap-2 text-sm">
          {elsewhere.map((q) => (
            <Link key={q} href={myWorkHref(q)} className="underline">
              <LocalizedText en={QUEUE_LABEL[q].en} vi={QUEUE_LABEL[q].vi} /> ({counts[q]})
            </Link>
          ))}
          <Link href="/workspaces" className="underline">
            <LocalizedText en="Matters" vi="Hồ sơ" />
          </Link>
        </p>
      )}
    </div>
  )
}

function CurrentItem({
  selection,
  matterNames,
  detail,
}: {
  selection: MyWorkSelection
  matterNames: Record<string, string>
  detail: Detail | null
}) {
  const { queue, selected: a, index, list, previous, next } = selection
  if (!a) return null
  const here = myWorkHref(queue, a.item.id)
  const matterHref = withFrom(`/matters/${a.matterId}`, here)
  const taskHref = withFrom(`/matters/${a.matterId}/work/${a.item.id}`, here)
  const matterName = matterNames[a.matterId]
  const causes = (detail?.upstream ?? []).filter((e) => !e.satisfied)
  return (
    <section aria-labelledby="current-item" className="work-current flex min-w-0 flex-col">
      <div className="work-sequence flex items-center justify-between gap-2 rounded-md text-sm">
        <Step href={previous && myWorkHref(queue, previous.item.id)} dir="previous" />
        <p className="text-muted-foreground tabular-nums">
          <LocalizedText en={QUEUE_LABEL[queue].en} vi={QUEUE_LABEL[queue].vi} />{' '}
          <LocalizedText
            en={`${index + 1} of ${list.length}`}
            vi={`${index + 1} / ${list.length}`}
          />
        </p>
        <Step href={next && myWorkHref(queue, next.item.id)} dir="next" />
      </div>

      <div className="work-identity flex flex-col gap-2">
        {matterName && (
          <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen aria-hidden className="size-4 shrink-0" />
            <span className="break-words">{matterName}</span>
          </p>
        )}
        <h2 id="current-item" className="work-title font-semibold break-words">
          {a.item.title}
        </h2>
        <p className="work-meta flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <LocalizedText en="Assigned to you" vi="Giao cho bạn" />
          {a.item.dueAt && (
            <>
              <span aria-hidden>·</span>
              <span className={cn(a.derived.timing !== 'ON_TRACK' && 'font-medium text-timing')}>
                <LocalizedText en="Due" vi="Hạn" /> <LocalizedInstant iso={a.item.dueAt} />
              </span>
            </>
          )}
        </p>
      </div>

      <div className="work-why flex flex-col gap-1.5">
        <h3 className="work-section-title font-semibold">
          <LocalizedText en={WHY[a.class].en} vi={WHY[a.class].vi} />
        </h3>
        <p className="text-muted-foreground">
          <LocalizedText en={a.reason} vi={REASON_VI[a.reason] ?? a.reason} />
          {a.waitingOn ? (
            <>
              : <LocalizedText en="waiting on" vi="đang chờ" /> {a.waitingOn}
            </>
          ) : null}
        </p>
        {a.class === 'BLOCKED' && (
          <Causes edges={causes} detailRead={detail !== null} here={here} matterId={a.matterId} />
        )}
      </div>

      <div className="work-actions flex flex-wrap items-center">
        <Link
          href={taskHref}
          className={cn(
            buttonVariants({ variant: a.class === 'ELIGIBLE' ? 'primary' : 'outline' }),
            'work-primary',
          )}
        >
          <ExternalLink aria-hidden />
          <LocalizedText en="Open task" vi="Mở tác vụ" />
        </Link>
        <Link href={matterHref} className={buttonVariants({ variant: 'ghost' })}>
          <FolderOpen aria-hidden />
          <LocalizedText en="View matter" vi="Xem hồ sơ" />
        </Link>
      </div>

      <div className="work-needs flex flex-col gap-2 border-t">
        <h3 className="work-section-title font-semibold">
          <LocalizedText en="What you need" vi="Bạn cần gì" />
        </h3>
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-sm text-muted-foreground">
            <LocalizedText en="Expected outcome" vi="Kết quả mong đợi" />
          </dt>
          <dd className="break-words whitespace-pre-line">{a.item.outcome}</dd>
        </dl>
      </div>

      <Disclosure
        icon={<ListTodo aria-hidden className="size-4 shrink-0" />}
        title={
          <LocalizedText
            en="Prerequisites and state details"
            vi="Điều kiện tiên quyết và trạng thái"
          />
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={a.item.kind} />
          <ExecutionBadge state={a.item.execution} />
          <DependencyBadge state={a.item.dependency} />
          <TimingBadge derived={a.derived} />
          <AttentionBadge derived={a.derived} />
        </div>
        {detail && detail.upstream.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {detail.upstream.map((e) => (
              <li key={e.id}>
                <Link
                  href={withFrom(`/matters/${a.matterId}/work/${e.other.id}`, here)}
                  className="underline"
                >
                  {e.other.title}
                </Link>{' '}
                <span className="text-muted-foreground">
                  {e.satisfied ? (
                    <LocalizedText en="satisfied" vi="đã đạt" />
                  ) : (
                    <LocalizedText en="not satisfied" vi="chưa đạt" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!detail && (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Prerequisite details could not be read. Open the task to see them."
              vi="Không đọc được chi tiết điều kiện tiên quyết. Mở tác vụ để xem."
            />
          </p>
        )}
      </Disclosure>
      <Disclosure
        icon={<History aria-hidden className="size-4 shrink-0" />}
        title={<LocalizedText en="History" vi="Lịch sử" />}
      >
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="Changes are recorded per Matter."
            vi="Thay đổi được ghi theo từng hồ sơ."
          />{' '}
          <Link href={withFrom(`/matters/${a.matterId}/history`, here)} className="underline">
            <LocalizedText en="Open the Matter history" vi="Mở lịch sử hồ sơ" />
          </Link>
        </p>
      </Disclosure>
    </section>
  )
}

function Causes({
  edges,
  detailRead,
  here,
  matterId,
}: {
  edges: Detail['upstream']
  detailRead: boolean
  here: string
  matterId: string
}) {
  if (!detailRead) return null
  if (edges.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        <LocalizedText
          en="No unsatisfied prerequisite is listed: this may be a Requirement, which is never a next action."
          vi="Không có điều kiện tiên quyết nào chưa đạt: đây có thể là Yêu cầu, không bao giờ là hành động tiếp theo."
        />
      </p>
    )
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">
        <LocalizedText en="Waiting on these first" vi="Cần hoàn tất trước" />
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {edges.map((e) => (
          <li key={e.id}>
            <Link
              href={withFrom(`/matters/${matterId}/work/${e.other.id}`, here)}
              className="underline"
            >
              {e.other.title}
            </Link>
            {e.reason ? (
              <span className="text-muted-foreground">
                :{' '}
                <LocalizedText
                  en={GATE_REASON[e.reason] ?? e.reason}
                  vi={GATE_VI[e.reason] ?? e.reason}
                />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Step({ href, dir }: { href: string | null; dir: 'previous' | 'next' }) {
  const Icon = dir === 'previous' ? ChevronLeft : ChevronRight
  const label =
    dir === 'previous' ? (
      <LocalizedText en="Previous" vi="Trước" />
    ) : (
      <LocalizedText en="Next" vi="Sau" />
    )
  const body = (
    <>
      {dir === 'previous' && <Icon aria-hidden className="size-4" />}
      {label}
      {dir === 'next' && <Icon aria-hidden className="size-4" />}
    </>
  )
  const cls = 'control-target inline-flex items-center gap-1 rounded-md px-3'
  return href ? (
    <Link href={href} className={cn(cls, 'hover:bg-accent')}>
      {body}
    </Link>
  ) : (
    <span aria-disabled="true" className={cn(cls, 'text-disabled')}>
      {body}
    </span>
  )
}

function UpNext({
  selection,
  matterNames,
}: {
  selection: MyWorkSelection
  matterNames: Record<string, string>
}) {
  const { queue, upNext } = selection
  return (
    <aside aria-labelledby="up-next" className="work-up-next flex flex-col gap-3">
      <h3 id="up-next" className="work-section-title font-semibold">
        <LocalizedText en="Up next" vi="Tiếp theo" />
      </h3>
      {upNext.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="Nothing further in this queue."
            vi="Không còn mục nào trong hàng đợi này."
          />
        </p>
      ) : (
        <ol className="flex flex-col divide-y">
          {upNext.map((a) => (
            <li key={a.item.id}>
              <Link
                href={myWorkHref(queue, a.item.id)}
                className="work-up-next-link flex min-h-11 flex-col justify-center gap-1 hover:underline"
              >
                <span className="font-medium break-words">{a.item.title}</span>
                {matterNames[a.matterId] && (
                  <span className="text-sm break-words text-muted-foreground">
                    {matterNames[a.matterId]}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

function Disclosure({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <details className="work-disclosure group border-t">
      <summary className="control-target flex cursor-pointer list-none items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="min-w-0 break-words">{title}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 pt-3">{children}</div>
    </details>
  )
}
