'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { CircleX } from 'lucide-react'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { ConfirmActionButton } from '@/components/organisms/confirm-action-button'
import { FormField } from '@/components/molecules/form-field'
import { IconDisclosure } from '@/components/molecules/icon-disclosure'
import { IntentForm } from '@/components/organisms/intent-form'

import { createContextAction, updateContextAction } from '../actions'
import { KIND_LABEL } from '../labels'
import { CONTEXT_KINDS, type ContextRecord } from '../schemas'

export function CreateContextForm({
  matterId,
  items,
}: {
  matterId: string
  items: { id: string; label: string }[]
}) {
  return (
    <IntentForm
      receipted
      draftKey={`matter:${matterId}:new-context`}
      submitLabel={<LocalizedText en="Add record" vi="Thêm bản ghi" />}
      run={(v, key) =>
        createContextAction({
          matterId,
          idempotencyKey: key,
          kind: v.kind ?? '',
          title: v.title ?? '',
          body: v.body ?? '',
          links: v.links ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Kind" vi="Loại" />}
            required
            error={errors.kind?.[0]}
          >
            {(c) => (
              <Select
                name="kind"
                placeholder="Choose"
                options={CONTEXT_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k]! }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Title" vi="Tiêu đề" />}
            required
            error={errors.title?.[0]}
          >
            {(c) => <Input name="title" maxLength={200} autoComplete="off" {...c} />}
          </FormField>
          <FormField label={<LocalizedText en="Details" vi="Chi tiết" />} error={errors.body?.[0]}>
            {(c) => <Textarea name="body" rows={3} maxLength={4000} {...c} />}
          </FormField>
          <fieldset className="flex max-h-48 flex-col gap-1 overflow-auto">
            <legend className="text-sm font-medium">
              <LocalizedText en="Concerns these records" vi="Liên quan các bản ghi" />
            </legend>
            {items.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="links" value={i.id} className="size-4" />
                {i.label}
              </label>
            ))}
          </fieldset>
        </>
      )}
    </IntentForm>
  )
}

/** Closing needs a reason and a closed record stays visible; reopening needs none. */
export function CloseContextForm({
  matterId,
  record,
}: {
  matterId: string
  record: ContextRecord
}) {
  if (record.status === 'CLOSED') {
    return (
      <ConfirmActionButton
        label="Reopen"
        confirmLabel="Reopen record"
        warning={`Reopen “${record.title}”? It returns to the open lists.`}
        variant="primary"
        run={() =>
          updateContextAction({
            matterId,
            recordId: record.id,
            ifMatch: record.etag,
            action: 'reopen',
            reason: '',
          })
        }
      />
    )
  }
  return (
    <IconDisclosure
      icon={<CircleX />}
      label={{ en: 'Close this record…', vi: 'Đóng bản ghi này…' }}
    >
      <IntentForm
        receipted={false}
        draftKey={`context:${record.id}:close`}
        submitLabel={<LocalizedText en="Close record" vi="Đóng bản ghi" />}
        run={(v) =>
          updateContextAction({
            matterId,
            recordId: record.id,
            ifMatch: record.etag,
            action: 'close',
            reason: v.reason ?? '',
          })
        }
      >
        {({ errors }) => (
          <FormField
            label={<LocalizedText en="Why is it closed?" vi="Lý do đóng?" />}
            required
            error={errors.reason?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
        )}
      </IntentForm>
    </IconDisclosure>
  )
}
