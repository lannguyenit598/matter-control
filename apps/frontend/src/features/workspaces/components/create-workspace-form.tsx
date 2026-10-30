'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import { createWorkspaceAction } from '../actions'

/** One "New workspace" action opening a focused form; the draft and idempotency key survive close. */
export function CreateWorkspaceForm() {
  const router = useRouter()
  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="New workspace" vi="Không gian làm việc mới" />
        </>
      }
      title={<LocalizedText en="New workspace" vi="Không gian làm việc mới" />}
      description={
        <LocalizedText
          en="Give your legal team a dedicated space. Add people and matters as you go."
          vi="Tạo không gian riêng cho đội ngũ pháp lý. Bạn có thể thêm thành viên và hồ sơ sau."
        />
      }
    >
      {({ close }) => (
        <IntentForm
          receipted={true}
          draftKey="new-workspace"
          submitLabel={<LocalizedText en="Create workspace" vi="Tạo không gian làm việc" />}
          run={(values, key) =>
            createWorkspaceAction({ idempotencyKey: key, name: values.name ?? '' })
          }
          onSuccess={(r) => {
            close()
            if (r.id) router.push(`/workspaces/${r.id}`)
          }}
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Workspace name" vi="Tên không gian làm việc" />}
              required
              hint={
                <LocalizedText
                  en="Your team's shared space, for example Corporate Legal. You'll create a matter inside it next."
                  vi="Không gian dùng chung của đội ngũ, ví dụ Pháp chế doanh nghiệp. Tiếp theo, bạn sẽ tạo hồ sơ bên trong."
                />
              }
              error={errors.name?.[0]}
            >
              {(control) => (
                <Input name="name" autoComplete="off" maxLength={200} data-autofocus {...control} />
              )}
            </FormField>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}
