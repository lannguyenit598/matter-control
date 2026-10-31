'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition, type FormEvent } from 'react'

import { Button, buttonVariants } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { LocalizedText } from '@/components/molecules/localized-text'

/** The URL a search lands on: the query is the only state, so Back/Forward and sharing just work. */
export function searchHref(raw: string): string {
  const q = raw.trim().slice(0, 100)
  return q ? `/matters?q=${encodeURIComponent(q)}` : '/matters'
}

/**
 * Matter search as client-side navigation. It stays a real GET form (so it still works before
 * scripts load), but a submit pushes the new URL through the router instead of reloading the
 * document: the page re-renders on the server, the history gets one entry per search, and the box
 * follows the URL on Back/Forward because it is re-keyed by the query. It never submits any
 * surrounding form.
 */
export function MatterSearch({ query }: { query: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    const href = searchHref(typeof value === 'string' ? value : '')
    start(() => router.push(href, { scroll: false }))
  }

  return (
    <form
      key={query}
      action="/matters"
      method="get"
      role="search"
      onSubmit={onSubmit}
      aria-busy={pending || undefined}
      className="flex flex-wrap gap-2"
    >
      <label htmlFor="matter-search" className="sr-only">
        <LocalizedText en="Search matters by name" vi="Tìm hồ sơ theo tên" />
      </label>
      <div className="relative min-w-0 flex-1 basis-64">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="matter-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={100}
          autoComplete="off"
          className="pl-8"
          placeholder="Search matters by name"
        />
      </div>
      <Button type="submit" loading={pending}>
        {!pending && <Search aria-hidden />}
        <LocalizedText en="Search" vi="Tìm" />
      </Button>
      {query && (
        <Link href="/matters" className={buttonVariants({ variant: 'ghost' })}>
          <LocalizedText en="Clear" vi="Xóa" />
        </Link>
      )}
    </form>
  )
}
