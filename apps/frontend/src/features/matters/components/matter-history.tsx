'use client'

import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { History } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { useLocale } from '@/hooks/use-locale'

import type { MatterEvent } from '../schemas'

const COPY = {
  en: {
    empty: 'No history yet',
    scope: 'Append-only domain history. Corrections append; restricted security logs are separate.',
    actor: 'Actor',
    target: 'Target',
    effective: 'Effective time',
    recorded: 'Recorded time',
    reason: 'Reason',
    cause: 'Caused by event',
    correlation: 'Correlation',
    command: 'Command key',
    before: 'Before',
    after: 'After',
    missing: 'Not recorded',
    next: 'Next page',
    first: 'First page',
    asOf: 'History read at',
    details: 'Event details',
  },
  vi: {
    empty: 'Chưa có lịch sử',
    scope:
      'Lịch sử nghiệp vụ chỉ được bổ sung. Chỉnh sửa tạo sự kiện mới; nhật ký bảo mật được tách riêng.',
    actor: 'Người thực hiện',
    target: 'Đối tượng',
    effective: 'Thời điểm hiệu lực',
    recorded: 'Thời điểm ghi nhận',
    reason: 'Lý do',
    cause: 'Sự kiện nguyên nhân',
    correlation: 'Mã tương quan',
    command: 'Khóa thao tác',
    before: 'Trước',
    after: 'Sau',
    missing: 'Không được ghi nhận',
    next: 'Trang tiếp',
    first: 'Trang đầu',
    asOf: 'Lịch sử được đọc lúc',
    details: 'Chi tiết sự kiện',
  },
}

/** Display only the scoped API payload, in the recorded ordering returned by the server. */
export function MatterHistory({
  events,
  nextHref,
  firstHref,
  asOf,
  actorNames,
}: {
  events: MatterEvent[]
  nextHref: string | null
  firstHref?: string
  asOf?: string | null
  /** Member names by user id, from the page's authorized member read. Unknown ids are shown as recorded. */
  actorNames?: Record<string, string>
}) {
  const locale = useLocale()
  const c = COPY[locale]
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{c.scope}</p>
      {asOf && (
        <p className="text-xs text-muted-foreground">
          {c.asOf} <LocalizedInstant iso={asOf} />
        </p>
      )}
      {events.length === 0 ? (
        <EmptyState icon={<History />} title={c.empty} />
      ) : (
        <ol className="divide-y rounded-lg border bg-card">
          {events.map((event) => (
            <li key={event.id} id={`event-${event.seq}`} className="scroll-mt-20 p-4">
              <h2 className="mb-3 flex flex-wrap items-baseline gap-2 font-semibold">
                <span className="font-mono text-xs text-muted-foreground">#{event.seq}</span>
                <span className="break-words">{event.type}</span>
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label={c.actor}>
                  <span>
                    {(event.actorId && actorNames?.[event.actorId]) || (event.actorId ?? c.missing)}
                  </span>{' '}
                  <span className="text-muted-foreground">({event.actorKind})</span>
                </Field>
                <Field label={c.target}>
                  <span>
                    {event.targetKind} · {event.targetId}
                  </span>
                </Field>
                <Field label={c.recorded}>
                  <LocalizedInstant iso={event.recordedAt} />
                </Field>
                <Field label={c.effective}>
                  <LocalizedInstant iso={event.effectiveAt} />
                </Field>
                <Field label={c.reason}>{event.reason ?? c.missing}</Field>
                <Field label={c.cause}>
                  {event.causeSeq === null ? c.missing : `#${event.causeSeq}`}
                </Field>
              </dl>
              <details className="mt-3">
                <summary className="control-target w-fit cursor-pointer py-1 text-primary underline">
                  {c.details}
                </summary>
                <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Field label={c.correlation}>{event.correlationId ?? c.missing}</Field>
                  <Field label={c.command}>{event.commandKey ?? c.missing}</Field>
                  <Field label={c.before}>
                    <pre className="font-mono text-xs break-words whitespace-pre-wrap">
                      {event.before === null ? c.missing : JSON.stringify(event.before, null, 2)}
                    </pre>
                  </Field>
                  <Field label={c.after}>
                    <pre className="font-mono text-xs break-words whitespace-pre-wrap">
                      {event.after === null ? c.missing : JSON.stringify(event.after, null, 2)}
                    </pre>
                  </Field>
                </dl>
              </details>
            </li>
          ))}
        </ol>
      )}
      <nav
        aria-label={locale === 'vi' ? 'Phân trang lịch sử' : 'History pagination'}
        className="flex flex-wrap gap-2"
      >
        {firstHref && (
          <Link href={firstHref} className={buttonVariants({ variant: 'outline' })}>
            {c.first}
          </Link>
        )}
        {nextHref && (
          <Link href={nextHref} className={buttonVariants({ variant: 'outline' })}>
            {c.next}
          </Link>
        )}
      </nav>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words whitespace-pre-wrap">{children}</dd>
    </div>
  )
}
