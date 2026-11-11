'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Alert } from '@/components/molecules/alert'
import { Button } from '@/components/atoms/button'
import { Dialog } from '@/components/molecules/dialog'
import { EmptyState } from '@/components/molecules/empty-state'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useLocale } from '@/hooks/use-locale'
import { callMcAction, type McActionResult } from '@/lib/mc/action-result'

import { markSeenAction } from '../actions'
import { NOTIFICATION_KINDS, type NotificationItem, type NotificationKind } from '../schemas'

/** Severity order of the kinds: the panel groups in this order, whatever the API returned. */
const KIND_ORDER = NOTIFICATION_KINDS

const KIND_LABELS: Record<NotificationKind, { en: string; vi: string }> = {
  OVERDUE: { en: 'Overdue', vi: 'Quá hạn' },
  BLOCKED: { en: 'Blocked', vi: 'Bị chặn' },
  DUE_SOON: { en: 'Due soon', vi: 'Sắp đến hạn' },
  REVIEW_PENDING: { en: 'Pending review', vi: 'Chờ bạn xác minh' },
}

/**
 * The header bell. The unread count comes from the server read (createdAt against seenAt); the
 * panel is the shared modal Dialog, so Escape-to-close and focus return to the bell are the
 * browser's own behaviour — the same discipline as the command palette.
 */
export function BellButton({
  items,
  seenAt,
  unread,
}: {
  items: NotificationItem[]
  seenAt: string | null
  unread: number
}) {
  const locale = useLocale()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [failure, setFailure] = useState<Extract<McActionResult, { ok: false }> | null>(null)
  const [pending, start] = useTransition()

  const name = locale === 'vi' ? 'Thông báo' : 'Notifications'
  const capped = unread > 9 ? '9+' : String(unread)
  const label = unread > 0 ? `${name} (${capped})` : name

  function markSeen() {
    start(async () => {
      setFailure(null)
      const r = await callMcAction(() => markSeenAction(), { receipted: false })
      // Seen is recomputed from seenAt on the server, so the refresh alone moves the badge.
      if (r.ok) router.refresh()
      else setFailure(r)
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Bell aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-white"
          >
            {capped}
          </span>
        )}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setFailure(null)
        }}
        title={<LocalizedText en="Notifications" vi="Thông báo" />}
        description={
          <LocalizedText
            en="Work that needs you: overdue, blocked, due soon or waiting for your review."
            vi="Công việc cần bạn: quá hạn, bị chặn, sắp đến hạn hoặc đang chờ bạn xác minh."
          />
        }
      >
        {items.length === 0 ? (
          <EmptyState
            titleAs="h3"
            className="py-8"
            title={<LocalizedText en="No notifications" vi="Không có thông báo nào" />}
            description={
              <LocalizedText
                en="Overdue, blocked and review items will appear here."
                vi="Các mục quá hạn, bị chặn và chờ xác minh sẽ xuất hiện tại đây."
              />
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {KIND_ORDER.map((kind) => {
                const group = items.filter((item) => item.kind === kind)
                if (group.length === 0) return null
                const kindLabel = KIND_LABELS[kind]
                return (
                  <section
                    key={kind}
                    aria-labelledby={`bell-${kind}`}
                    className="flex flex-col gap-2"
                  >
                    <h3 id={`bell-${kind}`} className="text-xs font-semibold text-muted-foreground">
                      {locale === 'vi' ? kindLabel.vi : kindLabel.en} · {group.length}
                    </h3>
                    <ul className="flex flex-col divide-y">
                      {group.map((item) => (
                        <BellRow key={item.id} item={item} close={() => setOpen(false)} />
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
            <div className="flex flex-col gap-2">
              {failure && (
                <Alert variant="destructive">
                  <LocalizedText en="Could not save" vi="Không thể lưu" />: {failure.error}
                </Alert>
              )}
              <Button
                type="button"
                variant="outline"
                className="self-start"
                loading={pending}
                onClick={markSeen}
              >
                <LocalizedText en="Mark as seen" vi="Đánh dấu đã xem" />
              </Button>
              {seenAt && (
                <p className="text-xs text-muted-foreground">
                  <LocalizedText en="Seen" vi="Đã xem" />: <LocalizedInstant iso={seenAt} />
                </p>
              )}
            </div>
          </>
        )}
      </Dialog>
    </>
  )
}

/** One notification: opens its matter, or the review queue for items waiting on the caller. */
function BellRow({ item, close }: { item: NotificationItem; close: () => void }) {
  const href =
    item.kind === 'REVIEW_PENDING'
      ? '/my-reviews'
      : item.matterId
        ? `/matters/${item.matterId}`
        : null
  const body = (
    <>
      <span className="text-sm font-medium break-words">{item.title}</span>
      <span className="text-xs text-muted-foreground">
        {item.matterTitle && <span className="break-words">{item.matterTitle} · </span>}
        {item.dueAt ? (
          <LocalizedInstant iso={item.dueAt} />
        ) : (
          <LocalizedInstant iso={item.createdAt} />
        )}
      </span>
    </>
  )
  return (
    <li className="py-2">
      {href ? (
        <Link
          href={href}
          onClick={close}
          className="flex flex-col gap-0.5 underline-offset-2 hover:underline"
        >
          {body}
        </Link>
      ) : (
        <div className="flex flex-col gap-0.5">{body}</div>
      )}
    </li>
  )
}
