'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Checkbox } from './checkbox'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'
import { useTimeZone } from '@/hooks/use-time-zone'
import { fieldFailure } from '@/lib/mc/action-result'
import { readLocalField } from '@/lib/mc/local-time'

import {
  createMilestoneAction,
  createPartyAction,
  createWorkstreamAction,
  setMilestonePrerequisitesAction,
  updatePartyAction,
} from '../actions'
import type { MilestoneView, Party } from '../schemas'

import { DueField } from './due-field'

export function CreateWorkstreamForm({ matterId }: { matterId: string }) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`matter:${matterId}:new-workstream`}
      submitLabel={<LocalizedText en="Add workstream" vi="Thêm nhóm công việc" />}
      run={(v) => createWorkstreamAction({ matterId, name: v.name ?? '' })}
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Workstream name" vi="Tên nhóm công việc" />}
          required
          error={errors.name?.[0]}
        >
          {(c) => <Input name="name" maxLength={200} autoComplete="off" {...c} />}
        </FormField>
      )}
    </IntentForm>
  )
}

export function CreatePartyForm({ matterId }: { matterId: string }) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`matter:${matterId}:new-party`}
      submitLabel={<LocalizedText en="Add external party" vi="Thêm bên ngoài" />}
      run={(v) =>
        createPartyAction({
          matterId,
          name: v.name ?? '',
          kind: v.kind,
          contact: v.contact,
          notes: v.notes,
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField label={<LocalizedText en="Name" vi="Tên" />} required error={errors.name?.[0]}>
            {(c) => <Input name="name" maxLength={200} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Kind" vi="Loại" />}
            hint={
              <LocalizedText
                en="For example organisation, authority, counsel."
                vi="Ví dụ: tổ chức, cơ quan, đơn vị tư vấn pháp lý."
              />
            }
          >
            {(c) => <Input name="kind" maxLength={100} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Contact" vi="Thông tin liên hệ" />}
            hint={
              <LocalizedText
                en="Context only. Adding a party never creates an account or grants access."
                vi="Chỉ là thông tin bối cảnh. Thêm bên ngoài không tạo tài khoản hoặc cấp quyền."
              />
            }
          >
            {(c) => <Input name="contact" maxLength={500} autoComplete="off" {...c} />}
          </FormField>
          <FormField label={<LocalizedText en="Notes" vi="Ghi chú" />}>
            {(c) => <Textarea name="notes" rows={2} maxLength={5000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}

export function EditPartyForm({ matterId, party }: { matterId: string; party: Party }) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`party:${party.id}:edit`}
      submitLabel={<LocalizedText en="Save contact context" vi="Lưu thông tin liên hệ" />}
      run={(v) =>
        updatePartyAction({
          matterId,
          partyId: party.id,
          ifMatch: party.etag,
          name: v.name,
          kind: v.kind,
          contact: v.contact,
          notes: v.notes,
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField label={<LocalizedText en="Name" vi="Tên" />} required error={errors.name?.[0]}>
            {(c) => <Input name="name" defaultValue={party.name} maxLength={200} {...c} />}
          </FormField>
          <FormField label={<LocalizedText en="Kind" vi="Loại" />}>
            {(c) => <Input name="kind" defaultValue={party.kind} maxLength={100} {...c} />}
          </FormField>
          <FormField label={<LocalizedText en="Contact" vi="Thông tin liên hệ" />}>
            {(c) => <Input name="contact" defaultValue={party.contact} maxLength={500} {...c} />}
          </FormField>
          <FormField label={<LocalizedText en="Notes" vi="Ghi chú" />}>
            {(c) => (
              <Textarea name="notes" rows={2} defaultValue={party.notes} maxLength={5000} {...c} />
            )}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}

export function CreateMilestoneForm({ matterId }: { matterId: string }) {
  const zone = useTimeZone()
  return (
    <IntentForm
      receipted={false}
      draftKey={`matter:${matterId}:new-milestone`}
      submitLabel={<LocalizedText en="Add milestone" vi="Thêm cột mốc" />}
      run={(v) => {
        const due = readLocalField(v, 'due', zone, null)
        if (!due.ok) return Promise.resolve(fieldFailure('dueAt', due.error))
        return createMilestoneAction({
          matterId,
          name: v.name ?? '',
          dueAt: due.iso,
          critical: v.critical === 'on',
        })
      }}
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Milestone name" vi="Tên cột mốc" />}
            required
            error={errors.name?.[0]}
          >
            {(c) => <Input name="name" maxLength={200} autoComplete="off" {...c} />}
          </FormField>
          <DueField current={null} error={errors.dueAt?.[0]} />
          <Checkbox
            name="critical"
            label={
              <LocalizedText
                en="Critical milestone: its unsatisfied prerequisites are marked critical"
                vi="Cột mốc trọng yếu: các điều kiện chưa đáp ứng được đánh dấu nghiêm trọng"
              />
            }
          />
        </>
      )}
    </IntentForm>
  )
}

/** Owner-only: the required Requirements and the critical designation, with a reason. */
export function MilestonePrerequisitesForm({
  matterId,
  view,
  requirements,
}: {
  matterId: string
  view: MilestoneView
  requirements: { id: string; title: string }[]
}) {
  const chosen = new Set(view.milestone.prerequisites)
  return (
    <IntentForm
      receipted={false}
      draftKey={`milestone:${view.milestone.id}:prereqs`}
      submitLabel={<LocalizedText en="Save required Requirements" vi="Lưu các yêu cầu bắt buộc" />}
      run={(v) =>
        setMilestonePrerequisitesAction({
          matterId,
          milestoneId: view.milestone.id,
          ifMatch: view.etag,
          prerequisites: (v.prerequisites ?? '').split(',').filter(Boolean),
          critical: v.critical === 'on',
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium">
              <LocalizedText en="Required Requirements" vi="Các yêu cầu bắt buộc" />
            </legend>
            {requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <LocalizedText en="Create a Requirement first." vi="Hãy tạo Yêu cầu trước." />
              </p>
            ) : (
              requirements.map((r) => (
                <Checkbox
                  key={r.id}
                  name="prerequisites"
                  value={r.id}
                  defaultChecked={chosen.has(r.id)}
                  label={r.title}
                />
              ))
            )}
          </fieldset>
          <Checkbox
            name="critical"
            defaultChecked={view.milestone.critical}
            label={<LocalizedText en="Critical milestone" vi="Cột mốc trọng yếu" />}
          />
          <FormField
            label={<LocalizedText en="Reason for this change" vi="Lý do thay đổi" />}
            required
            error={errors.reason?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
