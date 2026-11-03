'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import { createReviewGridAction } from '../actions'

/** One button that opens a focused task. Creating a grid is receipted: a retry reuses its key. */
export function CreateGridDialog({ matterId }: { matterId: string }) {
  const router = useRouter()
  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="New review grid" vi="Bảng rà soát mới" />
        </>
      }
      title={<LocalizedText en="New review grid" vi="Bảng rà soát mới" />}
      description={
        <LocalizedText
          en="A grid compares chosen document versions against your questions. You add the versions and questions next."
          vi="Bảng so sánh các phiên bản tài liệu đã chọn với câu hỏi của bạn. Bạn thêm phiên bản và câu hỏi ở bước sau."
        />
      }
    >
      {() => (
        <IntentForm
          receipted
          draftKey={`matter:${matterId}:new-review-grid`}
          submitLabel={<LocalizedText en="Create grid" vi="Tạo bảng" />}
          run={(v, key) =>
            createReviewGridAction({ idempotencyKey: key, matterId, name: v.name ?? '' })
          }
          onSuccess={(r) => r.id && router.push(`/matters/${matterId}/reviews?grid=${r.id}`)}
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Name" vi="Tên" />}
              required
              hint={
                <LocalizedText
                  en="For example: Change-of-control review."
                  vi="Ví dụ: Rà soát điều khoản thay đổi quyền kiểm soát."
                />
              }
              error={errors.name?.[0]}
            >
              {(c) => <Input name="name" maxLength={200} autoComplete="off" {...c} />}
            </FormField>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}
