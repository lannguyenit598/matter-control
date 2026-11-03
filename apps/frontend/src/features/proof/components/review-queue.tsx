import { ArrowRight, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { withFrom } from '@/lib/mc/paths'

import type { PendingAssessment } from '../schemas'

/** Where the verifier lands to decide: the record's proof, scrolled to this exact criterion. */
export function assessHref(r: PendingAssessment, from: string): string {
  const path = `/matters/${r.matterId}/work/${r.subjectId}?criterion=${encodeURIComponent(r.criterionId)}`
  return withFrom(path, from)
}

/**
 * Reviews due: the claims the caller, as a designated independent verifier, could assess now. It
 * is separate from My work (assigned execution): nothing here is an Action to do, and a row never
 * appears for evidence the caller offered or supplied. The rows are read at one instant and
 * recomputed on every read, so an assessed, withdrawn or revoked claim does not linger.
 */
export function ReviewQueue({
  items,
  total,
  nextHref,
  firstHref,
  here,
}: {
  items: PendingAssessment[]
  total: number | null
  nextHref: string | null
  firstHref: string | null
  here: string
}) {
  if (items.length === 0 && !firstHref) {
    return (
      <EmptyState
        icon={<ClipboardCheck />}
        title={
          <LocalizedText en="Nothing is waiting for your review" vi="Chưa có gì chờ bạn xác minh" />
        }
        description={
          <LocalizedText
            en="Evidence appears here when someone else offers it for a criterion in a matter where an owner designated you as a verifier. Owner status alone does not make you a verifier."
            vi="Bằng chứng hiện ở đây khi người khác cung cấp cho một tiêu chí trong hồ sơ mà chủ sở hữu đã chỉ định bạn là người xác minh. Chỉ là chủ sở hữu thì chưa phải người xác minh."
          />
        }
      />
    )
  }
  return (
    <section aria-labelledby="reviews-due" className="flex flex-col gap-3">
      <h2 id="reviews-due" className="text-lg font-semibold">
        <LocalizedText en="Waiting for your decision" vi="Đang chờ bạn quyết định" />
        {total !== null && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">{total}</span>
        )}
      </h2>
      <ul className="flex flex-col divide-y rounded-xl border">
        {items.map((r) => (
          <li key={r.claimId} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium break-words">{r.criterionTitle}</p>
                <p className="text-sm break-words text-muted-foreground">
                  <Link href={`/matters/${r.matterId}`} className="underline">
                    {r.matterTitle}
                  </Link>
                  {' · '}
                  {r.subjectKind === 'REQUIREMENT' ? (
                    <LocalizedText en="Requirement" vi="Yêu cầu" />
                  ) : (
                    <LocalizedText en="Action" vi="Hành động" />
                  )}
                  {': '}
                  {r.subjectTitle}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {r.criterionPurpose === 'OUTCOME' ? (
                  <Badge variant="outline">
                    <LocalizedText en="Authority outcome" vi="Kết quả từ cơ quan" />
                  </Badge>
                ) : null}
                {r.reason === 'OLD_EPOCH' ? (
                  <Badge variant="neutral">
                    <LocalizedText
                      en="Review again after reopening"
                      vi="Xác minh lại sau khi mở lại"
                    />
                  </Badge>
                ) : null}
                <Link
                  href={assessHref(r, here)}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <LocalizedText en="Open to assess" vi="Mở để đánh giá" />
                  <ArrowRight aria-hidden />
                </Link>
              </div>
            </div>
            <p className="text-sm break-words">
              {r.evidenceKind === 'DOCUMENT_VERSION' ? (
                <>
                  <LocalizedText en="Document version" vi="Phiên bản tài liệu" />:{' '}
                  {r.versionLabel || r.versionId?.slice(0, 8)}
                </>
              ) : (
                <>
                  <LocalizedText en="Reference" vi="Tham chiếu" />: “{r.evidenceReference}”
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              <LocalizedText en="Offered by" vi="Cung cấp bởi" />{' '}
              {r.claimedByName || <LocalizedText en="a former member" vi="một thành viên cũ" />}
              {' · '}
              <LocalizedInstant iso={r.claimedAt} />
            </p>
          </li>
        ))}
      </ul>
      {(firstHref || nextHref) && (
        <nav aria-label="Review pages" className="flex flex-wrap gap-3 text-sm">
          {firstHref && (
            <Link href={firstHref} className="underline">
              <LocalizedText en="Back to the oldest" vi="Về mục cũ nhất" />
            </Link>
          )}
          {nextHref && (
            <Link href={nextHref} rel="next" className="underline">
              <LocalizedText en="Show more" vi="Xem thêm" />
            </Link>
          )}
        </nav>
      )}
    </section>
  )
}
