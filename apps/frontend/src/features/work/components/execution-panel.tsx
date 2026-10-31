'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useState } from 'react'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { LocalDateTimeField } from '@/components/molecules/local-datetime-field'
import { IntentForm } from '@/components/organisms/intent-form'
import { useTimeZone } from '@/hooks/use-time-zone'
import { fieldFailure } from '@/lib/mc/action-result'
import { readLocalField } from '@/lib/mc/local-time'

import { transitionExecutionAction } from '../actions'
import {
  EXECUTION_LABEL,
  offeredTransitions,
  primaryTransition,
  WORK_LABEL_VI,
  TRANSITION_VERB,
} from '../labels'
import type { Envelope, Party } from '../schemas'

import { RejectionDetails } from './rejection-details'

/**
 * Change of execution status. Only the steps the approved table allows for the caller's role are
 * offered; the API remains the authority and answers a refusal with its reason and the gates that
 * failed. Waiting and blocked are different things: waiting needs a party and a condition.
 */
export function ExecutionPanel({
  matterId,
  entry,
  role,
  parties,
  titles,
}: {
  matterId: string
  entry: Envelope
  role: string
  parties: Party[]
  titles: Record<string, string>
}) {
  const it = entry.item
  const zone = useTimeZone()
  const options = offeredTransitions(it.execution, role)
  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {it.execution === 'COMPLETED' || it.execution === 'CANCELLED'
          ? 'Reopening a finished record is limited to matter owners.'
          : 'You can read this record but not change its status.'}
      </p>
    )
  }
  return (
    <IntentForm
      receipted={false}
      draftKey={`item:${it.id}:execution`}
      submitLabel={<LocalizedText en="Change status" vi="Đổi trạng thái" />}
      renderRejection={(r) => <RejectionDetails rejection={r} titles={titles} />}
      run={(v) => {
        const done = readLocalField(v, 'completed', zone, null)
        if (!done.ok) return Promise.resolve(fieldFailure('completedAt', done.error))
        return transitionExecutionAction({
          matterId,
          itemId: it.id,
          ifMatch: entry.etag,
          to: v.to,
          reason: v.reason ?? '',
          waitingPartyId: v.waitingPartyId ?? '',
          waitingCondition: v.waitingCondition ?? '',
          completedAt: done.iso,
        })
      }}
    >
      {({ errors }) => (
        <Fields
          current={it.execution}
          options={options}
          primary={primaryTransition(it.execution, role)}
          parties={parties}
          errors={errors}
        />
      )}
    </IntentForm>
  )
}

function Fields({
  current,
  options,
  primary,
  parties,
  errors,
}: {
  current: string
  options: string[]
  /** The step emphasised by the page; the others stay selectable. */
  primary: string | null
  parties: Party[]
  errors: Record<string, string[] | undefined>
}) {
  const [to, setTo] = useState(primary ?? options[0] ?? '')
  const needsReason =
    to === 'CANCELLED' ||
    (to === 'IN_PROGRESS' && (current === 'COMPLETED' || current === 'CANCELLED')) ||
    (to === 'COMPLETED' && current !== 'IN_PROGRESS')
  return (
    <>
      <FormField
        label={<LocalizedText en="Change status to" vi="Đổi trạng thái thành" />}
        required
        error={errors.to?.[0]}
      >
        {(c) => (
          <Select
            name="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            options={options.map((o) => ({
              value: o,
              label: (
                <LocalizedText
                  en={`${TRANSITION_VERB[o] ?? o} (${EXECUTION_LABEL[o] ?? o})`}
                  vi={`${({ IN_PROGRESS: 'Bắt đầu / tiếp tục công việc', WAITING: 'Chờ bên ngoài', COMPLETED: 'Đánh dấu hoàn tất', CANCELLED: 'Hủy (chủ sở hữu)' } as Record<string, string>)[o] ?? o} (${WORK_LABEL_VI[o] ?? o})`}
                />
              ),
            }))}
            {...c}
          />
        )}
      </FormField>
      {to === 'WAITING' && (
        <>
          <FormField
            label={<LocalizedText en="Waiting on (external party)" vi="Đang chờ (bên ngoài)" />}
            required
            error={errors.waitingPartyId?.[0]}
            hint={
              <LocalizedText
                en="Create the party under Planning if it is not listed."
                vi="Thêm bên ngoài trong Kế hoạch nếu chưa có trong danh sách."
              />
            }
          >
            {(c) => (
              <Select
                name="waitingPartyId"
                placeholder="Choose a party"
                options={parties.map((p) => ({ value: p.id, label: p.name }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Condition to resume" vi="Điều kiện để tiếp tục" />}
            required
            error={errors.waitingCondition?.[0]}
          >
            {(c) => <Input name="waitingCondition" maxLength={2000} autoComplete="off" {...c} />}
          </FormField>
        </>
      )}
      {to === 'COMPLETED' && current === 'NOT_STARTED' && (
        <LocalDateTimeField
          name="completed"
          required
          label={<LocalizedText en="Completed at" vi="Hoàn tất lúc" />}
          hint={
            <LocalizedText
              en="When the work was actually done."
              vi="Thời điểm công việc thực sự hoàn tất."
            />
          }
          error={errors.completedAt?.[0]}
        />
      )}
      <FormField
        label={needsReason ? 'Reason (required)' : 'Reason (optional)'}
        required={needsReason}
        error={errors.reason?.[0]}
      >
        {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
      </FormField>
    </>
  )
}
