import { Building2, ClipboardCheck, FolderOpen, ListChecks } from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'

import type { NavItem } from '@/components/molecules/nav-menu'

/** Main navigation. Add an entry here when you add a feature route. */
export const mainNavigation: NavItem[] = [
  {
    href: '/my-actions',
    label: <LocalizedText en="My Work" vi="Việc của tôi" />,
    icon: <ListChecks />,
  },
  {
    href: '/my-reviews',
    label: <LocalizedText en="Reviews due" vi="Cần xác minh" />,
    icon: <ClipboardCheck />,
  },
  {
    href: '/matters',
    label: <LocalizedText en="Matters" vi="Hồ sơ" />,
    icon: <FolderOpen />,
    alsoActiveFor: ['/requirements'],
  },
  {
    href: '/workspaces',
    label: <LocalizedText en="Workspaces" vi="Không gian làm việc" />,
    icon: <Building2 />,
  },
]
