import { ArrowRight, Table2 } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/molecules/empty-state'
import { LIST_CLASS, ListSection, ROW_CLASS } from '@/components/molecules/list-section'
import { LocalizedText } from '@/components/molecules/localized-text'

import type { ReviewGrid } from '../schemas'

/** `action` is the section's one primary action (the create dialog), shown only to people who may use it. */
export function ReviewGridList({
  matterId,
  items,
  action,
}: {
  matterId: string
  items: ReviewGrid[]
  action?: ReactNode
}) {
  return (
    <ListSection
      title={<LocalizedText en="Review grids" vi="Bảng rà soát" />}
      count={items.length > 0 ? items.length : undefined}
      description={
        <LocalizedText
          en="Manual reviews of exact document versions. An answer here is a person's recorded conclusion: it never verifies a requirement or completes work."
          vi="Rà soát thủ công trên các phiên bản tài liệu cụ thể. Câu trả lời ở đây là kết luận do người ghi nhận: nó không xác minh yêu cầu hay hoàn tất công việc."
        />
      }
      action={action}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<Table2 />}
          title={<LocalizedText en="No review grid yet" vi="Chưa có bảng rà soát" />}
          description={
            <LocalizedText
              en="Create a grid to compare document versions against the same questions."
              vi="Tạo bảng để so sánh các phiên bản tài liệu với cùng một bộ câu hỏi."
            />
          }
        />
      ) : (
        <ul className={LIST_CLASS}>
          {items.map((g) => (
            <li key={g.id}>
              <Link
                href={`/matters/${matterId}/reviews?grid=${encodeURIComponent(g.id)}`}
                className={`${ROW_CLASS} group transition-colors hover:bg-muted/60`}
              >
                <span className="min-w-0 font-medium break-words">{g.name}</span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {g.versionCount} <LocalizedText en="versions" vi="phiên bản" />
                  </span>
                  <span>
                    {g.questionCount} <LocalizedText en="questions" vi="câu hỏi" />
                  </span>
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListSection>
  )
}
