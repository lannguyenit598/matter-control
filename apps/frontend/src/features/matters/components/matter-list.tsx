import { LocalizedText } from '@/components/molecules/localized-text'
import { Briefcase } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'

import type { Matter } from '../schemas'

export function MatterList({ items, total }: { items: Matter[]; total: number | null }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase />}
        title={<LocalizedText en="No matters you can open" vi="Chưa có hồ sơ bạn được mở" />}
        description="Matters appear here only when you have explicit membership in them. Workspace ownership alone does not grant access."
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total ?? items.length} {(total ?? items.length) === 1 ? 'matter' : 'matters'}{' '}
        <LocalizedText en="you can access" vi="bạn được truy cập" />
      </p>
      <ul className="divide-y rounded-lg border">
        {items.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 p-3">
            <Link
              href={`/matters/${m.id}`}
              className="min-w-0 font-medium break-words hover:underline"
            >
              {m.title}
            </Link>
            <Badge variant={m.callerRole === 'OWNER' ? 'primary' : 'neutral'}>{m.callerRole}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
