'use client'

import { UserPlus } from 'lucide-react'
import { useState } from 'react'

import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { SearchPicker } from '@/components/molecules/search-picker'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import { grantMatterMemberAction } from '../actions'
import { MATTER_ROLES } from '../schemas'

import { MatterRoleLabel } from './role-label'

const OPTIONS = MATTER_ROLES.map((r) => ({ value: r, label: <MatterRoleLabel role={r} /> }))

/**
 * Add to matter: choose an eligible workspace member, choose a matter role, submit explicitly.
 * `candidates` is the complete list the API returned (active workspace members not yet on this
 * matter), so filtering it by name covers every eligible person. Workspace ownership grants no
 * matter access, so nothing is inferred here.
 */
export function GrantMatterMemberForm({
  matterId,
  ifMatch,
  candidates,
}: {
  matterId: string
  ifMatch: string
  candidates: { userId: string; displayName: string }[]
}) {
  const [added, setAdded] = useState(false)
  const eligible = candidates.map((p) => ({ value: p.userId, label: p.displayName }))
  return (
    <div className="flex items-center gap-3">
      {added && (
        <p role="status" className="text-sm text-muted-foreground">
          <LocalizedText en="Added to the matter." vi="Đã thêm vào hồ sơ." />
        </p>
      )}
      <FormDialog
        trigger={
          <>
            <UserPlus aria-hidden />
            <LocalizedText en="Add to matter" vi="Thêm vào hồ sơ" />
          </>
        }
        triggerVariant="outline"
        title={<LocalizedText en="Add to matter" vi="Thêm vào hồ sơ" />}
        description={
          <LocalizedText
            en="Gives an active workspace member access to this matter only. It does not email an invitation."
            vi="Cấp cho một thành viên đang hoạt động của không gian làm việc quyền vào riêng hồ sơ này. Việc này không gửi email mời."
          />
        }
      >
        {({ open, close }) => (
          <IntentForm
            receipted={false}
            submitLabel={<LocalizedText en="Add to matter" vi="Thêm vào hồ sơ" />}
            run={(v) => {
              setAdded(false)
              return grantMatterMemberAction({
                matterId,
                ifMatch,
                userId: v.userId ?? '',
                role: v.role ?? 'VIEWER',
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
                  legend={<LocalizedText en="Workspace member" vi="Thành viên không gian" />}
                  searchLabel={
                    <LocalizedText
                      en="Search workspace members by name"
                      vi="Tìm thành viên không gian theo tên"
                    />
                  }
                  required
                  eligible={eligible}
                  search={async (query) => {
                    const q = query.toLowerCase()
                    return {
                      status: 'ok',
                      options: eligible.filter((o) => o.label.toLowerCase().includes(q)),
                    }
                  }}
                  noMatch={
                    <LocalizedText
                      en="No one to add. Everyone matching is already on this matter; add people to the workspace first to include them here."
                      vi="Không còn ai để thêm. Mọi người khớp đã có trong hồ sơ; hãy thêm họ vào không gian làm việc trước."
                    />
                  }
                  hint={
                    <LocalizedText
                      en="Only active members of this workspace can be added."
                      vi="Chỉ thêm được thành viên đang hoạt động trong không gian làm việc."
                    />
                  }
                  error={errors.userId?.[0]}
                />
                <FormField
                  label={<LocalizedText en="Matter role" vi="Vai trò trong hồ sơ" />}
                  hint={
                    <LocalizedText
                      en="Owners manage matter members, Editors change work, Viewers read only."
                      vi="Chủ sở hữu quản lý thành viên hồ sơ, Biên tập viên chỉnh sửa công việc, Người xem chỉ đọc."
                    />
                  }
                  error={errors.role?.[0]}
                >
                  {(control) => (
                    <Select name="role" options={OPTIONS} defaultValue="VIEWER" {...control} />
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
