'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  Gauge,
  ListTodo,
  Files,
  Table2,
  Send,
  Network,
  CalendarDays,
  Database,
  History,
} from 'lucide-react'

import { LocalizedText } from '@/components/molecules/localized-text'

import { cn } from '@/lib/utils'

const VI: Record<string, string> = {
  Overview: 'Tổng quan',
  'Control Room': 'Phòng điều hành',
  Work: 'Công việc',
  Documents: 'Tài liệu',
  Reviews: 'Rà soát',
  Filings: 'Thủ tục',
  Planning: 'Kế hoạch',
  Agenda: 'Lịch',
  Data: 'Dữ liệu',
  History: 'Lịch sử',
}

/** Day-to-day sections first; records, data and history follow after a divider (one row, no menu). */
const PRIMARY = [
  { key: 'overview', label: 'Overview', path: '', icon: House },
  { key: 'work', label: 'Work', path: '/work', icon: ListTodo },
  { key: 'documents', label: 'Documents', path: '/documents', icon: Files },
  { key: 'reviews', label: 'Reviews', path: '/reviews', icon: Table2 },
  { key: 'filings', label: 'Filings', path: '/filings', icon: Send },
  { key: 'planning', label: 'Planning', path: '/planning', icon: Network },
  { key: 'agenda', label: 'Agenda', path: '/agenda', icon: CalendarDays },
] as const

const SECONDARY = [
  { key: 'control-room', label: 'Control Room', path: '/control-room', icon: Gauge },
  { key: 'data', label: 'Data', path: '/data', icon: Database },
  { key: 'history', label: 'History', path: '/history', icon: History },
] as const

type Tab = (typeof PRIMARY)[number] | (typeof SECONDARY)[number]

/**
 * Section navigation inside one matter. It lives in the matter layout so it stays mounted while
 * the section below it loads, and derives the current section from the URL. The current section
 * is announced, not only coloured.
 */
export function MatterTabs({ matterId }: { matterId: string }) {
  const pathname = usePathname() ?? ''
  const root = `/matters/${matterId}`
  const active =
    [...PRIMARY, ...SECONDARY].filter(
      (t) => t.path && (pathname === root + t.path || pathname.startsWith(root + t.path + '/')),
    )[0]?.key ?? 'overview'
  const link = (t: Tab) => (
    <Link
      key={t.key}
      href={`/matters/${matterId}${t.path}`}
      aria-current={t.key === active ? 'page' : undefined}
      className={cn(
        'control-target -mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium',
        t.key === active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      <t.icon aria-hidden className="size-4 shrink-0" />
      <LocalizedText en={t.label} vi={VI[t.label] ?? t.label} />
    </Link>
  )
  return (
    <nav
      data-slot="matter-tabs"
      aria-label="Matter sections"
      className="flex items-center gap-1 overflow-x-auto border-b"
    >
      {PRIMARY.map(link)}
      {/* Records, data and history are a quieter group: same row, set apart by a divider. */}
      <span aria-hidden data-slot="tab-divider" className="mx-1 my-2 h-5 w-px shrink-0 bg-border" />
      {SECONDARY.map(link)}
    </nav>
  )
}
