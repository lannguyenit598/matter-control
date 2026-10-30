'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type NavItem = {
  href: string
  label: ReactNode
  /** Pass an element (<ListTodo />), not a component: elements can cross the server/client boundary. */
  icon?: ReactNode
  /** Other path prefixes that belong to this destination, e.g. a matter lives under Matters. */
  alsoActiveFor?: readonly string[]
}

export type NavMenuProps = {
  items: readonly NavItem[]
  /** Called after a link is clicked, e.g. to close a mobile drawer. */
  onNavigate?: () => void
  className?: string
}

export function NavMenu({ items, onNavigate, className }: NavMenuProps) {
  const pathname = usePathname()
  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {items.map((item) => {
        const active = [item.href, ...(item.alsoActiveFor ?? [])].some(
          (base) => pathname === base || pathname.startsWith(`${base}/`),
        )
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'app-nav-link flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.6]',
                active && 'bg-accent font-medium text-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
