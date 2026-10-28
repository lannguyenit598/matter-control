import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** Surface container. Compose the parts you need; all are optional. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground', className)} {...props} />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-4 pb-3', className)} {...props} />
}

/** Renders <h2>: cards are sections directly under the page <h1>. */
export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('leading-snug font-semibold', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />
}
