import Link from 'next/link'

import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { withFrom } from '@/lib/mc/paths'

import { ATTENTION_REASON } from '../labels'
import { myWorkHref, QUEUES, type Queue } from '../my-work-selection'
import type { Assigned, Envelope } from '../schemas'

const LABEL: Record<Queue, { en: string; vi: string }> = {
  ready: { en: 'ready', vi: 'sẵn sàng' },
  waiting: { en: 'waiting', vi: 'đang chờ' },
  blocked: { en: 'blocked', vi: 'bị chặn' },
  history: { en: 'finished', vi: 'đã xong' },
}

/**
 * The first thing on a Matter: what is blocked and why, and what is the caller's own next step.
 * Both lists come from existing reads; nothing here is scored or summed into a readiness figure.
 */
export function MatterAttention({
  matterId,
  here,
  blocked,
  blockedTotal,
  mine,
}: {
  matterId: string
  here: string
  /** Blocked Actions as the server ordered them, already limited. Null when they could not be read. */
  blocked: Envelope[] | null
  /** Exact count when the API gave one; null means only "at least what is shown". */
  blockedTotal: number | null
  /** The caller's assigned work in this Matter, per /me/actions class. Null when it could not be read. */
  mine: Record<Queue, Assigned[]> | null
}) {
  const grid = `/matters/${encodeURIComponent(matterId)}/work?kind=ACTION&dependency=BLOCKED`
  const firstReady = mine?.ready[0]
  const hasMine = mine ? QUEUES.some((q) => mine[q].length > 0) : false
  return (
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
      <section aria-labelledby="blocked-here" className="flex flex-col gap-3">
        <h2 id="blocked-here" className="text-lg font-semibold">
          <LocalizedText en="Blocked here" vi="Đang bị chặn ở hồ sơ này" />
        </h2>
        {blocked === null ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Blocked work could not be read. Open Work to see it."
              vi="Không đọc được việc bị chặn. Mở Công việc để xem."
            />
          </p>
        ) : blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="No Action in this matter is blocked by prerequisites."
              vi="Không có hành động nào trong hồ sơ này bị chặn bởi điều kiện tiên quyết."
            />
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y">
              {blocked.map((e) => (
                <li key={e.item.id} className="flex flex-col gap-0.5 py-2">
                  <Link
                    href={withFrom(`/matters/${matterId}/work/${e.item.id}`, here)}
                    className="font-medium break-words underline"
                  >
                    {e.item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    <LocalizedText
                      en={`${e.item.dependencyReasons.length} prerequisite(s) not satisfied`}
                      vi={`${e.item.dependencyReasons.length} điều kiện tiên quyết chưa đạt`}
                    />
                    {e.derived.attentionReasons.length > 0 &&
                      `; ${e.derived.attentionReasons.map((r) => ATTENTION_REASON[r] ?? r).join('; ')}`}
                    {e.item.dueAt && (
                      <>
                        {' · '}
                        <LocalizedText en="Due" vi="Hạn" /> <LocalizedInstant iso={e.item.dueAt} />
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              <LocalizedText
                en={
                  blockedTotal !== null
                    ? `Showing ${blocked.length} of ${blockedTotal}.`
                    : `Showing the first ${blocked.length}; there may be more.`
                }
                vi={
                  blockedTotal !== null
                    ? `Hiển thị ${blocked.length} trên ${blockedTotal}.`
                    : `Hiển thị ${blocked.length} mục đầu; có thể còn nữa.`
                }
              />{' '}
              <Link href={grid} className="underline">
                <LocalizedText en="See all in Work" vi="Xem tất cả trong Công việc" />
              </Link>
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="mine-here" className="flex flex-col gap-3">
        <h2 id="mine-here" className="text-lg font-semibold">
          <LocalizedText en="Your work here" vi="Việc của bạn ở hồ sơ này" />
        </h2>
        {mine === null ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Your assigned work could not be read. Open My work to try again."
              vi="Không đọc được việc được giao cho bạn. Mở Việc của tôi để thử lại."
            />
          </p>
        ) : !hasMine ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Nothing in this matter is assigned to you."
              vi="Không có việc nào trong hồ sơ này được giao cho bạn."
            />
          </p>
        ) : (
          <>
            {firstReady && (
              <p>
                <Link
                  href={myWorkHref('ready', firstReady.item.id)}
                  className="font-medium break-words underline"
                >
                  {firstReady.item.title}
                </Link>{' '}
                <span className="text-sm text-muted-foreground">
                  <LocalizedText
                    en="is your next step here."
                    vi="là bước tiếp theo của bạn ở đây."
                  />
                </span>
              </p>
            )}
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {QUEUES.filter((q) => mine[q].length > 0).map((q) => (
                <li key={q}>
                  <Link href={myWorkHref(q)} className="underline">
                    {mine[q].length} <LocalizedText en={LABEL[q].en} vi={LABEL[q].vi} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
