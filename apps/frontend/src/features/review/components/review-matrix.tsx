import Link from 'next/link'

import { LocalizedText } from '@/components/molecules/localized-text'
import { cn } from '@/lib/utils'

import {
  cellLabel,
  filterCells,
  visibleVersionIds,
  type CellLabel,
  type MatrixFilter,
} from '../matrix'
import type { ReviewGridView } from '../schemas'

export const LABEL_TEXT: Record<CellLabel, { en: string; vi: string }> = {
  PENDING: { en: 'Pending', vi: 'Chờ' },
  REVIEWED: { en: 'Reviewed', vi: 'Đã rà soát' },
  ABSENT: { en: 'Absent', vi: 'Không có' },
  UNABLE: { en: 'Unable', vi: 'Không thể' },
  STALE: { en: 'Stale', vi: 'Lỗi thời' },
}

/** Where a cell link goes: the selection and the filters live in the URL. */
export function reviewHref(
  matterId: string,
  gridId: string,
  filter: MatrixFilter,
  cell?: { versionId: string; questionId: string },
): string {
  const qs = new URLSearchParams({ grid: gridId })
  if (cell) qs.set('cell', `${cell.versionId}:${cell.questionId}`)
  if (filter.state) qs.set('state', filter.state)
  if (filter.q) qs.set('q', filter.q)
  return `/matters/${encodeURIComponent(matterId)}/reviews?${qs}`
}

/**
 * The grid: exact document versions as rows, versioned questions as columns. Each cell is a link
 * (keyboard reachable) that says its state in words, never only in colour. Wide grids scroll inside
 * their own container, never the page.
 */
export function ReviewMatrix({
  matterId,
  view,
  filter,
  selected,
}: {
  matterId: string
  view: ReviewGridView
  filter: MatrixFilter
  selected: { versionId: string; questionId: string } | null
}) {
  const rows = new Set(visibleVersionIds(view, filter))
  const matching = new Set(filterCells(view, filter).map((c) => `${c.versionId}:${c.questionId}`))
  const byCell = new Map(view.cells.map((c) => [`${c.versionId}:${c.questionId}`, c]))
  if (view.versions.length === 0 || view.questions.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <LocalizedText
          en="Add at least one document version and one question to start reviewing."
          vi="Thêm ít nhất một phiên bản tài liệu và một câu hỏi để bắt đầu rà soát."
        />
      </p>
    )
  }
  if (rows.size === 0) {
    return (
      <p role="status" className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <LocalizedText en="No cell matches these filters." vi="Không ô nào khớp bộ lọc này." />
      </p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">{view.name}</caption>
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th scope="col" className="p-3 font-medium">
              <LocalizedText en="Document version" vi="Phiên bản tài liệu" />
            </th>
            {view.questions.map((q) => (
              <th key={q.id} scope="col" className="max-w-64 p-3 align-top font-medium">
                <span className="break-words">{q.text}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  <LocalizedText en="wording" vi="lời" /> {q.revision}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.versions
            .filter((v) => rows.has(v.versionId))
            .map((v) => (
              <tr key={v.versionId} className="border-b last:border-b-0">
                <th scope="row" className="max-w-64 p-3 text-left align-top font-medium">
                  <span className="break-words">{v.documentName}</span>
                  <span className="block text-xs font-normal break-words text-muted-foreground">
                    v{v.no} · {v.filename}
                    {!v.current && (
                      <>
                        {' · '}
                        <LocalizedText
                          en="not the current version"
                          vi="không phải phiên bản hiện hành"
                        />
                      </>
                    )}
                  </span>
                </th>
                {view.questions.map((q) => {
                  const key = `${v.versionId}:${q.id}`
                  const cell = byCell.get(key)
                  const label = cell ? cellLabel(cell) : 'PENDING'
                  const isSelected =
                    selected?.versionId === v.versionId && selected.questionId === q.id
                  const dim = (filter.state || filter.q) && !matching.has(key)
                  return (
                    <td key={q.id} className="p-1 align-top">
                      <Link
                        href={reviewHref(matterId, view.id, filter, {
                          versionId: v.versionId,
                          questionId: q.id,
                        })}
                        aria-current={isSelected ? 'true' : undefined}
                        className={cn(
                          'control-target flex min-w-28 flex-col rounded-md border border-transparent px-2 py-1.5 hover:bg-accent',
                          isSelected && 'border-primary bg-selected',
                          dim && 'opacity-40',
                          label === 'STALE' && 'text-timing',
                        )}
                      >
                        <span className="font-medium">
                          <LocalizedText en={LABEL_TEXT[label].en} vi={LABEL_TEXT[label].vi} />
                        </span>
                        {cell?.answer && (
                          <span className="line-clamp-2 text-xs break-words text-muted-foreground">
                            {cell.answer.text || '—'}
                          </span>
                        )}
                      </Link>
                    </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
