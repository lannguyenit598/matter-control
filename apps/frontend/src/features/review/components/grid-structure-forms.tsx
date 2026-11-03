'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import {
  addReviewQuestionAction,
  addReviewVersionAction,
  removeReviewVersionAction,
  reviseReviewQuestionAction,
} from '../actions'

type Option = { id: string; label: string }
type Base = { matterId: string; gridId: string; ifMatch: string }

/**
 * The four structure tasks of a grid, each behind its own button. They are revision-guarded by the
 * grid's ETag (not receipted), so an unknown outcome is re-read, never resent.
 */
export function GridStructureButtons({
  matterId,
  gridId,
  ifMatch,
  addable,
  present,
  questions,
}: Base & { addable: Option[]; present: Option[]; questions: Option[] }) {
  const base = { matterId, gridId, ifMatch }
  return (
    <div className="flex flex-wrap gap-2">
      <AddVersion {...base} options={addable} />
      <RemoveVersion {...base} options={present} />
      <AddQuestion {...base} />
      <ReviseQuestion {...base} options={questions} />
    </div>
  )
}

function useRefresh() {
  const router = useRouter()
  return () => router.refresh()
}

function AddVersion({ matterId, gridId, ifMatch, options }: Base & { options: Option[] }) {
  const refresh = useRefresh()
  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="Add version" vi="Thêm phiên bản" />
        </>
      }
      triggerVariant="outline"
      title={<LocalizedText en="Add a document version" vi="Thêm phiên bản tài liệu" />}
      description={
        <LocalizedText
          en="Each row is one exact version. Adding a version never makes it the current one."
          vi="Mỗi hàng là một phiên bản cụ thể. Thêm phiên bản không biến nó thành bản hiện hành."
        />
      }
    >
      {() => (
        <IntentForm
          receipted={false}
          draftKey={`review:${gridId}:add-version`}
          submitLabel={<LocalizedText en="Add version" vi="Thêm phiên bản" />}
          run={(v) =>
            addReviewVersionAction({ matterId, gridId, ifMatch, versionId: v.versionId ?? '' })
          }
          onSuccess={refresh}
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Version" vi="Phiên bản" />}
              required
              error={errors.versionId?.[0]}
            >
              {(c) => (
                <Select
                  name="versionId"
                  placeholder={<LocalizedText en="Choose a version" vi="Chọn phiên bản" />}
                  options={options.map((o) => ({ value: o.id, label: o.label }))}
                  {...c}
                />
              )}
            </FormField>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}

function RemoveVersion({ matterId, gridId, ifMatch, options }: Base & { options: Option[] }) {
  const refresh = useRefresh()
  return (
    <FormDialog
      trigger={<LocalizedText en="Remove version" vi="Gỡ phiên bản" />}
      triggerVariant="outline"
      title={<LocalizedText en="Remove a version from this grid" vi="Gỡ phiên bản khỏi bảng" />}
      description={
        <LocalizedText
          en="The row disappears, but its recorded answers stay in the history and return if you add the version again."
          vi="Hàng biến mất nhưng các câu trả lời đã ghi vẫn ở lịch sử và trở lại nếu bạn thêm lại phiên bản."
        />
      }
    >
      {() => (
        <IntentForm
          receipted={false}
          draftKey={`review:${gridId}:remove-version`}
          submitLabel={<LocalizedText en="Remove version" vi="Gỡ phiên bản" />}
          run={(v) =>
            removeReviewVersionAction({ matterId, gridId, ifMatch, versionId: v.versionId ?? '' })
          }
          onSuccess={refresh}
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Version" vi="Phiên bản" />}
              required
              error={errors.versionId?.[0]}
            >
              {(c) => (
                <Select
                  name="versionId"
                  placeholder={<LocalizedText en="Choose a version" vi="Chọn phiên bản" />}
                  options={options.map((o) => ({ value: o.id, label: o.label }))}
                  {...c}
                />
              )}
            </FormField>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}

function AddQuestion({ matterId, gridId, ifMatch }: Base) {
  const refresh = useRefresh()
  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="Add question" vi="Thêm câu hỏi" />
        </>
      }
      triggerVariant="outline"
      title={<LocalizedText en="Add a question" vi="Thêm câu hỏi" />}
      description={
        <LocalizedText
          en="Every row is answered against this question. Rewording it later makes earlier answers stale, not lost."
          vi="Mọi hàng được trả lời theo câu hỏi này. Sửa lời sau đó làm các câu trả lời cũ thành lỗi thời chứ không mất."
        />
      }
    >
      {() => (
        <IntentForm
          receipted={false}
          draftKey={`review:${gridId}:add-question`}
          submitLabel={<LocalizedText en="Add question" vi="Thêm câu hỏi" />}
          run={(v) => addReviewQuestionAction({ matterId, gridId, ifMatch, text: v.text ?? '' })}
          onSuccess={refresh}
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Question" vi="Câu hỏi" />}
              required
              error={errors.text?.[0]}
            >
              {(c) => <Textarea name="text" rows={3} maxLength={1000} {...c} />}
            </FormField>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}

function ReviseQuestion({ matterId, gridId, ifMatch, options }: Base & { options: Option[] }) {
  const refresh = useRefresh()
  return (
    <FormDialog
      trigger={<LocalizedText en="Reword question" vi="Sửa lời câu hỏi" />}
      triggerVariant="outline"
      title={<LocalizedText en="Reword a question" vi="Sửa lời câu hỏi" />}
      description={
        <LocalizedText
          en="Answers given to the old wording stay readable and are marked stale until someone answers again."
          vi="Các câu trả lời theo lời cũ vẫn đọc được và được đánh dấu lỗi thời cho đến khi có người trả lời lại."
        />
      }
    >
      {() => (
        <IntentForm
          receipted={false}
          draftKey={`review:${gridId}:revise-question`}
          submitLabel={<LocalizedText en="Save wording" vi="Lưu lời mới" />}
          run={(v) =>
            reviseReviewQuestionAction({
              matterId,
              gridId,
              ifMatch,
              questionId: v.questionId ?? '',
              text: v.text ?? '',
            })
          }
          onSuccess={refresh}
        >
          {({ errors }) => (
            <>
              <FormField
                label={<LocalizedText en="Question" vi="Câu hỏi" />}
                required
                error={errors.questionId?.[0]}
              >
                {(c) => (
                  <Select
                    name="questionId"
                    placeholder={<LocalizedText en="Choose a question" vi="Chọn câu hỏi" />}
                    options={options.map((o) => ({ value: o.id, label: o.label }))}
                    {...c}
                  />
                )}
              </FormField>
              <FormField
                label={<LocalizedText en="New wording" vi="Lời mới" />}
                required
                error={errors.text?.[0]}
              >
                {(c) => <Textarea name="text" rows={3} maxLength={1000} {...c} />}
              </FormField>
            </>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}
