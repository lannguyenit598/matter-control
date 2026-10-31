import { Badge } from '@/components/atoms/badge'
import { LocalizedText } from '@/components/molecules/localized-text'

const TEXT: Record<string, { en: string; vi: string; variant: 'warning' | 'success' | 'neutral' }> =
  {
    NOT_DECLARED: {
      en: 'Outcome not verified: no outcome criterion is declared',
      vi: 'Chưa xác minh kết quả: chưa khai báo tiêu chí kết quả',
      variant: 'warning',
    },
    PENDING: {
      en: 'Outcome not verified yet: waiting for an independent verifier',
      vi: 'Chưa xác minh kết quả: đang chờ người xác minh độc lập',
      variant: 'warning',
    },
    ACCEPTED: {
      en: 'Outcome verified',
      vi: 'Đã xác minh kết quả',
      variant: 'success',
    },
  }

/**
 * The authority's outcome verification, shown apart from the filing's verification state (which
 * follows its package criteria). Nothing is shown for a filing that tracks no outcome verification
 * or when the API did not say. An approval can be recorded without this being verified.
 */
export function OutcomeVerificationBadge({ state }: { state: string | undefined }) {
  const t = state ? TEXT[state] : undefined
  if (!t) return null
  return (
    <Badge variant={t.variant} data-slot="outcome-verification">
      <LocalizedText en={t.en} vi={t.vi} />
    </Badge>
  )
}
