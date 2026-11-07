import { CircleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'

import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/utils'

/** Props to spread onto the control so label, hint and error are announced together. */
export type FormFieldControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

export type FormFieldProps = {
  label: ReactNode
  /** Rendered below the control and linked via aria-describedby. */
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  /** Render prop: receives the id/aria props to spread onto the input. */
  children: (controlProps: FormFieldControlProps) => ReactNode
}

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        /* W8 (UX-B-07): icon + weight give the error unambiguous precedence when the
           hint renders alongside it; the hint itself is unchanged. */
        <p id={errorId} className="flex items-start gap-1 text-xs font-medium text-destructive">
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
