'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { createWorkspaceAction } from '../actions'

export function CreateWorkspaceForm() {
  const router = useRouter()
  return (
    <IntentForm
      receipted={true}
      submitLabel={<LocalizedText en="Create workspace" vi="Tạo không gian làm việc" />}
      run={(values, key) => createWorkspaceAction({ idempotencyKey: key, name: values.name ?? '' })}
      onSuccess={(r) => r.id && router.push(`/workspaces/${r.id}`)}
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Workspace name" vi="Tên không gian làm việc" />}
          required
          error={errors.name?.[0]}
        >
          {(control) => <Input name="name" autoComplete="off" maxLength={200} {...control} />}
        </FormField>
      )}
    </IntentForm>
  )
}
