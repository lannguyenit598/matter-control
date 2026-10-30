'use client'

import { Search, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Spinner } from '@/components/atoms/spinner'
import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

export type PickerOption = { value: string; label: string }

/**
 * `denied` = the right to search ended; `unavailable` = the source is off or down; `error` =
 * failed; `invalid` = the query itself is refused (retrying the same text cannot help).
 */
export type PickerResult =
  | { status: 'ok'; options: readonly PickerOption[]; truncated?: boolean }
  | { status: 'denied' | 'unavailable' | 'error' | 'invalid' }

export type SearchPickerProps = {
  /** Form field that carries the one chosen value. Typed text is never submitted. */
  name: string
  legend: ReactNode
  /** Accessible name of the query box (visually hidden label). */
  searchLabel: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  /**
   * Resolves the options for a query (empty = the first page). It may be async and may fail;
   * give the picker a changing `key` when the scope it searches in changes.
   */
  search: (query: string) => Promise<PickerResult>
  /**
   * The complete, authoritative set the caller may choose from (not a name-filtered page). When it
   * changes, rows outside it vanish at once, a chosen person who left it is dropped, and the
   * search runs again. Omit it when the source is only a bounded search: absence from a search
   * result never means ineligible.
   */
  eligible?: readonly PickerOption[]
  /** Search only while true, e.g. while the dialog showing the picker is open. Default true. */
  active?: boolean
  /** Replaces the generic "no results" sentence. */
  noMatch?: ReactNode
  debounceMs?: number
  maxLength?: number
  className?: string
}

type Settled = { query: string; version: string; result: PickerResult }

/**
 * Find-and-choose control: a query box over a native radio list, so keyboard, grouping and form
 * reset come from the browser. The query is only a filter; the submitted value is the checked
 * radio. The chosen option stays pinned and checked while the query changes. Rows are shown only
 * once their response matches the current query (and `eligible` set), so nothing from an earlier
 * query can be picked while a newer one is pending. Responses that arrive after a newer query, a
 * retry or an unmount are ignored.
 */
export function SearchPicker({
  name,
  legend,
  searchLabel,
  hint,
  error,
  required,
  search,
  eligible,
  active = true,
  noMatch,
  debounceMs = 250,
  maxLength = 100,
  className,
}: SearchPickerProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const statusId = `${id}-status`
  const root = useRef<HTMLFieldSetElement>(null)
  const queryBox = useRef<HTMLInputElement>(null)
  const latestSearch = useRef(search)
  useEffect(() => {
    latestSearch.current = search
  })
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<PickerOption | null>(null)
  const [settled, setSettled] = useState<Settled | null>(null)
  const [retry, setRetry] = useState(0)
  const version = eligible ? JSON.stringify(eligible.map((o) => [o.value, o.label])) : ''

  useEffect(() => {
    if (!active) return
    let stale = false
    const timer = setTimeout(
      () => {
        latestSearch.current(query.trim()).then(
          (result) => {
            if (stale) return
            setSettled({ query, version, result })
            // The right to search ended: the pinned choice was made under that right, so it goes too.
            if (result.status === 'denied') setChosen(null)
          },
          () => !stale && setSettled({ query, version, result: { status: 'error' } }),
        )
      },
      settled?.version === version ? debounceMs : 0,
    )
    return () => {
      stale = true
      clearTimeout(timer)
    }
    // `settled` only picks the first-load delay; including it would re-run every response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, query, retry, debounceMs, version])

  // form.reset() (success, access loss) must also clear what React state remembers.
  const resetAll = useCallback(() => {
    setChosen(null)
    setQuery('')
    setSettled(null)
    setRetry((n) => n + 1) // an already-empty query would not re-run the search by itself
  }, [])
  useEffect(() => {
    const form = root.current?.form
    form?.addEventListener('reset', resetAll)
    return () => form?.removeEventListener('reset', resetAll)
  }, [resetAll])

  // A person who left the authoritative set is no longer a valid choice (adjusting state while
  // rendering is React's pattern for this; the form's own command state is not touched).
  if (chosen && eligible && !eligible.some((o) => o.value === chosen.value)) setChosen(null)
  // Only a response for exactly this query and set may be shown or chosen from.
  const fresh = settled?.query === query && settled.version === version
  const result = fresh ? settled.result : undefined
  const loading = active && !fresh
  const allowed = eligible && new Set(eligible.map((o) => o.value))
  const found =
    result?.status === 'ok'
      ? allowed
        ? result.options.filter((o) => allowed.has(o.value))
        : result.options
      : []
  const shown = chosen ? [chosen, ...found.filter((o) => o.value !== chosen.value)] : found
  const labels = shown.map((o) => o.label)
  const sameNames = new Set(labels).size !== labels.length

  function onQueryKey(event: KeyboardEvent<HTMLInputElement>) {
    // Enter is a search gesture here, never the form's implicit submit.
    if (event.key === 'Enter') event.preventDefault()
    if (event.key === 'ArrowDown') {
      const first =
        root.current?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ??
        root.current?.querySelector<HTMLInputElement>('input[type="radio"]')
      if (first) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <fieldset
      ref={root}
      className={cn('flex min-w-0 flex-col gap-2', className)}
      aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 text-sm leading-none font-medium">
        {legend}
        {required && (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </legend>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor={`${id}-query`} className="sr-only">
          {searchLabel}
        </label>
        <Input
          id={`${id}-query`}
          ref={queryBox}
          type="search"
          value={query}
          maxLength={maxLength}
          autoComplete="off"
          aria-describedby={statusId}
          data-autofocus
          className="pr-9 pl-8"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onQueryKey}
        />
        {loading && (
          <Spinner className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>
      <p id={statusId} role="status" className="min-h-4 text-xs text-muted-foreground">
        {loading ? (
          <LocalizedText en="Searching…" vi="Đang tìm…" />
        ) : result?.status === 'ok' ? (
          <>
            {found.length}{' '}
            <LocalizedText en={found.length === 1 ? 'result' : 'results'} vi="kết quả" />
            {result.truncated && (
              <>
                {' · '}
                <LocalizedText
                  en="Showing the first matches only. Type more to narrow them."
                  vi="Chỉ hiển thị các kết quả đầu tiên. Nhập thêm để thu hẹp."
                />
              </>
            )}
          </>
        ) : null}
      </p>
      {result && result.status !== 'ok' && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-card p-3 text-sm">
          <p className="min-w-0 flex-1">
            {result.status === 'denied' ? (
              <LocalizedText
                en="You no longer have permission to search here. Reload the page to see your current access."
                vi="Bạn không còn quyền tìm kiếm ở đây. Tải lại trang để xem quyền hiện tại."
              />
            ) : result.status === 'invalid' ? (
              <LocalizedText
                en="This search text is not accepted. Shorten it or remove special characters."
                vi="Nội dung tìm kiếm này không được chấp nhận. Hãy rút ngắn hoặc bỏ ký tự đặc biệt."
              />
            ) : result.status === 'unavailable' ? (
              <LocalizedText
                en="Search is not available right now. It may be switched off, or your access may have changed."
                vi="Hiện chưa dùng được tìm kiếm. Có thể tính năng đang tắt hoặc quyền của bạn đã thay đổi."
              />
            ) : (
              <LocalizedText en="The search failed." vi="Tìm kiếm thất bại." />
            )}
          </p>
          {result.status !== 'denied' && result.status !== 'invalid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettled(null)
                setRetry((n) => n + 1)
              }}
            >
              <Search aria-hidden />
              <LocalizedText en="Retry" vi="Thử lại" />
            </Button>
          )}
        </div>
      )}
      {result?.status === 'ok' && found.length === 0 && !loading && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {noMatch ??
            (query.trim() ? (
              <LocalizedText en="No results match this search." vi="Không có kết quả khớp." />
            ) : (
              <LocalizedText en="Nothing to choose from." vi="Không có mục nào để chọn." />
            ))}
        </p>
      )}
      {shown.length > 0 && (
        <ul
          aria-busy={loading || undefined}
          className="max-h-56 divide-y overflow-y-auto rounded-md border bg-card"
        >
          {shown.map((option) => (
            <li key={option.value}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 px-3 py-2 text-sm has-[:checked]:bg-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-ring">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={chosen?.value === option.value}
                  required={required}
                  onChange={() => setChosen(option)}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 break-words">{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {sameNames && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText
            en="Some results share a name and cannot be told apart here."
            vi="Một số kết quả trùng tên và không thể phân biệt ở đây."
          />
        </p>
      )}
      {chosen && (
        <div className="flex items-center justify-between gap-2 text-sm" aria-live="polite">
          <span className="min-w-0 break-words">
            <LocalizedText en="Selected:" vi="Đã chọn:" /> <strong>{chosen.label}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setChosen(null)
              queryBox.current?.focus()
            }}
          >
            <X aria-hidden />
            <LocalizedText en="Clear" vi="Bỏ chọn" />
          </Button>
        </div>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
