import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Shared look of a bordered list and its rows, so every list has the same density. */
export const LIST_CLASS = 'divide-y divide-border rounded-lg border bg-card'
export const ROW_CLASS =
  'flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3'

export type ListSectionProps = {
  title: ReactNode
  /** Number of rows. Show a total only when the endpoint really provides one. */
  count?: ReactNode
  description?: ReactNode
  /** The one primary action of the section, aligned with the heading. */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Heading + count + primary action above a list: one pattern for every list screen. */
export function ListSection({
  title,
  count,
  description,
  action,
  className,
  children,
}: ListSectionProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id} className="text-lg leading-tight font-semibold">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{count}</span>
            )}
          </h2>
          {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
