import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import { OBSERVATION_LABEL, STAGE_HELP, STAGE_LABEL, userName } from '../labels'
import { FILING_STAGES, type FilingDetail } from '../schemas'

import { OutcomeVerificationBadge } from './outcome-verification'

export type FilingLabels = {
  users: Record<string, string>
  versions: Record<string, string>
  evidence: Record<string, string>
}

/**
 * Where the filing stands, what was submitted in each cycle, and the append-only record of what
 * was observed. Nothing here is editable: history is corrected by appending a correction.
 */
export function FilingView({ detail, labels }: { detail: FilingDetail; labels: FilingLabels }) {
  const { filing } = detail
  const corrected = new Map(
    detail.observations.filter((o) => o.correctsId).map((o) => [o.correctsId!, o]),
  )
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="stage-heading">
        <h2 id="stage-heading" className="mb-2 text-lg font-semibold">
          <LocalizedText en="Stage" vi="Giai đoạn" />
        </h2>
        <ol className="flex flex-wrap gap-2" aria-label="Filing stages">
          {FILING_STAGES.map((s) => {
            const here = s === filing.stage
            const idx = FILING_STAGES.indexOf(s)
            const reached = idx < FILING_STAGES.indexOf(filing.stage)
            return (
              <li
                key={s}
                aria-current={here ? 'step' : undefined}
                className={`rounded-md border px-2 py-1 text-sm ${here ? 'border-primary font-semibold' : reached ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {STAGE_LABEL[s]}
                {here && (
                  <span className="sr-only">
                    {' '}
                    <LocalizedText en="(current)" vi="(hiện tại)" />
                  </span>
                )}
                {reached && (
                  <span className="sr-only">
                    {' '}
                    <LocalizedText en="(passed)" vi="(đã qua)" />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">{STAGE_HELP[filing.stage]}</p>
        <p className="mt-2">
          <OutcomeVerificationBadge state={detail.outcomeVerification} />
        </p>
        {filing.negativeOpen && (
          <p role="status" className="mt-2 rounded-md border border-destructive p-2 text-sm">
            A {filing.negativeOutcome?.toLowerCase()} is recorded. The filing cannot be approved
            until an owner closes or reopens it.
          </p>
        )}
      </section>

      <section aria-labelledby="signatures-heading">
        <h2 id="signatures-heading" className="mb-2 text-lg font-semibold">
          <LocalizedText en="Signatures" vi="Chữ ký" />
        </h2>
        {filing.signatureNotRequired ? (
          <p className="text-sm">
            Recorded as not required by{' '}
            {userName(labels.users, filing.signatureNotRequiredBy ?? '')}
            {filing.signatureNotRequiredAt ? (
              <>
                {' '}
                on <LocalizedInstant iso={filing.signatureNotRequiredAt} />
              </>
            ) : null}
            : {filing.signatureNotRequiredReason}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            A submission needs an observed signature on a submitted version, unless an owner records
            that signatures do not apply.
          </p>
        )}
      </section>

      <section aria-labelledby="cycles-heading">
        <h2 id="cycles-heading" className="mb-2 text-lg font-semibold">
          <LocalizedText en="Cycles and submissions" vi="Các vòng và lần nộp" />
        </h2>
        <ol className="flex flex-col gap-3">
          {detail.cycles.map((c) => {
            const subs = detail.submissions.filter((s) => s.cycleNo === c.no)
            return (
              <li key={c.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {c.no === 1 ? 'Initial filing' : `Supplement cycle ${c.no - 1}`}
                  {c.no === filing.currentCycle && ' · current'}
                </p>
                {c.no > 1 && (
                  <p className="text-muted-foreground">
                    <LocalizedText en="Authority request" vi="Yêu cầu của cơ quan" /> {c.requestRef}{' '}
                    · owner {userName(labels.users, c.ownerId)}
                    {c.dueAt ? ` · due ${c.dueAt}` : ''}
                  </p>
                )}
                {subs.length === 0 ? (
                  <p className="text-muted-foreground">
                    <LocalizedText en="Not submitted yet." vi="Chưa nộp." />
                  </p>
                ) : (
                  subs.map((s) => (
                    <div key={s.id} className="mt-1">
                      <p>
                        <LocalizedText en="Submitted" vi="Đã nộp" />{' '}
                        <LocalizedInstant iso={s.submittedAt} /> · reference {s.reference}
                      </p>
                      <ul className="list-disc pl-5">
                        {s.versionIds.map((v) => (
                          <li key={v}>{labels.versions[v] ?? `version ${v.slice(0, 8)}`}</li>
                        ))}
                        {s.externalRefs.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="mb-2 text-lg font-semibold">
          <LocalizedText en="What was observed" vi="Các ghi nhận" />
        </h2>
        {detail.observations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText en="Nothing has been recorded yet." vi="Chưa có ghi nhận." />
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {detail.observations.map((o) => (
              <li key={o.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {OBSERVATION_LABEL[o.kind] ?? o.kind}
                  {o.kind === 'STAGE' &&
                    `: ${STAGE_LABEL[o.from as keyof typeof STAGE_LABEL] ?? o.from} → ${STAGE_LABEL[o.to as keyof typeof STAGE_LABEL] ?? o.to}`}
                  {o.outcome ? ` (${o.outcome.toLowerCase()})` : ''}
                </p>
                <p className="text-muted-foreground">
                  Observed <LocalizedInstant iso={o.observedAt} /> · recorded{' '}
                  <LocalizedInstant iso={o.recordedAt} /> by {userName(labels.users, o.actor)}
                  {o.cycleNo > 1 ? ` · cycle ${o.cycleNo}` : ''}
                </p>
                {o.reference && (
                  <p>
                    <LocalizedText en="Reference" vi="Tham chiếu" /> {o.reference}
                  </p>
                )}
                {o.reason && <p className="break-words">{o.reason}</p>}
                {o.evidenceIds.length > 0 && (
                  <p>
                    <LocalizedText en="Evidence:" vi="Bằng chứng:" />{' '}
                    {o.evidenceIds.map((e) => labels.evidence[e] ?? e.slice(0, 8)).join(', ')}
                  </p>
                )}
                {corrected.has(o.id) && (
                  <p className="text-muted-foreground">
                    Corrected: reference is now {corrected.get(o.id)!.reference}.
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
