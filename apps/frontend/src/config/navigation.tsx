import { Building2, Inbox } from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'

import type { NavItem } from '@/components/molecules/nav-menu'

/** Main navigation. Add an entry here when you add a feature route. */
export const mainNavigation: NavItem[] = [
  {
    href: '/workspaces',
    label: <LocalizedText en="Workspaces" vi="Không gian làm việc" />,
    icon: <Building2 />,
  },
  {
    href: '/my-actions',
    label: <LocalizedText en="My Actions" vi="Việc của tôi" />,
    icon: <Inbox />,
  },
]
