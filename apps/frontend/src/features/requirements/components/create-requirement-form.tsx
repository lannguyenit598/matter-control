'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { createRequirementAction } from '../actions'

export function CreateRequirementForm({ matterId }: { matterId: string }) {
  const router = useRouter()
  return (
    <IntentForm
      receipted={true}
      draftKey={`matter:${matterId}:new-requirement`}
      submitLabel={<LocalizedText en="Create requirement" vi="Tạo yêu cầu" />}
      run={(v, key) =>
        createRequirementAction({
          idempotencyKey: key,
          matterId,
          title: v.title ?? '',
          outcome: v.outcome ?? '',
        })
      }
      onSuccess={(r) => r.id && router.push(`/matters/${matterId}/work/${r.id}`)}
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Title" vi="Tiêu đề" />}
            required
            error={errors.title?.[0]}
          >
            {(control) => <Input name="title" autoComplete="off" maxLength={500} {...control} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Intended outcome" vi="Kết quả cần đạt" />}
            required
            hint={
              <LocalizedText
                en="What must be true when this requirement is met."
                vi="Điều kiện phải đúng khi yêu cầu này được đáp ứng."
              />
            }
            error={errors.outcome?.[0]}
          >
            {(control) => <Textarea name="outcome" maxLength={5000} {...control} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
