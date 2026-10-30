import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { fieldControlClass } from './input'

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean }

export type SelectProps = ComponentProps<'select'> & {
  options: readonly SelectOption[]
  leadingIcon?: ReactNode
  /** Adds a first option with an empty value (e.g. "All statuses"). */
  placeholder?: ReactNode
}

/** Native form behavior; supported browsers also render the token-styled picker. */
export function Select({ className, options, placeholder, leadingIcon, ...props }: SelectProps) {
  return (
    <div className={cn('relative min-w-0', className)}>
      {leadingIcon && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {leadingIcon}
        </span>
      )}
      <select
        data-slot="select-trigger"
        className={cn(
          fieldControlClass,
          'ui-select min-h-9 appearance-none truncate py-1.5 pr-9 text-left whitespace-nowrap',
          leadingIcon && 'pl-9',
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
