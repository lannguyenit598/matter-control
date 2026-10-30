'use client'

import { ClipboardCheck, ListTodo, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'
import { TaskChoice } from '@/components/molecules/task-choice'
import { FormDialog } from '@/components/organisms/form-dialog'
import { UnresolvedReporter } from '@/components/organisms/intent-form'

type Kind = 'action' | 'requirement'

/**
 * The one "Add work" entry. It opens a focused task where the person first says what kind of
 * thing they are adding (an Action somebody does, a Requirement that must hold), then fills that
 * kind's own form. Both forms stay mounted inside the closed dialog and while the other kind is
 * showing, so a pending or unconfirmed request is never lost by closing or switching, and each
 * kind keeps its own draft, key and result. A kind with an unresolved request says so on its
 * choice button even while it is out of sight. Opening, switching and closing send nothing.
 */
export function AddWorkDialog({
  actionForm,
  requirementForm,
}: {
  actionForm: ReactNode
  requirementForm: ReactNode
}) {
  const [kind, setKind] = useState<Kind>('action')
  const [unresolved, setUnresolved] = useState<Record<Kind, boolean>>({
    action: false,
    requirement: false,
  })
  const report = (k: Kind) => (value: boolean) => setUnresolved((u) => ({ ...u, [k]: value }))
  const [reportAction] = useState(() => report('action'))
  const [reportRequirement] = useState(() => report('requirement'))

  const choices = [
    {
      kind: 'action' as const,
      icon: <ListTodo />,
      title: <LocalizedText en="Action" vi="Hành động" />,
      example: (
        <LocalizedText
          en="Work someone needs to do. For example: Prepare the board resolutions."
          vi="Việc cần có người thực hiện. Ví dụ: Soạn nghị quyết Hội đồng quản trị."
        />
      ),
    },
    {
      kind: 'requirement' as const,
      icon: <ClipboardCheck />,
      title: <LocalizedText en="Requirement" vi="Yêu cầu" />,
      example: (
        <LocalizedText
          en="A condition that must be true. For example: Board approval has been obtained. Completing an action does not verify it."
          vi="Điều kiện phải đạt. Ví dụ: Đã có phê duyệt của Hội đồng quản trị. Hoàn tất một hành động không đồng nghĩa điều kiện này đã được xác minh."
        />
      ),
    },
  ]

  return (
    <FormDialog
      trigger={
        <>
          <Plus aria-hidden />
          <LocalizedText en="Add work" vi="Thêm công việc" />
        </>
      }
      title={<LocalizedText en="Add work" vi="Thêm công việc" />}
      description={
        <LocalizedText
          en="Start with a title and the result you need. People, dates and prerequisites can be added afterwards."
          vi="Bắt đầu bằng tên và kết quả cần đạt. Bạn có thể phân công, đặt hạn và thêm điều kiện tiên quyết sau."
        />
      }
    >
      {() => (
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="What are you adding?" className="grid gap-2 sm:grid-cols-2">
            {choices.map((c) => (
              <TaskChoice
                key={c.kind}
                icon={c.icon}
                title={c.title}
                description={c.example}
                pressed={kind === c.kind}
                unfinished={unresolved[c.kind]}
                onClick={() => setKind(c.kind)}
              />
            ))}
          </div>
          <div hidden={kind !== 'action'}>
            <UnresolvedReporter.Provider value={reportAction}>
              {actionForm}
            </UnresolvedReporter.Provider>
          </div>
          <div hidden={kind !== 'requirement'}>
            <UnresolvedReporter.Provider value={reportRequirement}>
              {requirementForm}
            </UnresolvedReporter.Provider>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
