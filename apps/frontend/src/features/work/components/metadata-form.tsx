'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { updateWorkItemAction } from '../actions'
import type { Envelope, Workstream } from '../schemas'

import { composeDue, DueField } from './due-field'

/**
 * Metadata only: title, outcome, owner, due date, workstream. There is deliberately no control for
 * execution, dependency, timing or attention. Owners are limited to active matter members.
 */
export function MetadataForm({
  matterId,
  entry,
  members,
  workstreams,
  canEdit,
}: {
  matterId: string
  entry: Envelope
  members: { userId: string; displayName: string }[]
  workstreams: Workstream[]
  canEdit: boolean
}) {
  const it = entry.item
  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        <LocalizedText
          en="You can read this record but not change it."
          vi="Bạn được xem nhưng không được sửa bản ghi này."
        />
      </p>
    )
  }
  return (
    <IntentForm
      receipted={false}
      draftKey={`item:${it.id}:meta`}
      submitLabel={<LocalizedText en="Save changes" vi="Lưu thay đổi" />}
      run={(v) =>
        updateWorkItemAction({
          matterId,
          itemId: it.id,
          ifMatch: entry.etag,
          title: v.title,
          outcome: v.outcome,
          ownerId: v.ownerId ?? '',
          dueAt: composeDue(v.dueLocal ?? '', v.dueOffset ?? '+00:00'),
          workstreamId: v.workstreamId ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Title" vi="Tiêu đề" />}
            required
            error={errors.title?.[0]}
          >
            {(c) => (
              <Input
                name="title"
                defaultValue={it.title}
                maxLength={300}
                autoComplete="off"
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Outcome" vi="Kết quả cần đạt" />}
            required
            error={errors.outcome?.[0]}
          >
            {(c) => <Textarea name="outcome" defaultValue={it.outcome} maxLength={5000} {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Owner" vi="Người phụ trách" />}
            hint={
              <LocalizedText
                en="Assignment never grants access: only active matter members can be assigned."
                vi="Phân công không cấp quyền truy cập: chỉ được giao cho thành viên hồ sơ đang hoạt động."
              />
            }
          >
            {(c) => (
              <Select
                name="ownerId"
                defaultValue={it.ownerId ?? ''}
                placeholder="Unassigned"
                options={members.map((m) => ({ value: m.userId, label: m.displayName }))}
                {...c}
              />
            )}
          </FormField>
          <DueField current={it.dueAt} error={errors.dueAt?.[0]} />
          <FormField label={<LocalizedText en="Workstream" vi="Nhóm công việc" />}>
            {(c) => (
              <Select
                name="workstreamId"
                defaultValue={it.workstreamId ?? ''}
                placeholder="None"
                options={workstreams.map((w) => ({ value: w.id, label: w.name }))}
                {...c}
              />
            )}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
