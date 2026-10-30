import type { ReactNode } from 'react'

import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

/**
 * One option of a "what do you want to do?" group: a toggle button with an icon, a name and a
 * one-line explanation. `unfinished` says that this option has a request in flight or an
 * unconfirmed outcome while it is not the one showing, so choosing another never hides it.
 */
export function TaskChoice({
  icon,
  title,
  description,
  pressed,
  unfinished,
  onClick,
}: {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  pressed: boolean
  unfinished?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'control-target flex items-start gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        pressed && 'border-primary bg-accent',
      )}
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-5">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-medium">
          {title}
          {unfinished && !pressed && (
            <span className="ml-2 text-xs font-normal text-destructive">
              <LocalizedText en="Not finished — open to check" vi="Chưa xong — mở để kiểm tra" />
            </span>
          )}
        </span>
        <span className="text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}
