import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'

import type { Requirement } from '../schemas'

const label = (s: string) =>
  s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())

/**
 * The independent state axes are shown separately and never merged into one status: execution,
 * dependency and verification each mean something different. Unset values say so explicitly.
 */
export function RequirementDetail({ requirement: r }: { requirement: Requirement }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="Intended outcome" vi="Kết quả cần đạt" />
          </CardTitle>
        </CardHeader>
        <CardContent className="break-words whitespace-pre-wrap">{r.outcome}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="State" vi="Các trục trạng thái" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {r.importedVerificationClaim && (
              <div>
                <dt>
                  <LocalizedText
                    en="Imported verification claim"
                    vi="Nhãn xác minh từ nguồn nhập"
                  />
                </dt>
                <dd>{r.importedVerificationClaim} — source label only; not verified proof.</dd>
              </div>
            )}
            <Axis term={<LocalizedText en="Execution" vi="Thực hiện" />} value={r.executionState} />
            <Axis
              term={<LocalizedText en="Dependency" vi="Phụ thuộc" />}
              value={r.dependencyState}
            />
            <Axis
              term={<LocalizedText en="Verification" vi="Xác minh" />}
              value={
                r.verificationApplicability === 'REQUIRED' ? r.verificationState : 'NOT_REQUIRED'
              }
              note={
                r.verificationApplicability === 'REQUIRED'
                  ? `Proof epoch ${r.proofEpoch}`
                  : (r.applicabilityReason ?? 'Not required')
              }
            />
            <div>
              <dt className="text-sm text-muted-foreground">
                <LocalizedText en="Owner" vi="Người phụ trách" />
              </dt>
              <dd>
                {r.ownerId ?? (
                  <span className="text-muted-foreground">
                    <LocalizedText en="Unassigned" vi="Chưa phân công" />
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                <LocalizedText en="Due" vi="Hạn" />
              </dt>
              <dd>
                {r.dueAt ? (
                  <LocalizedInstant iso={r.dueAt} />
                ) : (
                  <span className="text-muted-foreground">
                    <LocalizedText en="No due date" vi="Chưa có hạn" />
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function Axis({ term, value, note }: { term: React.ReactNode; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="flex flex-col items-start gap-1">
        <Badge variant="outline">{label(value)}</Badge>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </dd>
    </div>
  )
}
