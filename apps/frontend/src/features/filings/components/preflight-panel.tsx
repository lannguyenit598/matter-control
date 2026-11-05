import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { LocalizedText } from '@/components/molecules/localized-text'

import { PREFLIGHT_PURPOSE_LABEL, PREFLIGHT_STATE_LABEL, preflightCause } from '../labels'
import type { FilingPreflight, PreflightRow } from '../schemas'

const GROUPS = ['PACKAGE', 'SIGNATURE', 'OUTCOME'] as const

function Row({ row, subjectHref }: { row: PreflightRow; subjectHref: string }) {
  const cause = preflightCause(row)
  const state = PREFLIGHT_STATE_LABEL[row.state] ?? { en: row.state, vi: row.state }
  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex flex-wrap items-baseline gap-2">
        {row.title ? <span className="text-sm font-medium">{row.title}</span> : null}
        <span className="text-xs tracking-wide uppercase" aria-hidden>
          ·
        </span>
        <span className={`text-xs font-medium ${row.blocking ? 'text-destructive' : ''}`}>
          <LocalizedText en={state.en} vi={state.vi} />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        <LocalizedText en={cause.en} vi={cause.vi} />
      </p>
      {row.waiverRationale ? (
        <p className="text-sm text-muted-foreground">
          <LocalizedText en="Owner’s reason: " vi="Lý do của chủ hồ sơ: " />
          {row.waiverRationale}
        </p>
      ) : null}
      {row.blocking ? (
        <Link href={subjectHref} className="text-sm underline focus-visible:outline-2">
          <LocalizedText en="Open the proof details" vi="Mở chi tiết bằng chứng" />
        </Link>
      ) : null}
    </li>
  )
}

/**
 * Proof-readiness read model (MC-PREFLIGHT-01), display-only. The panel never claims full
 * submittability — stage legality and submission inputs stay the command forms' business
 * (design D-20). Every status carries its cause; the as-of line is always visible.
 */
export function PreflightPanel({
  preflight,
  subjectHref,
}: {
  preflight: FilingPreflight
  subjectHref: string
}) {
  const missing = preflight.rows.filter((r) => r.blocking).length
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <LocalizedText en="Proof readiness" vi="Sẵn sàng về bằng chứng" />:{' '}
          {preflight.ready ? (
            <LocalizedText en="Ready" vi="Đủ" />
          ) : (
            <LocalizedText en="Not ready" vi="Chưa" />
          )}
          {missing > 0 ? (
            <>
              {' · '}
              <LocalizedText
                en={`${missing} requirement${missing === 1 ? '' : 's'} missing`}
                vi={`còn ${missing} điều kiện thiếu`}
              />
            </>
          ) : null}
        </CardTitle>
        <CardDescription>
          <LocalizedText
            en="Readiness about the filing's proof only; submission also checks the stage and the exact versions."
            vi="Chỉ nói về bằng chứng của hồ sơ khai; việc nộp còn kiểm tra giai đoạn và phiên bản nộp cụ thể."
          />{' '}
          <LocalizedText en="Data as of" vi="Dữ liệu tại" /> {preflight.asOf}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {GROUPS.map((purpose) => {
            const rows = preflight.rows.filter((r) => r.purpose === purpose)
            if (rows.length === 0) return null
            const label = PREFLIGHT_PURPOSE_LABEL[purpose] ?? { en: purpose, vi: purpose }
            return (
              <section key={purpose} aria-label={label.en}>
                <h3 className="text-sm font-semibold">
                  <LocalizedText en={label.en} vi={label.vi} />
                </h3>
                <ul className="divide-y">
                  {rows.map((r, i) => (
                    <Row
                      key={`${r.kind}:${r.criterionId ?? i}`}
                      row={r}
                      subjectHref={subjectHref}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
