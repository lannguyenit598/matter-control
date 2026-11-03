import { ArrowRight, Briefcase } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { ListSection, LIST_CLASS, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { DiscoveredMatter } from '../schemas'

import { MatterSearch } from './matter-search'
import { MatterRoleLabel } from './role-label'

/**
 * Find a Matter by name without knowing which workspace holds it. The search is a GET form that
 * navigates on the client (see `MatterSearch`), so the URL is the state and the page is not reloaded. The count is
 * the API's exact total of Matters the caller can open: only explicit Matter membership inside an
 * active workspace counts, and nothing here is scored or summed into a readiness figure.
 */
export function MatterDiscovery({
  query,
  items,
  total,
  nextHref,
  firstHref,
}: {
  query: string
  items: DiscoveredMatter[]
  total: number | null
  /** Link to the next page of the same search; null on the last page. */
  nextHref: string | null
  /** Link to the first page; set only when this is a later page. */
  firstHref: string | null
}) {
  const shownCount = total ?? items.length
  return (
    <div className="flex flex-col gap-4">
      <MatterSearch query={query} />

      <ListSection
        title={
          query ? (
            <LocalizedText en="Matching matters" vi="Hồ sơ khớp" />
          ) : (
            <LocalizedText en="Matters" vi="Hồ sơ" />
          )
        }
        count={
          items.length > 0 ? (
            <>
              {shownCount} <LocalizedText en="you can open" vi="bạn mở được" />
            </>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title={
              query ? (
                <LocalizedText en="No matter matches" vi="Không có hồ sơ khớp" />
              ) : (
                <LocalizedText en="No matters you can open" vi="Chưa có hồ sơ bạn được mở" />
              )
            }
            description={
              query ? (
                <LocalizedText
                  en="Only matters you are a member of are searched. Check the spelling, or open Workspaces to create or join one."
                  vi="Chỉ tìm trong các hồ sơ bạn là thành viên. Kiểm tra chính tả, hoặc mở Không gian làm việc để tạo hoặc tham gia."
                />
              ) : (
                <LocalizedText
                  en="Matters appear here only when you have explicit membership in them. Create a workspace and a matter, or ask an owner to add you."
                  vi="Hồ sơ chỉ hiện ở đây khi bạn được cấp quyền rõ ràng. Hãy tạo không gian làm việc và hồ sơ, hoặc nhờ chủ sở hữu thêm bạn."
                />
              )
            }
            action={
              <Link href="/workspaces" className={buttonVariants({ variant: 'outline' })}>
                <LocalizedText en="Open Workspaces" vi="Mở Không gian làm việc" />
              </Link>
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
                  <span className="flex min-w-0 flex-col gap-0.5 font-medium break-words">
                    <span className="flex min-w-0 items-center gap-3">
                      <Briefcase aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 break-words">{m.title}</span>
                    </span>
                    <span className="pl-8 text-sm font-normal text-muted-foreground">
                      <LocalizedText en="Workspace" vi="Không gian" />: {m.workspaceName}
                    </span>
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

      {(firstHref || nextHref) && (
        <nav aria-label="Matter results pages" className="flex flex-wrap gap-3 text-sm">
          {firstHref && (
            <Link href={firstHref} className="underline">
              <LocalizedText en="Back to the first results" vi="Về kết quả đầu tiên" />
            </Link>
          )}
          {nextHref && (
            <Link href={nextHref} rel="next" className="underline">
              <LocalizedText en="Show more matters" vi="Xem thêm hồ sơ" />
            </Link>
          )}
        </nav>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/workspaces" className="underline">
          <LocalizedText
            en="Manage workspaces and their members"
            vi="Quản lý không gian làm việc và thành viên"
          />
        </Link>
      </p>
    </div>
  )
}
