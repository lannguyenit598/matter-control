import { ArrowRight, Briefcase } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'
import { ListSection, LIST_CLASS, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { Matter } from '../schemas'

import { MatterRoleLabel } from './role-label'

/** `action` is the section's one primary action, e.g. the create-matter dialog trigger. */
export function MatterList({
  items,
  total,
  action,
}: {
  items: Matter[]
  total: number | null
  action?: ReactNode
}) {
  return (
    <ListSection
      title={<LocalizedText en="Matters" vi="Hồ sơ" />}
      count={
        items.length > 0 ? (
          <>
            {total ?? items.length} <LocalizedText en="you can access" vi="bạn được truy cập" />
          </>
        ) : undefined
      }
      action={action}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={<LocalizedText en="No matters you can open" vi="Chưa có hồ sơ bạn được mở" />}
          description={
            <LocalizedText
              en="Matters appear here only when you have explicit membership in them. Workspace ownership alone does not grant access."
              vi="Hồ sơ chỉ hiện ở đây khi bạn được cấp quyền rõ ràng. Chỉ là chủ sở hữu không gian làm việc thì chưa có quyền vào hồ sơ."
            />
          }
        />
      ) : (
        <ul className={LIST_CLASS}>
          {items.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matters/${m.id}`}
                className={`${ROW_CLASS} group transition-colors hover:bg-muted/60`}
              >
                <span className="flex min-w-0 items-center gap-3 font-medium break-words">
                  <Briefcase aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-words">{m.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge variant="neutral">
                    <MatterRoleLabel role={m.callerRole} />
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
