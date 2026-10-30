import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'

import { criterionBasis, type BasisClaim } from '../evidence-basis'
import { CRITERION_REASON, userName, VERSION_RULE_LABEL } from '../labels'
import type { checklistSchema, documentDetailSchema } from '../schemas'

import type { z } from 'zod'

type Checklist = z.infer<typeof checklistSchema>
type DocDetail = z.infer<typeof documentDetailSchema>

const FLAG: Record<keyof BasisClaim['flags'], { en: string; vi: string }> = {
  withdrawn: { en: 'Evidence withdrawn', vi: 'Bằng chứng đã rút' },
  staleVersion: {
    en: 'Accepted on a version that is not the required one',
    vi: 'Được chấp nhận trên phiên bản không phải phiên bản yêu cầu',
  },
  notYetValid: { en: 'Not valid yet', vi: 'Chưa có hiệu lực' },
  epochStale: { en: 'Accepted before reopening', vi: 'Được chấp nhận trước khi mở lại' },
  expired: { en: 'Past its validity', vi: 'Đã hết hiệu lực' },
  revoked: { en: 'Acceptance revoked', vi: 'Đã thu hồi chấp nhận' },
  disputed: { en: 'Challenged', vi: 'Đang bị phản đối' },
}

/**
 * Contextual basis of each required proof: which exact version was offered, by whom, and what the
 * independent verifier decided, with the stored facts that make the result current or stale. The
 * selection lives in the URL (`?criterion=`), so the view has a stable deep link and Back keeps the
 * work selection. Page or quotation anchors are not stored by the contract and are never shown.
 */
export function EvidenceBasis({
  checklist,
  docs,
  names,
  selectedId,
  linkTo,
}: {
  checklist: Checklist
  docs: DocDetail[]
  names: Record<string, string>
  selectedId: string | undefined
  /** Href that selects a criterion (or clears the selection with null), keeping the rest of the URL. */
  linkTo: (criterionId: string | null) => string
}) {
  const basis = selectedId ? criterionBasis(checklist, docs, selectedId) : null
  if (checklist.criteria.length === 0) return null
  return (
    <section
      id="evidence-basis"
      aria-labelledby="evidence-basis-title"
      className="flex flex-col gap-3 border-t pt-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="evidence-basis-title" className="text-base font-semibold">
          <LocalizedText en="Evidence basis" vi="Cơ sở bằng chứng" />
        </h3>
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="Required proofs, offered evidence and the verifier's decision are three separate things. Open one to see its exact basis."
            vi="Bằng chứng bắt buộc, bằng chứng được đưa ra và quyết định của người xác minh là ba thứ riêng biệt. Mở một mục để xem cơ sở chính xác."
          />
        </p>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {checklist.criteria.map((c) => (
          <li key={c.id}>
            <Link
              href={`${linkTo(c.id)}#evidence-basis`}
              aria-current={c.id === selectedId ? 'true' : undefined}
              className="control-target flex flex-wrap items-center justify-between gap-2 px-4 py-2 hover:bg-accent aria-[current=true]:bg-selected"
            >
              <span className="font-medium break-words">{c.title}</span>
              <span className="text-sm text-muted-foreground">
                {c.satisfied ? (
                  <LocalizedText en="Satisfied" vi="Đã đạt" />
                ) : (
                  (CRITERION_REASON[c.reason ?? ''] ?? (
                    <LocalizedText en="Not satisfied" vi="Chưa đạt" />
                  ))
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {selectedId && !basis && (
        <p role="status" className="text-sm text-muted-foreground">
          <LocalizedText
            en="That proof is no longer part of this record. Choose one from the list."
            vi="Bằng chứng đó không còn thuộc bản ghi này. Hãy chọn một mục trong danh sách."
          />
        </p>
      )}
      {basis && (
        <aside
          aria-label="Evidence basis detail"
          className="flex flex-col gap-4 rounded-lg border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <h4 className="font-semibold break-words">{basis.criterion.title}</h4>
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {basis.criterion.mandatory ? (
                    <LocalizedText en="Mandatory" vi="Bắt buộc" />
                  ) : (
                    <LocalizedText en="Optional" vi="Không bắt buộc" />
                  )}
                </Badge>
                <span>{VERSION_RULE_LABEL[basis.rule.kind] ?? basis.rule.kind}</span>
              </p>
            </div>
            <Link href={linkTo(null)} className="control-target text-sm underline">
              <LocalizedText en="Close" vi="Đóng" />
            </Link>
          </div>
          {basis.criterion.description && (
            <p className="text-sm break-words">{basis.criterion.description}</p>
          )}
          {(basis.rule.document || basis.rule.version) && (
            <p className="text-sm text-muted-foreground">
              {basis.rule.document && (
                <>
                  <LocalizedText en="Document" vi="Tài liệu" />: {basis.rule.document}.{' '}
                </>
              )}
              {basis.rule.version && (
                <>
                  <LocalizedText en="Required version" vi="Phiên bản yêu cầu" />:{' '}
                  {basis.rule.version}
                </>
              )}
            </p>
          )}
          {basis.claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LocalizedText
                en="No evidence has been offered for this proof yet."
                vi="Chưa có bằng chứng nào được đưa ra cho mục này."
              />
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {basis.claims.map((c) => (
                <ClaimBasis key={c.claimId} claim={c} names={names} />
              ))}
            </ol>
          )}
          <p className="text-xs text-muted-foreground">
            <LocalizedText en="As of" vi="Tại thời điểm" /> <LocalizedInstant iso={basis.asOf} />.{' '}
            <LocalizedText
              en="No page or quotation anchor is recorded for evidence."
              vi="Hệ thống không ghi số trang hay trích dẫn cho bằng chứng."
            />
          </p>
        </aside>
      )}
    </section>
  )
}

function ClaimBasis({ claim: c, names }: { claim: BasisClaim; names: Record<string, string> }) {
  const flags = (Object.keys(c.flags) as (keyof BasisClaim['flags'])[]).filter((k) => c.flags[k])
  return (
    <li className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0">
      {flags.length > 0 && (
        <p className="flex flex-wrap gap-2">
          {flags.map((k) => (
            <Badge key={k} variant="warning">
              <LocalizedText en={FLAG[k].en} vi={FLAG[k].vi} />
            </Badge>
          ))}
        </p>
      )}
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">
          <LocalizedText en="Offered evidence" vi="Bằng chứng được đưa ra" />
        </dt>
        <dd className="break-words">
          {!c.evidence ? (
            <LocalizedText
              en="The evidence record could not be found."
              vi="Không tìm thấy bản ghi bằng chứng."
            />
          ) : c.evidence.kind === 'EXTERNAL_REFERENCE' ? (
            <>
              {c.evidence.reference ?? c.evidence.description}{' '}
              <span className="text-muted-foreground">
                <LocalizedText
                  en="(outside reference typed by a person; not validated)"
                  vi="(tham chiếu bên ngoài do người dùng nhập; chưa được xác thực)"
                />
              </span>
            </>
          ) : c.version ? (
            <>
              {c.version.documentName} · v{c.version.no} · {c.version.filename}{' '}
              <span className="text-muted-foreground">
                (
                {c.version.current ? (
                  <LocalizedText en="current version" vi="phiên bản hiện hành" />
                ) : (
                  <LocalizedText en="not the current version" vi="không phải phiên bản hiện hành" />
                )}
                , SHA-256 <code className="text-xs">{c.version.sha256.slice(0, 12)}…</code>)
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              <LocalizedText
                en="Document version details are unavailable in this read."
                vi="Chi tiết phiên bản tài liệu không có trong lần đọc này."
              />
            </span>
          )}
        </dd>
        {c.evidence && (
          <>
            <dt className="text-muted-foreground">
              <LocalizedText en="Submitted" vi="Gửi bởi" />
            </dt>
            <dd>
              {userName(names, c.evidence.submittedBy)} ·{' '}
              <LocalizedInstant iso={c.evidence.submittedAt} />
              {c.evidence.validUntil && (
                <>
                  {' · '}
                  <LocalizedText en="evidence valid until" vi="bằng chứng có hiệu lực đến" />{' '}
                  <LocalizedInstant iso={c.evidence.validUntil} />
                </>
              )}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">
          <LocalizedText en="Verifier's decision" vi="Quyết định của người xác minh" />
        </dt>
        <dd className="break-words">
          {c.assessment ? (
            <>
              <strong>
                {c.assessment.verdict === 'ACCEPTED' ? (
                  <LocalizedText en="Accepted" vi="Chấp nhận" />
                ) : (
                  <LocalizedText en="Rejected" vi="Từ chối" />
                )}
              </strong>{' '}
              {userName(names, c.assessment.reviewer)} ·{' '}
              <LocalizedInstant iso={c.assessment.recordedAt} />
              {c.assessment.assessedVersion && (
                <>
                  {' · '}
                  <LocalizedText en="on" vi="trên" /> {c.assessment.assessedVersion.label}
                </>
              )}
              {c.assessment.effectiveUntil && (
                <>
                  {' · '}
                  <LocalizedText
                    en="decision effective until"
                    vi="quyết định có hiệu lực đến"
                  />{' '}
                  <LocalizedInstant iso={c.assessment.effectiveUntil} />
                </>
              )}
              {c.assessment.rationale && (
                <span className="block text-muted-foreground">{c.assessment.rationale}</span>
              )}
            </>
          ) : (
            <LocalizedText
              en="Waiting for an independent verifier."
              vi="Đang chờ người xác minh độc lập."
            />
          )}
        </dd>
      </dl>
    </li>
  )
}
