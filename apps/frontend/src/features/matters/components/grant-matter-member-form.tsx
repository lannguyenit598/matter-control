'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { grantMatterMemberAction } from '../actions'
import { MATTER_ROLES } from '../schemas'

const OPTIONS = MATTER_ROLES.map((r) => ({
  value: r,
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}))

export function GrantMatterMemberForm({
  matterId,
  ifMatch,
}: {
  matterId: string
  ifMatch: string
}) {
  return (
    <IntentForm
      receipted={false}
      submitLabel={<LocalizedText en="Add to matter" vi="Thêm vào hồ sơ" />}
      run={(v) =>
        grantMatterMemberAction({
          matterId,
          ifMatch,
          userId: v.userId ?? '',
          role: v.role ?? 'VIEWER',
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
                en="Only active members of the workspace can be added."
                vi="Chỉ thêm được thành viên đang hoạt động trong không gian làm việc."
              />
            }
            error={errors.userId?.[0] ?? errors.role?.[0]}
          >
            {(control) => <Input name="userId" autoComplete="off" {...control} />}
          </FormField>
          <FormField label={<LocalizedText en="Role" vi="Vai trò" />}>
            {(control) => (
              <Select name="role" options={OPTIONS} defaultValue="VIEWER" {...control} />
            )}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
