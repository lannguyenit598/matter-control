'use client'

import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { IntentForm } from '@/components/organisms/intent-form'

import { recordReviewAnswerAction } from '../actions'
import type { AccessLoss } from './review-access'

/**
 * Records one human answer. Receipted: a retry after an unknown outcome reuses its key and its
 * exact values. `expectedAnswerId` is the answer the person saw ("" when none), so an answer
 * recorded meanwhile by someone else is a visible conflict, never an overwrite.
 *
 * The complete command — scope, expected answer, wording revision and text — travels in the form
 * (hidden CAS inputs), not in this component's props. One intent is therefore frozen exactly as
 * submitted: while it is unresolved, a refreshed view or a remount cannot reinterpret it under the
 * same key, and the stored attempt replays the original key and CAS verbatim.
 */
export function AnswerForm({
  matterId,
  gridId,
  versionId,
  questionId,
  expectedAnswerId,
  questionRevision,
  onAccessLoss,
}: {
  matterId: string
  gridId: string
  versionId: string
  questionId: string
  expectedAnswerId: string
  questionRevision: number
  onAccessLoss?: (loss: AccessLoss) => void
}) {
  const router = useRouter()
  return (
    <IntentForm
      receipted
      draftKey={`review:${gridId}:${versionId}:${questionId}`}
      submitLabel={<LocalizedText en="Record answer" vi="Ghi câu trả lời" />}
      run={(v, key) =>
        recordReviewAnswerAction({
          idempotencyKey: key,
          matterId,
          gridId,
          versionId,
          questionId,
          expectedAnswerId: v.expectedAnswerId ?? '',
          expectedQuestionRevision: Number(v.expectedQuestionRevision),
          state: v.state ?? 'REVIEWED',
          text: v.text ?? '',
          pageRef: v.pageRef ?? '',
          quoteRef: v.quoteRef ?? '',
        })
      }
      onSuccess={() => router.refresh()}
      onAccessLoss={onAccessLoss}
    >
      {({ errors }) => (
        <>
          {/* What the person saw when this answer was written; frozen with the intent. */}
          <input type="hidden" name="expectedAnswerId" value={expectedAnswerId} />
          <input type="hidden" name="expectedQuestionRevision" value={questionRevision} />
          <FormField
            label={<LocalizedText en="Your conclusion" vi="Kết luận của bạn" />}
            hint={
              <LocalizedText
                en="Absent and unable-to-review are conclusions you record. Nothing here verifies a requirement."
                vi="Không có và không thể rà soát là kết luận bạn ghi nhận. Không có gì ở đây xác minh yêu cầu."
              />
            }
            error={errors.state?.[0]}
          >
            {(c) => (
              <Select
                name="state"
                defaultValue="REVIEWED"
                options={[
                  { value: 'REVIEWED', label: <LocalizedText en="Reviewed" vi="Đã rà soát" /> },
                  {
                    value: 'ABSENT',
                    label: (
                      <LocalizedText en="Absent in this document" vi="Không có trong tài liệu" />
                    ),
                  },
                  {
                    value: 'UNABLE',
                    label: <LocalizedText en="Unable to review" vi="Không thể rà soát" />,
                  },
                ]}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="What you found" vi="Bạn thấy gì" />}
            error={errors.text?.[0]}
          >
            {(c) => <Textarea name="text" rows={3} maxLength={4000} {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Page (optional)" vi="Trang (tùy chọn)" />}
            hint={
              <LocalizedText
                en="Typed by you; the system does not check it against the document."
                vi="Do bạn nhập; hệ thống không đối chiếu với tài liệu."
              />
            }
            error={errors.pageRef?.[0]}
          >
            {(c) => <Input name="pageRef" maxLength={40} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Quotation (optional)" vi="Trích dẫn (tùy chọn)" />}
            error={errors.quoteRef?.[0]}
          >
            {(c) => <Textarea name="quoteRef" rows={2} maxLength={1000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
