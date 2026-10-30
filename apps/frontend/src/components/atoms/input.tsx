import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Shared look for text-like controls (Input, Textarea, Select). Error style follows aria-invalid. */
export const fieldControlClass =
  'control-target w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm transition-colors duration-160 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled aria-invalid:border-destructive aria-invalid:outline-destructive'

export type InputProps = ComponentProps<'input'>

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldControlClass, 'min-h-10 py-2', className)}
      {...props}
    />
  )
}
