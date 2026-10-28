import type { ComponentProps, ReactNode } from 'react'

/** A labelled native checkbox (keyboard and screen reader friendly by construction). */
export function Checkbox({ label, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--primary)]" {...props} />
      <span className="break-words">{label}</span>
    </label>
  )
}
