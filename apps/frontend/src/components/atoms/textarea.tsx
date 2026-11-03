import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { fieldControlClass } from './input'

export type TextareaProps = ComponentProps<'textarea'>

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      data-slot="textarea"
      className={cn(fieldControlClass, 'py-2', className)}
      {...props}
    />
  )
}
