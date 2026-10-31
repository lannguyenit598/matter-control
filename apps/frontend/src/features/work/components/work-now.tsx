import type { ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'

import {
  ATTENTION_REASON,
  primaryTransition,
  TRANSITION_CONSEQUENCE,
  TRANSITION_VERB,
} from '../labels'
import type { Derived, WorkItem } from '../schemas'

import { TimingBadge } from './work-badges'

/**
 * The reasons this record matters now, in the order a person decides: what blocks it, who it waits
 * on, and what is late or escalated. Wording comes only from the label tables, never from server
 * text. Nothing here is a score.
 */
export function whyNow(
  item: WorkItem,
  derived: Derived,
  partyName: string | undefined,
): ReactNode[] {
  const out: ReactNode[] = []
  if (item.dependencyReasons.length > 0) {
    out.push(
      <LocalizedText
        key="blocked"
        en={`Blocked: ${item.dependencyReasons.length} prerequisite(s) are not satisfied (see Prerequisites below).`}
        vi={`Bị chặn: ${item.dependencyReasons.length} điều kiện tiên quyết chưa đạt (xem Điều kiện tiên quyết bên dưới).`}
      />,
    )
  }
  if (item.execution === 'WAITING') {
    out.push(
      <LocalizedText
        key="waiting"
        en={`Waiting on ${partyName ?? 'an external party'}: ${item.waitingCondition ?? 'no condition recorded'}.`}
        vi={`Đang chờ ${partyName ?? 'bên ngoài'}: ${item.waitingCondition ?? 'chưa ghi điều kiện'}.`}
      />,
    )
  }
  const reasons = derived.attentionReasons.filter((r) => r !== 'WAITING')
  if (reasons.length > 0) {
    out.push(
      <LocalizedText
        key="attention"
        en={`Needs attention: ${reasons.map((r) => ATTENTION_REASON[r] ?? r).join('; ')}.`}
        vi={`Cần chú ý: ${reasons.map((r) => ATTENTION_REASON[r] ?? r).join('; ')}.`}
      />,
    )
  }
  return out
}

/**
 * Lead of a work record (BF-09): why it matters now, the outcome it must reach, and one meaningful
 * next operation permitted by its state and the caller's role. The status form is passed in as
 * `children` so every real control, error and recovery path stays exactly as it was.
 */
export function WorkNow({
  item,
  derived,
  role,
  partyName,
  children,
}: {
  item: WorkItem
  derived: Derived
  role: string
  partyName?: string
  children: ReactNode
}) {
  const reasons = whyNow(item, derived, partyName)
  const primary = primaryTransition(item.execution, role)
  const consequence = primary ? TRANSITION_CONSEQUENCE[primary] : undefined
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="why-now" className="flex flex-col gap-2">
        <h2 id="why-now" className="text-lg font-semibold">
          <LocalizedText en="Why it matters now" vi="Vì sao cần xem ngay" />
        </h2>
        {reasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Nothing blocks it and nothing is late."
              vi="Không có gì chặn và không có gì quá hạn."
            />
          </p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <TimingBadge derived={derived} />
        </p>
      </section>
      <section aria-labelledby="expected-outcome" className="flex flex-col gap-1">
        <h2 id="expected-outcome" className="text-lg font-semibold">
          <LocalizedText en="Outcome to reach" vi="Kết quả cần đạt" />
        </h2>
        <p className="text-sm break-words whitespace-pre-wrap">{item.outcome}</p>
      </section>
      <section aria-labelledby="next-step" className="flex flex-col gap-2">
        <h2 id="next-step" className="text-lg font-semibold">
          <LocalizedText en="Next step" vi="Bước tiếp theo" />
        </h2>
        {/* With no step to take, the status panel below says why (read-only or finished). */}
        {primary && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{TRANSITION_VERB[primary]}.</strong>{' '}
            {consequence && <LocalizedText en={consequence.en} vi={consequence.vi} />}
          </p>
        )}
        {children}
      </section>
    </div>
  )
}
