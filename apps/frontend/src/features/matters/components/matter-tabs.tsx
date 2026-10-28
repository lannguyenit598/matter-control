import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'

import { cn } from '@/lib/utils'

const TABS = [
  { key: 'overview', label: 'Overview', path: '' },
  { key: 'control-room', label: 'Control Room', path: '/control-room' },
  { key: 'work', label: 'Work', path: '/work' },
  { key: 'documents', label: 'Documents', path: '/documents' },
  { key: 'filings', label: 'Filings', path: '/filings' },
  { key: 'planning', label: 'Planning', path: '/planning' },
  { key: 'data', label: 'Data', path: '/data' },
  { key: 'history', label: 'History', path: '/history' },
] as const

/** Section navigation inside one matter. The current section is announced, not only coloured. */
export function MatterTabs({
  matterId,
  active,
}: {
  matterId: string
  active: (typeof TABS)[number]['key']
}) {
  return (
    <nav aria-label="Matter sections" className="flex flex-wrap gap-1 border-b">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={`/matters/${matterId}${t.path}`}
          aria-current={t.key === active ? 'page' : undefined}
          className={cn(
            'control-target -mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium',
            t.key === active
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <LocalizedText
            en={t.label}
            vi={
              (
                {
                  Overview: 'Tổng quan',
                  'Control Room': 'Phòng điều hành',
                  Work: 'Công việc',
                  Documents: 'Tài liệu',
                  Filings: 'Thủ tục',
                  Planning: 'Kế hoạch',
                  Data: 'Dữ liệu',
                  History: 'Lịch sử',
                } as Record<string, string>
              )[t.label] ?? t.label
            }
          />
        </Link>
      ))}
    </nav>
  )
}
