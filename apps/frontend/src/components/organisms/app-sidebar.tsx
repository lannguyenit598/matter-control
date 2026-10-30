import Link from 'next/link'
import type { ReactNode } from 'react'

import { NavMenu, type NavItem } from '@/components/molecules/nav-menu'
import { cn } from '@/lib/utils'

export type AppSidebarProps = {
  brand: ReactNode
  items: readonly NavItem[]
  footer?: ReactNode
  className?: string
}

/** Desktop navigation column. On small screens use MobileNav instead. */
export function AppSidebar({ brand, items, footer, className }: AppSidebarProps) {
  return (
    <aside className={cn('app-sidebar flex h-full flex-col', className)}>
      <Link href="/" className="app-brand flex items-center font-bold tracking-tight">
        {brand}
      </Link>
      <nav aria-label="Main" className="app-navigation flex-1">
        <NavMenu items={items} />
      </nav>
      {footer && <div className="mt-6 border-t pt-4">{footer}</div>}
    </aside>
  )
}
