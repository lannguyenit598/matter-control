import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Spinner } from './spinner'

/** Exported so links can look like buttons: <Link className={buttonVariants({ variant: 'outline' })}>. */
export const buttonVariants = cva(
  'glass-button control-target inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-full text-sm leading-5 font-medium [overflow-wrap:anywhere] whitespace-normal transition-colors duration-160 disabled:pointer-events-none disabled:border-border disabled:bg-muted disabled:text-disabled [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'glass-button-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary:
          'glass-button-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'glass-button-outline border border-input bg-card shadow-xs hover:bg-accent',
        ghost: 'glass-button-ghost hover:bg-accent hover:text-accent-foreground',
        destructive:
          'glass-button-destructive bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
      },
      size: {
        sm: 'min-h-8 px-3 py-1',
        md: 'min-h-9 px-3 py-1.5',
        icon: 'min-h-8 min-w-8 p-1.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner and disables the button while an async action runs. */
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
