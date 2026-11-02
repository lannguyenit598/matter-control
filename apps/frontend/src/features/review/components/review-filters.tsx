import Link from 'next/link'
import { Search } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

import { CELL_LABELS, type MatrixFilter } from '../matrix'

import { LABEL_TEXT, reviewHref } from './review-matrix'

/** Filters are plain links plus one GET form, so the URL is the whole state and a reload keeps it. */
export function ReviewFilters({
  matterId,
  gridId,
  filter,
}: {
  matterId: string
  gridId: string
  filter: MatrixFilter
}) {
  const chip = (active: boolean) =>
    cn(
      'control-target inline-flex items-center rounded-full border px-3 text-sm',
      active ? 'border-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:bg-accent',
    )
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Cell state" className="flex flex-wrap gap-2">
        <Link
          href={reviewHref(matterId, gridId, { ...filter, state: undefined })}
          aria-current={!filter.state ? 'true' : undefined}
          className={chip(!filter.state)}
        >
          <LocalizedText en="All cells" vi="Mọi ô" />
        </Link>
        {CELL_LABELS.map((s) => (
          <Link
            key={s}
            href={reviewHref(matterId, gridId, { ...filter, state: s })}
            aria-current={filter.state === s ? 'true' : undefined}
            className={chip(filter.state === s)}
          >
            <LocalizedText en={LABEL_TEXT[s].en} vi={LABEL_TEXT[s].vi} />
          </Link>
        ))}
      </nav>
      <form method="get" role="search" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="grid" value={gridId} />
        {filter.state && <input type="hidden" name="state" value={filter.state} />}
        <label className="sr-only" htmlFor="review-q">
          <LocalizedText
            en="Search answers, questions and documents"
            vi="Tìm câu trả lời, câu hỏi và tài liệu"
          />
        </label>
        <Input
          id="review-q"
          name="q"
          type="search"
          maxLength={100}
          defaultValue={filter.q ?? ''}
          className="flex-1"
        />
        <Button type="submit" variant="outline">
          <Search aria-hidden />
          <LocalizedText en="Search" vi="Tìm" />
        </Button>
      </form>
    </div>
  )
}
