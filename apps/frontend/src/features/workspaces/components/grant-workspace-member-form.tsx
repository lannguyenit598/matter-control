'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { grantWorkspaceMemberAction } from '../actions'
import { WORKSPACE_ROLES } from '../schemas'

const OPTIONS = WORKSPACE_ROLES.map((r) => ({
  value: r,
  label: r === 'OWNER' ? 'Owner' : 'Member',
}))

/** `ifMatch` is the workspace ETag read with this page; a concurrent change makes the API answer 412. */
export function GrantWorkspaceMemberForm({
  workspaceId,
  ifMatch,
}: {
  workspaceId: string
  ifMatch: string
}) {
  return (
    <IntentForm
      receipted={false}
      submitLabel={<LocalizedText en="Add member" vi="Thêm thành viên" />}
      run={(v) =>
        grantWorkspaceMemberAction({
          workspaceId,
          ifMatch,
          userId: v.userId ?? '',
          role: v.role ?? 'MEMBER',
        })
      }
      className="flex flex-col gap-3"
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="User id" vi="ID người dùng" />}
            required
            hint={
              <LocalizedText
                en="Membership is explicit: the person must already be provisioned as a product user."
                vi="Thành viên được cấp rõ ràng: người này phải có tài khoản sản phẩm trước."
              />
            }
            error={errors.userId?.[0] ?? errors.role?.[0]}
          >
            {(control) => <Input name="userId" autoComplete="off" {...control} />}
          </FormField>
          <FormField label={<LocalizedText en="Role" vi="Vai trò" />}>
            {(control) => (
              <Select name="role" options={OPTIONS} defaultValue="MEMBER" {...control} />
            )}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
