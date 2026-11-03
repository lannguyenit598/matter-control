'use client'

import { Info } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'
import { IconDisclosure } from '@/components/molecules/icon-disclosure'
import { LocalDateTimeField } from '@/components/molecules/local-datetime-field'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useTimeZone } from '@/hooks/use-time-zone'
import { readLocalField } from '@/lib/mc/local-time'

import { briefAction } from '../actions'
import {
  ACCESS_LOST,
  ACCESS_LOST_TEXT,
  changePhrase,
  dependencyPhrase,
  executionPhrase,
  targetHref,
  targetNoun,
  verificationPhrase,
} from '../labels'
import type { BriefResult } from '../schemas'

const DAY = 24 * 60 * 60 * 1000
// The API refuses an end after its own read boundary, so "now" stays a few seconds behind this
// device's clock instead of failing on a small clock difference.
const SKEW = 5000

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')

/**
 * Draft status brief. What changed after the start up to and including the end is shown apart
 * from what is still outstanding at the end; an invalid window produces an error and no report.
 * The window is typed as ordinary date and time in the device zone; the exact (t1, t2] semantics
 * and the recorded-versus-effective-time distinction are unchanged.
 */
export function BriefSection({ matterId }: { matterId: string }) {
  const zone = useTimeZone()
  const [formKey, setFormKey] = useState(0)
  const [brief, setBrief] = useState<BriefResult | null>(null)
  const [error, setError] = useState<{ message: string; fields: Record<string, string[]> } | null>(
    null,
  )
  const [pending, setPending] = useState(false)

  // Plain state rather than a transition: the work is an awaited Server Action and its result is
  // stored by this handler once the answer has arrived.
  const run = (t1: string, t2: string) => {
    setPending(true)
    void (async () => {
      const r = await briefAction(matterId, t1, t2)
      if (r.ok && r.brief) {
        setBrief(r.brief)
        setError(null)
      } else if (!r.ok && ACCESS_LOST.has(r.kind)) {
        setBrief(null)
        setFormKey((k) => k + 1) // forget the typed window with the report
        setError({ message: ACCESS_LOST_TEXT, fields: {} })
      } else if (!r.ok) {
        setBrief(null) // an invalid window produces no report
        setError({ message: r.error, fields: r.fieldErrors ?? {} })
      }
    })().finally(() => setPending(false))
  }

  const refuse = (fields: Record<string, string[]>) => {
    setBrief(null)
    setError({ message: 'Please fix the highlighted fields.', fields })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()].filter(
        (e): e is [string, string] => typeof e[1] === 'string',
      ),
    )
    const from = readLocalField(values, 'from', zone, null)
    const to = readLocalField(values, 'to', zone, null)
    const fields: Record<string, string[]> = {}
    if (!from.ok) fields.t1 = [from.error]
    else if (!from.iso) fields.t1 = ['Choose where the window starts.']
    if (!to.ok) fields.t2 = [to.error]
    if (Object.keys(fields).length > 0 || !from.ok || !to.ok) return refuse(fields)
    run(from.iso, to.iso || iso(Date.now() - SKEW))
  }

  const preset = (days: number) => run(iso(Date.now() - days * DAY), iso(Date.now() - SKEW))

  return (
    <section
      id="status-brief"
      className="flex scroll-mt-20 flex-col gap-3"
      aria-labelledby="brief-heading"
    >
      <h2 id="brief-heading" className="text-lg font-semibold">
        <LocalizedText en="Draft status brief" vi="Bản nháp báo cáo thay đổi" />
      </h2>
      <p className="text-sm text-muted-foreground">
        <LocalizedText
          en="A draft for you to review and share. It lists recorded changes after the start up to and including the end, separately from the work still outstanding at the end."
          vi="Bản nháp để bạn xem lại và chia sẻ. Báo cáo liệt kê các thay đổi đã ghi nhận sau mốc đầu đến hết mốc cuối, tách riêng với công việc còn dang dở tại mốc cuối."
        />
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick windows">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => preset(7)}>
          <LocalizedText en="Last 7 days" vi="7 ngày qua" />
        </Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => preset(30)}>
          <LocalizedText en="Last 30 days" vi="30 ngày qua" />
        </Button>
      </div>
      <form key={formKey} onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <LocalDateTimeField
            name="from"
            required
            label={
              <LocalizedText
                en="Changes after (excluded)"
                vi="Thay đổi sau thời điểm (không gồm)"
              />
            }
            error={error?.fields.t1?.[0]}
          />
          <LocalDateTimeField
            name="to"
            label={<LocalizedText en="Up to and including" vi="Đến hết thời điểm (gồm)" />}
            hint={<LocalizedText en="Empty means now." vi="Để trống là hiện tại." />}
            error={error?.fields.t2?.[0]}
          />
        </div>
        <Button type="submit" className="w-fit" loading={pending}>
          <LocalizedText en="Generate brief" vi="Tạo báo cáo" />
        </Button>
      </form>
      {error && (
        <Alert
          variant="destructive"
          title={<LocalizedText en="No brief was produced" vi="Chưa tạo được báo cáo" />}
        >
          {error.message}
        </Alert>
      )}
      {brief && <BriefBody brief={brief} matterId={matterId} />}
    </section>
  )
}

export function BriefBody({ brief, matterId }: { brief: BriefResult; matterId: string }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p>
        <LocalizedText en="Window" vi="Khoảng" />: <LocalizedInstant iso={brief.t1} />{' '}
        <LocalizedText en="(excluded)" vi="(không gồm)" /> → <LocalizedInstant iso={brief.t2} />{' '}
        <LocalizedText en="(included)" vi="(gồm)" /> ·{' '}
        <LocalizedText en="source as of" vi="dữ liệu tại" /> <LocalizedInstant iso={brief.asOf} />
      </p>
      <p className="text-muted-foreground">
        <LocalizedText
          en="Names are as they were when each change was recorded. A link opens the record as it is now. This is a draft for human review."
          vi="Tên là tên tại thời điểm mỗi thay đổi được ghi nhận. Liên kết mở bản ghi ở trạng thái hiện tại. Đây là bản nháp để người xem xét."
        />
      </p>
      <section aria-labelledby="brief-changes">
        <h3 id="brief-changes" className="font-semibold">
          <LocalizedText en="Recorded changes" vi="Thay đổi đã ghi nhận" /> ({brief.changes.length})
        </h3>
        {brief.changes.length === 0 ? (
          <p className="text-muted-foreground">
            <LocalizedText
              en="No changes were recorded in this window."
              vi="Không có thay đổi được ghi nhận trong khoảng này."
            />
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-2">
            {brief.changes.map((c) => {
              const noun = targetNoun(c.targetKind)
              const phrase = changePhrase(c.type)
              const href = targetHref(matterId, c.targetKind, c.targetId)
              return (
                <li key={c.id} className="flex flex-col gap-1">
                  <p>
                    <LocalizedInstant iso={c.recordedAt} /> ·{' '}
                    <LocalizedText en={noun.en} vi={noun.vi} />{' '}
                    {c.targetLabel ? (
                      <>“{c.targetLabel}”</>
                    ) : (
                      <span className="text-muted-foreground">
                        <LocalizedText
                          en="(no name was recorded with this change)"
                          vi="(thay đổi này không ghi tên)"
                        />
                      </span>
                    )}{' '}
                    <LocalizedText en={phrase.en} vi={phrase.vi} />
                    {href && (
                      <>
                        {' · '}
                        <Link href={href} className="underline">
                          <LocalizedText en="Open" vi="Mở" />
                        </Link>
                      </>
                    )}
                    {c.lateRecorded && (
                      <>
                        {' '}
                        <Badge variant="warning">
                          <LocalizedText en="Recorded late" vi="Ghi nhận muộn" />
                        </Badge>{' '}
                        <LocalizedText en="took effect" vi="có hiệu lực từ" />{' '}
                        {c.effectiveAt ? <LocalizedInstant iso={c.effectiveAt} /> : null}
                      </>
                    )}
                  </p>
                  <IconDisclosure
                    className="text-xs text-muted-foreground"
                    icon={<Info />}
                    label={{ en: 'Technical details', vi: 'Chi tiết kỹ thuật' }}
                  >
                    <p className="font-mono break-all">
                      {c.type} · {c.targetKind} · {c.targetId}
                      {c.actorId ? ` · by ${c.actorId}` : ''}
                      {c.reason ? ` · reason: ${c.reason}` : ''}
                    </p>
                  </IconDisclosure>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <section aria-labelledby="brief-outstanding">
        <h3 id="brief-outstanding" className="font-semibold">
          <LocalizedText en="Outstanding at the end of the window" vi="Còn dang dở tại mốc cuối" />{' '}
          ({brief.outstanding.length})
        </h3>
        {brief.outstanding.length === 0 ? (
          <p className="text-muted-foreground">
            <LocalizedText
              en="Nothing was outstanding at the end of the window."
              vi="Không còn bản ghi chưa kết thúc tại mốc cuối."
            />
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {brief.outstanding.map((o) => {
              const href = targetHref(matterId, o.kind, o.itemId)
              const ex = o.execution ? executionPhrase(o.execution) : null
              const dep = o.dependency ? dependencyPhrase(o.dependency) : null
              const ver = o.verification ? verificationPhrase(o.verification) : null
              return (
                <li key={o.itemId}>
                  {o.kind === 'REQUIREMENT' ? (
                    <LocalizedText en="Requirement" vi="Yêu cầu" />
                  ) : (
                    <LocalizedText en="Action" vi="Hành động" />
                  )}{' '}
                  “{o.title}” ·{' '}
                  {ex ? (
                    <LocalizedText en={ex.en} vi={ex.vi} />
                  ) : (
                    <LocalizedText en="status unknown" vi="chưa rõ trạng thái" />
                  )}
                  {dep && (
                    <>
                      {' · '}
                      <LocalizedText en={dep.en} vi={dep.vi} />
                    </>
                  )}
                  {ver && (
                    <>
                      {' · '}
                      <LocalizedText en={ver.en} vi={ver.vi} />
                    </>
                  )}
                  {href && (
                    <>
                      {' · '}
                      <Link href={href} className="underline">
                        <LocalizedText en="Open" vi="Mở" />
                      </Link>
                    </>
                  )}
                  {o.proofExpired && (
                    <>
                      {' '}
                      <Badge variant="warning">
                        <LocalizedText
                          en="Proof expired by the end of the window"
                          vi="Bằng chứng đã hết hạn tại mốc cuối"
                        />
                      </Badge>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
