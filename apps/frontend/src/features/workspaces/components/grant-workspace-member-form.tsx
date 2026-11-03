'use client'

import { UserPlus } from 'lucide-react'
import { useState } from 'react'

import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { SearchPicker } from '@/components/molecules/search-picker'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import { grantWorkspaceMemberAction, searchWorkspacePeopleAction } from '../actions'
import { WORKSPACE_ROLES } from '../schemas'

import { WorkspaceRoleLabel } from './role-label'

const OPTIONS = WORKSPACE_ROLES.map((r) => ({ value: r, label: <WorkspaceRoleLabel role={r} /> }))

/**
 * Add member: find a person by name, choose a role, submit explicitly. Searching and changing
 * the role never submit. `ifMatch` is the workspace ETag read with this page; a concurrent change
 * makes the API answer 412. Adding a member is not an email invitation.
 */
export function GrantWorkspaceMemberForm({
  workspaceId,
  ifMatch,
}: {
  workspaceId: string
  ifMatch: string
}) {
  const [added, setAdded] = useState(false)
  return (
    <div className="flex items-center gap-3">
      {added && (
        <p role="status" className="text-sm text-muted-foreground">
          <LocalizedText en="Member added." vi="Đã thêm thành viên." />
        </p>
      )}
      <FormDialog
        trigger={
          <>
            <UserPlus aria-hidden />
            <LocalizedText en="Add member" vi="Thêm thành viên" />
          </>
        }
        triggerVariant="outline"
        title={<LocalizedText en="Add workspace member" vi="Thêm thành viên không gian làm việc" />}
        description={
          <LocalizedText
            en="Gives a person access to this workspace. It does not email an invitation or create an account."
            vi="Cấp cho một người quyền vào không gian làm việc này. Việc này không gửi email mời và không tạo tài khoản."
          />
        }
      >
        {({ open, close }) => (
          <IntentForm
            receipted={false}
            submitLabel={<LocalizedText en="Add member" vi="Thêm thành viên" />}
            run={(v) => {
              setAdded(false)
              return grantWorkspaceMemberAction({
                workspaceId,
                ifMatch,
                userId: v.userId ?? '',
                role: v.role ?? 'MEMBER',
              })
            }}
            onSuccess={() => {
              setAdded(true)
              close()
            }}
            className="flex flex-col gap-4"
          >
            {({ errors }) => (
              <>
                <SearchPicker
                  name="userId"
                  active={open}
                  legend={<LocalizedText en="Person" vi="Thành viên" />}
                  searchLabel={<LocalizedText en="Search people by name" vi="Tìm người theo tên" />}
                  required
                  search={(query) => searchWorkspacePeopleAction({ workspaceId, query })}
                  noMatch={
                    <LocalizedText
                      en="No matching people to add. Try another name, or provision their product account first."
                      vi="Không tìm thấy người để thêm. Thử tên khác hoặc tạo tài khoản sản phẩm cho họ trước."
                    />
                  }
                  hint={
                    <LocalizedText
                      en="Type a name to search. The person must already have a product account."
                      vi="Nhập tên để tìm. Người này phải có sẵn tài khoản sản phẩm."
                    />
                  }
                  error={errors.userId?.[0]}
                />
                <FormField
                  label={<LocalizedText en="Workspace role" vi="Vai trò trong không gian" />}
                  hint={
                    <LocalizedText
                      en="Owners manage workspace members and create matters. Members do not open any matter automatically; matter access is granted separately."
                      vi="Chủ sở hữu quản lý thành viên và tạo hồ sơ. Thành viên không tự mở hồ sơ nào; quyền vào hồ sơ được cấp riêng."
                    />
                  }
                  error={errors.role?.[0]}
                >
                  {(control) => (
                    <Select name="role" options={OPTIONS} defaultValue="MEMBER" {...control} />
                  )}
                </FormField>
              </>
            )}
          </IntentForm>
        )}
      </FormDialog>
    </div>
  )
}
