import { Check, Minus } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Native form/keyboard behavior with a token-colored mark; the surrounding label is the target. */
export function SelectionControl({
  type = 'checkbox',
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { type?: 'checkbox' | 'radio' }) {
  return (
    <span className={cn('selection-control', className)}>
      <input type={type} className="selection-control-input" {...props} />
      <span aria-hidden className="selection-control-mark">
        {type === 'checkbox' ? (
          <>
            <Check className="selection-control-check" />
            <Minus className="selection-control-mixed" />
          </>
        ) : (
          <span className="selection-control-dot" />
        )}
      </span>
    </span>
  )
}
