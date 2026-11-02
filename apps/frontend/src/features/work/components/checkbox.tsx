import { SelectionControl } from '@/components/atoms/selection-control'
import type { ComponentProps, ReactNode } from 'react'

/** A labelled native checkbox (keyboard and screen reader friendly by construction). */
export function Checkbox({
  label,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <SelectionControl className="mt-0.5" {...props} />
      <span className="break-words">{label}</span>
    </label>
  )
}
