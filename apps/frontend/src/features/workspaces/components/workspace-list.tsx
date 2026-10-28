import { LocalizedText } from '@/components/molecules/localized-text'
import { Building2 } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'

import type { WorkspaceListItem } from '../schemas'

export function WorkspaceList({
  items,
  total,
}: {
  items: WorkspaceListItem[]
  total: number | null
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title={
          <LocalizedText
            en="You are not a member of any workspace yet"
            vi="Bạn chưa tham gia không gian làm việc nào"
          />
        }
        description={
          <LocalizedText
            en="Create a workspace to start, or ask a workspace owner to add you."
            vi="Tạo không gian làm việc để bắt đầu hoặc nhờ chủ sở hữu thêm bạn."
          />
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total ?? items.length} {(total ?? items.length) === 1 ? 'workspace' : 'workspaces'}
      </p>
      <ul className="divide-y rounded-lg border">
        {items.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-3 p-3">
            <Link
              href={`/workspaces/${w.id}`}
              className="min-w-0 font-medium break-words hover:underline"
            >
              {w.name}
            </Link>
            <Badge variant={w.callerRole === 'OWNER' ? 'primary' : 'neutral'}>{w.callerRole}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
