import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'

import type { NavItem } from '@/components/molecules/nav-menu'

/**
 * Plain-data jump destinations: the single source shared by the sidebar/mobile navigation
 * (mainNavigation) and the command palette (CommandPalette). Add an entry here when you add a
 * feature route.
 */
export type MainDestination = {
  href: string
  en: string
  vi: string
  /** Other path prefixes that belong to this destination, e.g. a requirement lives under Matters. */
  alsoActiveFor?: readonly string[]
}

export const mainDestinations: readonly MainDestination[] = [
  { href: '/my-actions', en: 'My Work', vi: 'Việc của tôi' },
  { href: '/agenda', en: 'My Agenda', vi: 'Lịch của tôi' },
  { href: '/my-reviews', en: 'Reviews due', vi: 'Cần xác minh' },
  { href: '/matters', en: 'Matters', vi: 'Hồ sơ', alsoActiveFor: ['/requirements'] },
  { href: '/workspaces', en: 'Workspaces', vi: 'Không gian làm việc' },
]

const NAV_ICONS: Partial<Record<string, LucideIcon>> = {
  '/my-actions': ListChecks,
  '/agenda': CalendarDays,
  '/my-reviews': ClipboardCheck,
  '/matters': FolderOpen,
  '/workspaces': Building2,
}

/** Main navigation for the sidebar and the mobile drawer. */
export const mainNavigation: NavItem[] = mainDestinations.map((destination) => {
  const Icon = NAV_ICONS[destination.href]
  return {
    href: destination.href,
    label: <LocalizedText en={destination.en} vi={destination.vi} />,
    icon: Icon ? <Icon aria-hidden /> : undefined,
    alsoActiveFor: destination.alsoActiveFor,
  }
})
