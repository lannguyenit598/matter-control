import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Primary page actions, e.g. a "New item" button. */
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[1.375rem] leading-snug font-semibold tracking-normal break-words">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
