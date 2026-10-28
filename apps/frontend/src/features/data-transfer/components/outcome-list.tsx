import { LocalizedText } from '@/components/molecules/localized-text'
import { Badge } from '@/components/atoms/badge'

import { groupOutcomes, type RowOutcome } from '../intent'
import { describeRowFailure, STATUS_LABEL } from '../labels'

/**
 * Row-atomic results in three groups whose counts account for every submitted row. Status is
 * always text as well as colour. An unknown row is neither a success nor a failure: it keeps its
 * identity and is resolved by retrying the same attempt.
 */
export function OutcomeList({ results, submitted }: { results: RowOutcome[]; submitted: number }) {
  const g = groupOutcomes(results, submitted)
  return (
    <div className="mt-3 flex flex-col gap-3 text-sm" data-testid="outcomes">
      <p role="status">
        <LocalizedText
          en={`${g.succeeded.length} applied${g.replayed > 0 ? ` (${g.replayed} already applied earlier)` : ''}, ${g.failed.length} failed, ${g.unknown.length} unknown of ${submitted} submitted.`}
          vi={`${g.succeeded.length} đã áp dụng${g.replayed > 0 ? ` (${g.replayed} đã áp dụng trước đó)` : ''}, ${g.failed.length} thất bại, ${g.unknown.length} chưa rõ kết quả trên ${submitted} dòng đã gửi.`}
        />
        {!g.balanced && (
          <LocalizedText
            en=" The counts do not match the submission: reload before doing anything else."
            vi=" Số dòng không khớp lần gửi: tải lại trước khi thực hiện thao tác khác."
          />
        )}
      </p>
      {g.unknown.length > 0 && (
        <p>
          <LocalizedText
            en="Unknown rows may or may not have been applied. Retry the same attempt to find out; nothing is applied twice."
            vi="Dòng chưa rõ kết quả có thể đã được áp dụng. Thử lại đúng lần thực hiện đó để đối soát; không áp dụng hai lần."
          />
        </p>
      )}
      {[
        ['Applied', g.succeeded, 'success'],
        ['Failed', g.failed, 'destructive'],
        ['Unknown', g.unknown, 'warning'],
      ].map(([title, rows, variant]) =>
        (rows as RowOutcome[]).length === 0 ? null : (
          <section key={title as string} aria-label={`${title as string} rows`}>
            <h4 className="font-medium">
              <LocalizedText
                en={title as string}
                vi={
                  { Applied: 'Đã áp dụng', Failed: 'Thất bại', Unknown: 'Chưa rõ kết quả' }[
                    title as string
                  ] ?? (title as string)
                }
              />
            </h4>
            <ul className="mt-1 flex flex-col gap-1">
              {(rows as RowOutcome[]).map((r) => (
                <li key={r.rowKey}>
                  <Badge variant={variant as 'success' | 'destructive' | 'warning'}>
                    <LocalizedText
                      en={STATUS_LABEL[r.status]}
                      vi={
                        {
                          SUCCESS: 'Đã áp dụng',
                          SUCCESS_REPLAYED: 'Đã áp dụng trước đó',
                          FAILURE: 'Thất bại',
                          UNKNOWN: 'Chưa rõ kết quả',
                        }[r.status]
                      }
                    />
                  </Badge>{' '}
                  <span className="font-mono">{r.rowKey}</span>
                  {r.status === 'FAILURE' && (
                    <>
                      {' '}
                      —{' '}
                      <LocalizedText
                        en={describeRowFailure(r.code)}
                        vi={describeRowFailure(r.code, 'vi')}
                      />
                    </>
                  )}
                  {r.status === 'UNKNOWN' && (
                    <>
                      {' '}
                      —{' '}
                      <LocalizedText
                        en="the answer was lost; attempt identity kept."
                        vi="mất phản hồi; mã lần thực hiện được giữ nguyên."
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  )
}
