'use client'

import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'

import { briefAction } from '../actions'
import { ACCESS_LOST, ACCESS_LOST_TEXT } from '../labels'
import type { BriefResult } from '../schemas'

/**
 * Draft status brief. What changed in (t1, t2] is shown apart from what is outstanding at t2; an
 * invalid window produces an error and no report at all.
 */
export function BriefSection({ matterId }: { matterId: string }) {
  const [t1, setT1] = useState('')
  const [t2, setT2] = useState('')
  const [brief, setBrief] = useState<BriefResult | null>(null)
  const [error, setError] = useState<{ message: string; fields: Record<string, string[]> } | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  // Plain state rather than a transition: the work is an awaited Server Action and its result is
  // stored by this handler once the answer has arrived.
  const start = (fn: () => Promise<void>) => {
    setPending(true)
    void fn().finally(() => setPending(false))
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="brief-heading">
      <h2 id="brief-heading" className="text-lg font-semibold">
        <LocalizedText en="Draft status brief" vi="Bản nháp báo cáo thay đổi" />
      </h2>
      <p className="text-sm text-muted-foreground">
        A draft for you to review and share. It lists recorded changes after t1 up to and including
        t2, separately from the work still outstanding at t2.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          label={<LocalizedText en="t1 (baseline, excluded)" vi="t1 (mốc đầu, không bao gồm)" />}
          required
          error={error?.fields.t1?.[0]}
          hint={<LocalizedText en="RFC 3339 with an offset" vi="RFC 3339 có độ lệch múi giờ" />}
        >
          {(c) => (
            <Input
              value={t1}
              onChange={(e) => setT1(e.target.value)}
              placeholder="2026-10-01T00:00:00Z"
              {...c}
            />
          )}
        </FormField>
        <FormField
          label={<LocalizedText en="t2 (as of, included)" vi="t2 (mốc cuối, bao gồm)" />}
          required
          error={error?.fields.t2?.[0]}
          hint={<LocalizedText en="RFC 3339 with an offset" vi="RFC 3339 có độ lệch múi giờ" />}
        >
          {(c) => (
            <Input
              value={t2}
              onChange={(e) => setT2(e.target.value)}
              placeholder="2026-10-27T00:00:00Z"
              {...c}
            />
          )}
        </FormField>
      </div>
      <Button
        className="w-fit"
        disabled={pending || !t1 || !t2}
        onClick={() =>
          start(async () => {
            const r = await briefAction(matterId, t1.trim(), t2.trim())
            if (r.ok && r.brief) {
              setBrief(r.brief)
              setError(null)
            } else if (!r.ok && ACCESS_LOST.has(r.kind)) {
              setBrief(null)
              setT1('')
              setT2('')
              setError({ message: ACCESS_LOST_TEXT, fields: {} })
            } else if (!r.ok) {
              setBrief(null) // an invalid window produces no report
              setError({ message: r.error, fields: r.fieldErrors ?? {} })
            }
          })
        }
      >
        <LocalizedText en="Generate brief" vi="Tạo báo cáo" />
      </Button>
      {error && (
        <Alert
          variant="destructive"
          title={<LocalizedText en="No brief was produced" vi="Chưa tạo được báo cáo" />}
        >
          {error.message}
        </Alert>
      )}
      {brief && <BriefBody brief={brief} />}
    </section>
  )
}

export function BriefBody({ brief }: { brief: BriefResult }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p>
        Window ({brief.t1}, {brief.t2}] · source as of {brief.asOf}
      </p>
      <section aria-labelledby="brief-changes">
        <h3 id="brief-changes" className="font-semibold">
          Recorded changes ({brief.changes.length})
        </h3>
        {brief.changes.length === 0 ? (
          <p className="text-muted-foreground">
            <LocalizedText
              en="No changes were recorded in this window."
              vi="Không có thay đổi được ghi nhận trong khoảng này."
            />
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {brief.changes.map((c) => (
              <li key={c.id}>
                <LocalizedInstant iso={c.recordedAt} /> · {c.type} on {c.targetKind}{' '}
                <span className="font-mono">{c.targetId}</span>
                {c.lateRecorded && (
                  <>
                    {' '}
                    <Badge variant="warning">
                      <LocalizedText en="Recorded late" vi="Ghi nhận muộn" />
                    </Badge>{' '}
                    took effect {c.effectiveAt}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="brief-outstanding">
        <h3 id="brief-outstanding" className="font-semibold">
          Outstanding at t2 ({brief.outstanding.length})
        </h3>
        {brief.outstanding.length === 0 ? (
          <p className="text-muted-foreground">
            <LocalizedText
              en="Nothing was outstanding at t2."
              vi="Không còn bản ghi chưa kết thúc tại t2."
            />
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {brief.outstanding.map((o) => (
              <li key={o.itemId}>
                {o.kind === 'REQUIREMENT' ? 'Requirement' : 'Action'} “{o.title}” ·{' '}
                {o.execution ?? 'unknown'} · dependency {o.dependency ?? 'unknown'}
                {o.verification ? ` · verification ${o.verification}` : ''}
                {o.proofExpired && (
                  <>
                    {' '}
                    <Badge variant="warning">
                      <LocalizedText en="Proof expired by t2" vi="Bằng chứng đã hết hạn tại t2" />
                    </Badge>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
