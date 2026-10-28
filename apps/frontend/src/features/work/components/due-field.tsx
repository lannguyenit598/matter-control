'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'

const OFFSETS = [
  { value: '+00:00', label: 'UTC (+00:00)' },
  { value: '+07:00', label: 'Asia/Ho_Chi_Minh (+07:00)' },
  { value: '+08:00', label: 'Singapore / Hong Kong (+08:00)' },
  { value: '+01:00', label: 'Central Europe (+01:00)' },
  { value: '-05:00', label: 'US Eastern winter (-05:00)' },
  { value: '-08:00', label: 'US Pacific winter (-08:00)' },
]

/** Combines the picked wall-clock time with the chosen offset into an explicit RFC 3339 instant. */
export function composeDue(local: string, offset: string): string {
  if (!local) return ''
  const withSeconds = local.length === 16 ? `${local}:00` : local
  return `${withSeconds}${offset.trim()}`
}

/**
 * A due date is an instant with a visible offset: the form never guesses the browser's zone.
 * Leave the time empty to clear it.
 */
export function DueField({ current, error }: { current: string | null; error?: string }) {
  const local = current ? current.slice(0, 16) : ''
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField
        label={<LocalizedText en="Due (date and time)" vi="Hạn (ngày và giờ)" />}
        hint={
          current
            ? 'Shown in UTC. Choose another offset to enter local time.'
            : 'Leave empty for no due date.'
        }
        error={error}
      >
        {(control) => (
          <Input type="datetime-local" name="dueLocal" defaultValue={local} {...control} />
        )}
      </FormField>
      <FormField label={<LocalizedText en="Offset from UTC" vi="Độ lệch UTC" />}>
        {(control) => (
          <Select name="dueOffset" defaultValue="+00:00" options={OFFSETS} {...control} />
        )}
      </FormField>
    </div>
  )
}
