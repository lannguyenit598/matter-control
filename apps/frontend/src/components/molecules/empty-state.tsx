import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** Usually a Button or Link that resolves the empty state. */
  action?: ReactNode
  /** Heading level for the title. Use 'h1' when the empty state is the whole page (e.g. 404). */
  titleAs?: 'h1' | 'h2' | 'h3'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  titleAs: Title = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border bg-card px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div aria-hidden className="text-muted-foreground [&_svg]:size-7 [&_svg]:stroke-[1.4]">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Title className="text-base font-medium">{title}</Title>
        {description && (
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
