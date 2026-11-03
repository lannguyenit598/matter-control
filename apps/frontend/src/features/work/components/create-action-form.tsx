'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { createActionAction } from '../actions'

/** Creates an Action: a receipted creation, so a retry after an unknown outcome reuses its key. */
export function CreateActionForm({ matterId }: { matterId: string }) {
  const router = useRouter()
  return (
    <IntentForm
      receipted
      draftKey={`matter:${matterId}:new-action`}
      submitLabel={<LocalizedText en="Create action" vi="Tạo hành động" />}
      run={(v, key) =>
        createActionAction({
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
            {(c) => <Input name="title" maxLength={300} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Outcome" vi="Kết quả cần đạt" />}
            required
            hint={
              <LocalizedText
                en="What finishing this work produces."
                vi="Kết quả tạo ra khi hoàn tất công việc."
              />
            }
            error={errors.outcome?.[0]}
          >
            {(c) => <Textarea name="outcome" maxLength={5000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
