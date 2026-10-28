'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { createMatterAction } from '../actions'

/** `ifMatch` is the workspace ETag: creating a matter changes the workspace, so it is CAS-guarded. */
export function CreateMatterForm({
  workspaceId,
  ifMatch,
}: {
  workspaceId: string
  ifMatch: string
}) {
  const router = useRouter()
  return (
    <IntentForm
      receipted={true}
      submitLabel={<LocalizedText en="Create matter" vi="Tạo hồ sơ" />}
      run={(v, key) =>
        createMatterAction({ idempotencyKey: key, workspaceId, ifMatch, title: v.title ?? '' })
      }
      onSuccess={(r) => r.id && router.push(`/matters/${r.id}`)}
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Matter title" vi="Tiêu đề hồ sơ" />}
          required
          error={errors.title?.[0]}
        >
          {(control) => <Input name="title" autoComplete="off" maxLength={300} {...control} />}
        </FormField>
      )}
    </IntentForm>
  )
}
