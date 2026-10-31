'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useTimeZone } from '@/hooks/use-time-zone'
import { instantToLocal, offsetLabel, resolveLocal } from '@/lib/mc/local-time'

/**
 * A date and time typed as wall-clock time in the device zone (BF-03). The zone is shown, never
 * chosen. The control is named `<name>Local`; an ambiguous time (clocks repeat it) adds
 * `<name>Choice`. The submitting form turns both into an explicit instant with `readLocalField`,
 * which also keeps an untouched original instant exactly as stored.
 */
export function LocalDateTimeField({
  name,
  label,
  current = null,
  hint,
  error,
  required,
}: {
  name: string
  label: ReactNode
  /** The stored instant being edited, if any. */
  current?: string | null
  hint?: ReactNode
  error?: string
  required?: boolean
}) {
  const zone = useTimeZone()
  const initial = current ? instantToLocal(current, zone) : ''
  const input = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState(initial)

  // A kept draft is written into the DOM after mount, without an input event: read it back.
  useEffect(() => {
    const t = setTimeout(() => setTyped(input.current?.value ?? ''), 0)
    return () => clearTimeout(t)
  }, [zone])

  const resolved = resolveLocal(typed, zone)
  const untouched = Boolean(current) && typed === initial
  const problem =
    error ??
    (resolved.kind === 'nonexistent' && !untouched
      ? 'That local time does not exist in your time zone (clocks skip it). Pick another.'
      : resolved.kind === 'invalid'
        ? 'Enter a valid date and time.'
        : undefined)
  const shown =
    resolved.kind === 'ok'
      ? offsetLabel(resolved.iso, zone)
      : resolved.kind === 'ambiguous'
        ? offsetLabel(resolved.earlier, zone)
        : ''

  return (
    <div className="flex flex-col gap-2">
      <FormField
        label={label}
        hint={
          <>
            <LocalizedText en="Time zone" vi="Múi giờ" />: {zone}
            {shown ? ` (${shown})` : ''}
            {hint ? <> · {hint}</> : null}
          </>
        }
        error={problem}
        required={required}
      >
        {(control) => (
          <Input
            key={`${zone}:${initial}`}
            ref={input}
            type="datetime-local"
            name={`${name}Local`}
            defaultValue={initial}
            onChange={(event) => setTyped(event.currentTarget.value)}
            {...control}
          />
        )}
      </FormField>
      {resolved.kind === 'ambiguous' && !untouched && (
        <FormField
          label={
            <LocalizedText
              en="This local time happens twice. Which one?"
              vi="Giờ địa phương này xảy ra hai lần. Chọn lần nào?"
            />
          }
          required
        >
          {(control) => (
            <Select
              name={`${name}Choice`}
              defaultValue=""
              placeholder="Choose…"
              options={[
                { value: 'earlier', label: `First (${offsetLabel(resolved.earlier, zone)})` },
                { value: 'later', label: `Second (${offsetLabel(resolved.later, zone)})` },
              ]}
              {...control}
            />
          )}
        </FormField>
      )}
    </div>
  )
}
