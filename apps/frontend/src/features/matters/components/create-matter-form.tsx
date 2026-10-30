'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { FormDialog } from '@/components/organisms/form-dialog'
import { IntentForm } from '@/components/organisms/intent-form'

import { createMatterAction } from '../actions'

/**
 * `ifMatch` is the workspace ETag: creating a matter changes the workspace, so it is CAS-guarded.
 * Title-only command. The dialog keeps its form mounted, so the draft, the idempotency key and an
 * unconfirmed attempt survive close and reopen; closing never cancels a command already sent.
 */
export function CreateMatterForm({
  workspaceId,
  workspaceName,
  ifMatch,
}: {
  workspaceId: string
  workspaceName: string
  ifMatch: string
}) {
  const router = useRouter()
  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="Create matter" vi="Tạo hồ sơ" />
        </>
      }
      title={<LocalizedText en="Create matter" vi="Tạo hồ sơ" />}
      description={
        <LocalizedText
          en="Start with a name. People, documents and work can be added afterwards."
          vi="Bắt đầu bằng tên hồ sơ. Bạn có thể thêm thành viên, tài liệu và công việc sau."
        />
      }
    >
      {({ close }) => (
        <IntentForm
          receipted={true}
          draftKey={`workspace:${workspaceId}:new-matter`}
          submitLabel={<LocalizedText en="Create matter" vi="Tạo hồ sơ" />}
          run={(v, key) =>
            createMatterAction({ idempotencyKey: key, workspaceId, ifMatch, title: v.title ?? '' })
          }
          onSuccess={(r) => {
            close()
            if (r.id) router.push(`/matters/${r.id}?created=1`)
          }}
        >
          {({ errors }) => (
            <>
              <p className="text-sm">
                <LocalizedText en="Workspace:" vi="Không gian làm việc:" />{' '}
                <strong className="break-words">{workspaceName}</strong>
              </p>
              <FormField
                label={<LocalizedText en="Matter name" vi="Tên hồ sơ" />}
                required
                hint={
                  <LocalizedText
                    en="One legal engagement or transaction, for example Acquisition of Acme. You become its owner; nobody else is added automatically."
                    vi="Một vụ việc hoặc giao dịch, ví dụ Mua lại công ty Acme. Bạn là chủ sở hữu hồ sơ; không ai khác được tự động thêm."
                  />
                }
                error={errors.title?.[0]}
              >
                {(control) => (
                  <Input
                    name="title"
                    autoComplete="off"
                    maxLength={300}
                    data-autofocus
                    {...control}
                  />
                )}
              </FormField>
            </>
          )}
        </IntentForm>
      )}
    </FormDialog>
  )
}
