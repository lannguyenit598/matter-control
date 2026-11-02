'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Dialog } from '@/components/molecules/dialog'
import { LocalizedText } from '@/components/molecules/localized-text'
import { mainDestinations } from '@/config/navigation'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

export type PaletteDestination = { href: string; en: string; vi: string }

const subscribeNothing = () => () => {}
const clientIsApple = () => /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const serverIsApple = () => true

export type CommandPaletteProps = {
  /**
   * Jump destinations to offer. Defaults to the app's main navigation so the sidebar and the
   * palette never disagree; pass an explicit list only in tests and stories.
   */
  destinations?: readonly PaletteDestination[]
  className?: string
  renderBody?: (controls: { close: () => void }) => ReactNode
  description?: ReactNode
  triggerLabel?: string
}

/**
 * ⌘K (Ctrl-K) quick navigation: a filter box over the app's jump destinations, built on the
 * shared Dialog (native <dialog>: focus trap, Escape, top layer, focus return). Results are
 * plain links, so open-in-new-tab and the browser's own link gestures keep working. Server-side
 * search (matters, workspaces) joins later as extra sections; static destinations are the
 * always-available floor, listed before any async section.
 */
export function CommandPalette({
  destinations = mainDestinations,
  className,
  renderBody,
  description,
  triggerLabel,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  // ⌘K on Apple keyboards, Ctrl-K elsewhere. Hydration renders the ⌘K server snapshot, then the
  // client snapshot corrects it after mount (same external-store read as useGlassTier's tier).
  const isApple = useSyncExternalStore(subscribeNothing, clientIsApple, serverIsApple)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      const target = event.target as Element | null
      // Never steal the shortcut from another open modal; inside this palette it still toggles.
      const inDialog = target?.closest?.('dialog[open]')
      if (inDialog && !target?.closest?.('[data-command-palette]')) return
      event.preventDefault()
      setOpen((value) => !value)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel ?? (locale === 'vi' ? 'Tìm trang' : 'Search pages')}
        className={cn('app-search-trigger text-muted-foreground', className)}
      >
        <Search aria-hidden />
        <span className="hidden sm:inline">
          <LocalizedText en="Search" vi="Tìm kiếm" />
        </span>
        <kbd
          aria-hidden
          className="hidden rounded border bg-muted px-1 text-xs whitespace-nowrap text-muted-foreground sm:inline"
        >
          {isApple ? '⌘K' : 'Ctrl\u00A0K'}
        </kbd>
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={<LocalizedText en="Quick search" vi="Tìm kiếm nhanh" />}
        description={description ?? <LocalizedText en="Jump to a page." vi="Đi tới một trang." />}
      >
        {renderBody ? (
          renderBody({ close: () => setOpen(false) })
        ) : (
          <PaletteBody destinations={destinations} close={() => setOpen(false)} />
        )}
      </Dialog>
    </>
  )
}

function PaletteBody({
  destinations,
  close,
}: {
  destinations: readonly PaletteDestination[]
  close: () => void
}) {
  const id = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? destinations.filter(
        (destination) =>
          destination.en.toLowerCase().includes(needle) ||
          destination.vi.toLowerCase().includes(needle),
      )
    : destinations

  function onQueryKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    const first = listRef.current?.querySelector<HTMLAnchorElement>('a')
    if (event.key === 'Enter' && first && matches.length > 0) {
      // The first match is the palette's answer to the query; Enter follows it (never a submit).
      event.preventDefault()
      first.click()
    }
    if (event.key === 'ArrowDown' && first) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div data-command-palette className="flex flex-col gap-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor={`${id}-query`} className="sr-only">
          <LocalizedText en="Filter pages" vi="Lọc trang" />
        </label>
        <Input
          id={`${id}-query`}
          type="search"
          value={query}
          maxLength={100}
          autoComplete="off"
          data-autofocus
          className="pl-8"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onQueryKey}
        />
      </div>
      {matches.length > 0 ? (
        <ul ref={listRef} className="flex flex-col gap-1">
          {matches.map((destination) => (
            <li key={destination.href}>
              <Link
                href={destination.href}
                onClick={close}
                className="flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <LocalizedText en={destination.en} vi={destination.vi} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <LocalizedText en="No page matches this search." vi="Không có trang nào khớp." />
        </p>
      )}
    </div>
  )
}
