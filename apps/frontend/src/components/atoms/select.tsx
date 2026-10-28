import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { fieldControlClass } from './input'

export type SelectOption = { value: string; label: ReactNode }

export type SelectProps = ComponentProps<'select'> & {
  options: readonly SelectOption[]
  /** Adds a first option with an empty value (e.g. "All statuses"). */
  placeholder?: ReactNode
}

/** Native <select>: free keyboard, screen reader and mobile support. */
export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(fieldControlClass, 'min-h-8 appearance-none py-1 pr-8')} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
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
