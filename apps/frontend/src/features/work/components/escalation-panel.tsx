'use client'

import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import { escalateAction } from '../actions'
import type { Envelope } from '../schemas'

/** Owner-only: an explicit CRITICAL escalation. It can be cleared, but never hides a derived cause. */
export function EscalationPanel({ matterId, entry }: { matterId: string; entry: Envelope }) {
  const current = entry.item.escalation
  return (
    <IntentForm
      receipted={false}
      draftKey={`item:${entry.item.id}:escalation`}
      submitLabel={current ? 'Update escalation' : 'Escalate to critical'}
      run={(v) =>
        escalateAction({
          matterId,
          itemId: entry.item.id,
          ifMatch: entry.etag,
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <FormField
          label={current ? 'Escalation reason (empty clears it)' : 'Escalation reason'}
          hint="Clearing an escalation does not clear causes derived from the record's own state."
          error={errors.reason?.[0]}
        >
          {(c) => (
            <Textarea name="reason" rows={2} maxLength={2000} defaultValue={current ?? ''} {...c} />
          )}
        </FormField>
      )}
    </IntentForm>
  )
}
