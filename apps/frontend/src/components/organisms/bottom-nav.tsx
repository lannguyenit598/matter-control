'use client'

import { NavMenu, type NavItem } from '@/components/molecules/nav-menu'
import { useLocale } from '@/hooks/use-locale'

/** The same destinations and active-route rules as the desktop sidebar, within thumb reach. */
export function BottomNav({ items }: { items: readonly NavItem[] }) {
  const locale = useLocale()
  return (
    <nav
      aria-label={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}
      className="app-bottom-nav"
    >
      <NavMenu items={items} className="app-bottom-links" />
    </nav>
  )
}
