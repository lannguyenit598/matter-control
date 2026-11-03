import { ArrowRight, Building2 } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'
import { ListSection, LIST_CLASS, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { WorkspaceListItem } from '../schemas'

import { WorkspaceRoleLabel } from './role-label'

/** `action` is the section's one primary action, e.g. the create-workspace dialog trigger. */
export function WorkspaceList({
  items,
  total,
  action,
}: {
  items: WorkspaceListItem[]
  total: number | null
  action?: React.ReactNode
}) {
  const count = total ?? items.length
  return (
    <ListSection
      title={<LocalizedText en="Workspaces" vi="Không gian làm việc" />}
      count={items.length > 0 ? count : undefined}
      action={action}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={
            <LocalizedText
              en="A place for your next matter"
              vi="Không gian cho hồ sơ tiếp theo của bạn"
            />
          }
          description={
            <LocalizedText
              en="Create your first workspace, or ask an owner to add you. Your team's matters will start here."
              vi="Tạo không gian đầu tiên hoặc nhờ chủ sở hữu thêm bạn. Đây là nơi bắt đầu các hồ sơ của đội ngũ."
            />
          }
        />
      ) : (
        <ul className={LIST_CLASS}>
          {items.map((w) => (
            <li key={w.id}>
              <Link
                href={`/workspaces/${w.id}`}
                className={`${ROW_CLASS} group transition-colors hover:bg-muted/60`}
              >
                <span className="flex min-w-0 items-center gap-3 font-medium break-words">
                  <Building2 aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-words">{w.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge variant="neutral">
                    <WorkspaceRoleLabel role={w.callerRole} />
                  </Badge>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListSection>
  )
}
