'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  Building2,
  FileText,
  FolderOpen,
  ListTodo,
  Search,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { CommandPalette, type PaletteDestination } from '@/components/organisms/command-palette'
import { LocalizedText } from '@/components/molecules/localized-text'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { useLocale } from '@/hooks/use-locale'
import type { UiSession } from '@/lib/ui-session'
import { onPrivateUi, usePrivateScope } from '@/lib/mc/private-ui-events'
import { useSearch } from '../use-search'
import { GROUPS, resultHref, type SearchGroupName, type SearchItem } from '../schemas'

const labels = {
  workspaces: { en: 'Workspaces', vi: 'Không gian' },
  matters: { en: 'Matters', vi: 'Hồ sơ' },
  workItems: { en: 'Work items', vi: 'Công việc' },
  documents: { en: 'Documents', vi: 'Tài liệu' },
}
const icons = {
  workspaces: Building2,
  matters: FolderOpen,
  workItems: ListTodo,
  documents: FileText,
}
const kinds = {
  ACTION: { en: 'Action', vi: 'Hành động' },
  REQUIREMENT: { en: 'Requirement', vi: 'Yêu cầu' },
  FILING: { en: 'Filing', vi: 'Thủ tục' },
  WORKSPACE: labels.workspaces,
  MATTER: labels.matters,
  DOCUMENT: labels.documents,
}
const executions: Record<string, { en: string; vi: string }> = {
  NOT_STARTED: { en: 'Not started', vi: 'Chưa bắt đầu' },
  IN_PROGRESS: { en: 'In progress', vi: 'Đang thực hiện' },
  WAITING: { en: 'Waiting', vi: 'Đang chờ' },
  COMPLETED: { en: 'Completed', vi: 'Hoàn tất' },
  CANCELLED: { en: 'Cancelled', vi: 'Đã hủy' },
}

export function QuickSearch({
  identity,
  destinations,
}: {
  identity: UiSession | null
  destinations: readonly PaletteDestination[]
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const matterId = /^\/matters\/([A-Za-z0-9_-]{1,100})(?:\/|$)/.exec(pathname)?.[1]
  return (
    <CommandPalette
      triggerLabel={
        locale === 'vi' ? 'Tìm trang và công việc pháp lý' : 'Search pages and legal work'
      }
      description={
        <LocalizedText
          en="Find pages and records you can access."
          vi="Tìm trang và bản ghi bạn được phép xem."
        />
      }
      renderBody={({ close }) => (
        <SearchBody
          key={identity?.epoch ?? 'signed-out'}
          epoch={identity?.epoch}
          matterId={matterId}
          destinations={destinations}
          close={close}
        />
      )}
    />
  )
}

export function SearchBody({
  epoch,
  matterId,
  destinations,
  close,
}: {
  epoch?: string
  matterId?: string
  destinations: readonly PaletteDestination[]
  close: () => void
}) {
  const locale = useLocale()
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [composing, setComposing] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const scope = usePrivateScope()
  useEffect(
    () =>
      onPrivateUi((event) => {
        if (
          scope &&
          event.scope.epoch === scope.epoch &&
          event.scope.runtime === scope.runtime &&
          event.type === 'session-ended'
        ) {
          setQuery('')
          setActive(null)
        }
      }),
    [scope],
  )
  const search = useSearch(query, epoch, matterId, composing)
  const needle = query.trim().toLocaleLowerCase()
  const length = [...query.trim()].length
  const pages = destinations.filter((d) => `${d.en} ${d.vi}`.toLocaleLowerCase().includes(needle))
  const currentActive = active?.startsWith(`${query}\u0000`) ? active.split('\u0000')[1] : null
  const state = search.state
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    const links = [
      ...(root.current?.querySelectorAll<HTMLAnchorElement>('[data-search-result]') ?? []),
    ]
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!search.loading && !composing && currentActive)
        links.find((link) => link.id === currentActive)?.click()
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (links.length === 0 || search.loading) return
      const index = links.findIndex((link) => link.id === currentActive)
      const next =
        links[
          (index + (event.key === 'ArrowDown' ? 1 : links.length - 1) + links.length) % links.length
        ]!
      setActive(`${query}\u0000${next.id}`)
      next.focus()
    }
  }
  return (
    <div
      ref={root}
      data-command-palette
      onKeyDown={navigate}
      className="flex min-w-0 flex-col gap-3"
    >
      <label className="relative">
        <span className="sr-only">
          <LocalizedText en="Search pages and legal work" vi="Tìm trang và công việc pháp lý" />
        </span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          autoComplete="off"
          data-autofocus
          className="pl-9"
          onChange={(e) => {
            setActive(null)
            setQuery(e.target.value)
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false)
            setQuery(e.currentTarget.value)
          }}
        />
      </label>
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {length === 1 && (
          <LocalizedText
            en="Enter at least 2 characters to search records."
            vi="Nhập ít nhất 2 ký tự để tìm bản ghi."
          />
        )}
        {length > 100 && (
          <LocalizedText
            en="Search text must be 100 characters or fewer."
            vi="Nội dung tìm kiếm không được vượt quá 100 ký tự."
          />
        )}
        {search.loading && (
          <LocalizedText
            en="Searching authorized records…"
            vi="Đang tìm các bản ghi được phép xem…"
          />
        )}
        {state?.status === 'session-ended' && (
          <LocalizedText
            en="Your session changed. Reload before searching records."
            vi="Phiên đã thay đổi. Đọc lại trang trước khi tìm bản ghi."
          />
        )}
        {state?.status === 'stale' && (
          <LocalizedText
            en="Results changed. Refresh this search."
            vi="Kết quả đã thay đổi. Hãy tìm lại."
          />
        )}
        {state?.status === 'unavailable' && (
          <LocalizedText
            en="Record search is unavailable. Page navigation still works."
            vi="Tìm bản ghi tạm thời không khả dụng. Bạn vẫn có thể mở trang."
          />
        )}
      </div>
      {state && ['stale', 'unavailable'].includes(state.status) && (
        <Button variant="outline" size="sm" onClick={search.retry}>
          <RefreshCw aria-hidden />
          <LocalizedText en="Refresh search" vi="Tìm lại" />
        </Button>
      )}
      {state?.status === 'ready' && (
        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => {
            const result = state.groups[group],
              Icon = icons[group]
            return (
              <section key={group} aria-labelledby={`${id}-${group}`}>
                <h3
                  id={`${id}-${group}`}
                  className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                >
                  <Icon aria-hidden className="size-4" />
                  <LocalizedText {...labels[group]} />
                </h3>
                {result?.status === 'unavailable' ? (
                  <p className="text-sm text-muted-foreground">
                    <LocalizedText en="Temporarily unavailable" vi="Tạm thời không khả dụng" />
                  </p>
                ) : !result || result.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    <LocalizedText en="No matching records" vi="Không có bản ghi khớp" />
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {result.items.map((row, index) => {
                      const rid = `${id}-${group}-${row.id}`
                      return (
                        <li key={`${row.kind}:${row.id}`}>
                          <Link
                            id={rid}
                            data-search-result
                            href={resultHref(row)}
                            onClick={close}
                            onFocus={() => setActive(`${query}\u0000${rid}`)}
                            className={`flex min-h-11 min-w-0 items-start gap-2 rounded-lg p-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${currentActive === rid ? 'bg-accent' : ''}`}
                          >
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5 [overflow-wrap:anywhere]">
                              <strong className="font-medium">{row.label}</strong>
                              <span className="text-xs text-muted-foreground">
                                <LocalizedText {...kinds[row.kind]} /> · {row.workspaceName}
                                {row.matterTitle ? ` / ${row.matterTitle}` : ''}
                              </span>
                              <ResultMetadata
                                row={row}
                                duplicate={
                                  row.sameName ||
                                  result.items.some(
                                    (other, i) =>
                                      i !== index &&
                                      other.label === row.label &&
                                      other.kind === row.kind &&
                                      other.matterId === row.matterId,
                                  )
                                }
                              />
                            </span>
                            <ArrowUpRight
                              aria-hidden
                              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {state.pageError === group && (
                  <p role="status" className="text-xs text-muted-foreground">
                    <LocalizedText
                      en="More results could not be loaded. Current results are kept; try again."
                      vi="Chưa tải được kết quả tiếp theo. Kết quả hiện tại được giữ; hãy thử lại."
                    />
                  </p>
                )}
                {result?.hasMore && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={state.paging !== undefined}
                    onClick={async (event) => {
                      const button = event.currentTarget
                      const oldCount = result.items.length
                      await search.more(group as SearchGroupName)
                      requestAnimationFrame(() => {
                        if (button.isConnected) button.focus()
                        else {
                          const links = root.current?.querySelectorAll<HTMLAnchorElement>(
                            `[id^="${id}-${group}-"]`,
                          )
                          links?.[Math.max(oldCount, (links.length ?? 1) - 1)]?.focus()
                        }
                      })
                    }}
                  >
                    <LocalizedText
                      en={`Show more ${labels[group].en.toLowerCase()}`}
                      vi={`Xem thêm ${labels[group].vi.toLowerCase()}`}
                    />
                  </Button>
                )}
              </section>
            )
          })}
        </div>
      )}
      {pages.length > 0 && (
        <section className={length >= 2 ? 'border-t pt-3' : ''}>
          <h3 className="mb-1 text-xs font-semibold text-muted-foreground">
            <LocalizedText en="Pages" vi="Trang" />
          </h3>
          <ul>
            {pages.map((page, index) => (
              <li key={page.href}>
                <Link
                  id={`${id}-page-${index}`}
                  data-search-result
                  onFocus={() => setActive(`${query}\u0000${id}-page-${index}`)}
                  href={page.href}
                  onClick={close}
                  className="flex min-h-10 items-center rounded-lg px-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  {locale === 'vi' ? page.vi : page.en}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function ResultMetadata({ row, duplicate }: { row: SearchItem; duplicate: boolean }) {
  return (
    <span className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      {row.outcome && <span className="line-clamp-2">{row.outcome}</span>}
      {row.execution && executions[row.execution] && (
        <span>
          <LocalizedText {...executions[row.execution]!} />
          {row.dueAt && (
            <>
              {' '}
              · <LocalizedInstant iso={row.dueAt} />
            </>
          )}
        </span>
      )}
      {row.version > 0 && (
        <span>
          <LocalizedText en={`Version ${row.version}`} vi={`Phiên bản ${row.version}`} />
          {row.uploadedAt && (
            <>
              {' '}
              · <LocalizedInstant iso={row.uploadedAt} />
            </>
          )}
        </span>
      )}
      {duplicate && (
        <span>
          <LocalizedText
            en="Same name — open to inspect"
            vi="Trùng tên — mở chi tiết để xác định"
          />
        </span>
      )}
    </span>
  )
}
