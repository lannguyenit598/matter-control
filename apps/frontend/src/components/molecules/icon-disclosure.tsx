'use client'

import type { ReactNode } from 'react'

import { buttonVariants } from '@/components/atoms/button'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

type Label = string | { en: string; vi: string }

/**
 * A secondary action that opens its form in place, shown as a small icon button instead of an
 * underlined sentence. It is a native `<details>`: it works without scripts, the form inside stays
 * mounted while closed (drafts and unresolved commands survive), and Enter/Space toggle it. The
 * icon alone carries no meaning, so the same words are its accessible name and its tooltip; the
 * focus ring is the button, never the whole row.
 */
export function IconDisclosure({
  icon,
  label,
  open,
  className,
  children,
}: {
  icon: ReactNode
  label: Label
  open?: boolean
  className?: string
  children: ReactNode
}) {
  const locale = useLocale()
  const name = typeof label === 'string' ? label : label[locale]
  return (
    <details open={open || undefined} className={cn('group text-sm', className)}>
      <summary
        aria-label={name}
        title={name}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'w-fit cursor-pointer list-none group-open:bg-accent [&::-webkit-details-marker]:hidden',
        )}
      >
        <span aria-hidden className="flex items-center justify-center">
          {icon}
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}
