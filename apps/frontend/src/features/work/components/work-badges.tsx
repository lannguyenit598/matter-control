import { LocalizedText } from '@/components/molecules/localized-text'
import { AlertTriangle, CircleCheck, Clock, Hourglass, Lock, OctagonAlert } from 'lucide-react'

import { Badge, type BadgeVariant } from '@/components/atoms/badge'

import {
  ATTENTION_LABEL,
  ATTENTION_REASON,
  DEPENDENCY_LABEL,
  EXECUTION_LABEL,
  KIND_LABEL,
  TIMING_LABEL,
  VERIFICATION_LABEL,
} from '../labels'
import type { Derived, WorkItem } from '../schemas'

/** Each axis has its own badge: never merged into one status, never conveyed by colour alone. */

export function KindBadge({ kind }: { kind: string }) {
  return (
    <Badge variant={kind === 'REQUIREMENT' ? 'primary' : 'outline'}>
      <LocalizedText
        en={KIND_LABEL[kind] ?? kind}
        vi={
          ({ Requirement: 'Yêu cầu', Action: 'Hành động' } as Record<string, string>)[
            KIND_LABEL[kind] ?? kind
          ] ??
          KIND_LABEL[kind] ??
          kind
        }
      />
    </Badge>
  )
}

export function ExecutionBadge({ state }: { state: string }) {
  const variant: BadgeVariant = 'execution'
  const Icon = state === 'COMPLETED' ? CircleCheck : state === 'WAITING' ? Hourglass : null
  return (
    <Badge variant={variant}>
      {Icon && <Icon aria-hidden className="size-3" />}
      <LocalizedText
        en={EXECUTION_LABEL[state] ?? state}
        vi={
          (
            {
              'Not started': 'Chưa bắt đầu',
              'In progress': 'Đang thực hiện',
              Waiting: 'Đang chờ',
              Completed: 'Đã hoàn tất',
              Cancelled: 'Đã hủy',
            } as Record<string, string>
          )[EXECUTION_LABEL[state] ?? state] ??
          EXECUTION_LABEL[state] ??
          state
        }
      />
    </Badge>
  )
}

export function DependencyBadge({ state }: { state: string }) {
  return (
    <Badge variant={state === 'BLOCKED' ? 'blocked' : 'ready'}>
      {state === 'BLOCKED' && <Lock aria-hidden className="size-3" />}
      <LocalizedText
        en={DEPENDENCY_LABEL[state] ?? state}
        vi={
          ({ Ready: 'Sẵn sàng', Blocked: 'Bị chặn' } as Record<string, string>)[
            DEPENDENCY_LABEL[state] ?? state
          ] ??
          DEPENDENCY_LABEL[state] ??
          state
        }
      />
    </Badge>
  )
}

export function TimingBadge({ derived }: { derived: Derived }) {
  if (derived.noDueDate) {
    // No deadline is never evidence of schedule health.
    return (
      <Badge variant="outline">
        <LocalizedText en="No due date" vi="Chưa có hạn" />
      </Badge>
    )
  }
  const variant: BadgeVariant =
    derived.timing === 'OVERDUE' ? 'timing' : derived.timing === 'DUE_SOON' ? 'timing' : 'neutral'
  return (
    <Badge variant={variant}>
      {derived.timing !== 'ON_TRACK' && <Clock aria-hidden className="size-3" />}
      <LocalizedText
        en={TIMING_LABEL[derived.timing] ?? derived.timing}
        vi={
          (
            { 'On track': 'Đúng hạn', 'Due soon': 'Sắp đến hạn', Overdue: 'Quá hạn' } as Record<
              string,
              string
            >
          )[TIMING_LABEL[derived.timing] ?? derived.timing] ??
          TIMING_LABEL[derived.timing] ??
          derived.timing
        }
      />
    </Badge>
  )
}

export function AttentionBadge({ derived }: { derived: Derived }) {
  const reasons = derived.attentionReasons.map((r) => ATTENTION_REASON[r] ?? r).join('; ')
  const variant: BadgeVariant =
    derived.attention === 'CRITICAL'
      ? 'blocked'
      : derived.attention === 'ATTENTION'
        ? 'attention'
        : 'neutral'
  const Icon =
    derived.attention === 'CRITICAL'
      ? OctagonAlert
      : derived.attention === 'ATTENTION'
        ? AlertTriangle
        : null
  return (
    <Badge variant={variant} title={reasons || undefined}>
      {Icon && <Icon aria-hidden className="size-3" />}
      <LocalizedText
        en={ATTENTION_LABEL[derived.attention] ?? derived.attention}
        vi={
          (
            {
              Normal: 'Bình thường',
              'Needs attention': 'Cần chú ý',
              Critical: 'Nghiêm trọng',
            } as Record<string, string>
          )[ATTENTION_LABEL[derived.attention] ?? derived.attention] ??
          ATTENTION_LABEL[derived.attention] ??
          derived.attention
        }
      />
    </Badge>
  )
}

export function VerificationBadge({ item }: { item: WorkItem }) {
  if (!item.verification)
    return (
      <Badge variant="outline">
        <LocalizedText en="No proof required" vi="Không cần bằng chứng" />
      </Badge>
    )
  return (
    <Badge
      variant={
        item.verification === 'VERIFIED'
          ? 'verification'
          : item.verification === 'DISPUTED'
            ? 'destructive'
            : 'warning'
      }
    >
      <LocalizedText
        en={VERIFICATION_LABEL[item.verification] ?? item.verification}
        vi={
          (
            {
              'Not required': 'Không bắt buộc',
              Unverified: 'Chưa xác minh',
              'Partially verified': 'Đã xác minh một phần',
              Verified: 'Đã xác minh',
              Disputed: 'Đang tranh chấp',
            } as Record<string, string>
          )[VERIFICATION_LABEL[item.verification] ?? item.verification] ??
          VERIFICATION_LABEL[item.verification] ??
          item.verification
        }
      />
    </Badge>
  )
}

const OUTCOME_AXIS: Record<string, { en: string; vi: string; variant: 'warning' | 'success' }> = {
  NOT_DECLARED: { en: 'Outcome: not declared', vi: 'Kết quả: chưa khai báo', variant: 'warning' },
  PENDING: { en: 'Outcome: pending', vi: 'Kết quả: đang chờ', variant: 'warning' },
  ACCEPTED: { en: 'Outcome: verified', vi: 'Kết quả: đã xác minh', variant: 'success' },
  NOT_TRACKED: { en: 'Outcome: not tracked', vi: 'Kết quả: không theo dõi', variant: 'warning' },
}

/**
 * The filing's own outcome axis (Z-F-03), shown beside the package-driven verification aggregate
 * so one axis never hides the other. Nothing is shown when the API did not state it (non-filing).
 */
export function OutcomeAxisBadge({ state }: { state: string | undefined }) {
  const t = state ? OUTCOME_AXIS[state] : undefined
  if (!t) return null
  return (
    <Badge variant={t.variant} data-slot="outcome-axis">
      <LocalizedText en={t.en} vi={t.vi} />
    </Badge>
  )
}
