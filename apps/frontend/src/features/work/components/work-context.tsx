import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { LocalizedText } from '@/components/molecules/localized-text'
import { LIST_CLASS } from '@/components/molecules/list-section'

import { GATE_LABEL, GATE_REASON } from '../labels'
import type { WorkItem } from '../schemas'

/** One criterion row the page computed from the authorized proof checklist. */
export type ContextCriterion = {
  id: string
  title: string
  purpose: 'PACKAGE' | 'SIGNATURE' | 'OUTCOME'
  mandatory: boolean
  satisfied: boolean
  /** The server's reason, already worded by the proof labels. */
  reasonLabel?: string
}

/** One exact source the page computed from the evidence basis. */
export type ContextReliedOn = { exact: string; criterion: string }

const PURPOSE: Record<ContextCriterion['purpose'], { en: string; vi: string }> = {
  PACKAGE: { en: 'Package readiness', vi: 'Sự sẵn sàng của bộ hồ sơ' },
  SIGNATURE: { en: 'Signature', vi: 'Chữ ký' },
  OUTCOME: { en: 'Authority outcome', vi: 'Kết quả từ cơ quan' },
}

/**
 * One read-only context composition (RLF-02): the outcome the record must reach, the proof
 * criteria that decide it, the exact recorded versions currently counted, and the upstream
 * reasons it cannot proceed. The page computes everything from records it already authorized;
 * this component renders and owns no read, no edit affordance and no re-derived judgement.
 */
export function WorkContext({
  item,
  criteria,
  reliedOn,
  titles,
  linkToItem,
}: {
  item: WorkItem
  /** Null means the proof read itself failed: the section says so instead of asserting absence. */
  criteria: ContextCriterion[] | null
  reliedOn: ContextReliedOn[]
  /** The authorized titles of this matter's records, for the blocker links. */
  titles: Record<string, string>
  linkToItem: (id: string) => string
}) {
  return (
    <section aria-labelledby="work-context-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="work-context-title" className="text-lg font-semibold">
          <LocalizedText en="Context" vi="Ngữ cảnh" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="What this record is for, what must be true, what is currently counted, and what holds it — read-only; the panels below keep the interactive controls."
            vi="Bản ghi này dùng để làm gì, điều kiện gì phải đạt, điều gì đang được tính và điều gì đang giữ nó — chỉ đọc; các phần bên dưới giữ quyền tương tác."
          />
        </p>
      </div>

      <section aria-labelledby="context-outcome" className="flex flex-col gap-1">
        <h3 id="context-outcome" className="text-sm font-medium text-muted-foreground">
          <LocalizedText en="Outcome to reach" vi="Kết quả cần đạt" />
        </h3>
        {item.outcome ? (
          <p className="text-sm break-words whitespace-pre-wrap">{item.outcome}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Nothing recorded yet — add it under “Edit details”."
              vi="Chưa ghi nhận nội dung — bổ sung trong phần “Sửa chi tiết”."
            />
          </p>
        )}
      </section>

      <section aria-labelledby="context-criteria" className="flex flex-col gap-2">
        <h3 id="context-criteria" className="text-sm font-medium text-muted-foreground">
          <LocalizedText en="What must be true" vi="Điều kiện cần đạt" />
        </h3>
        {criteria === null ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="The proof criteria could not be read right now. Open the Proof panel below or retry."
              vi="Không đọc được tiêu chí bằng chứng lúc này. Mở bảng Bằng chứng bên dưới hoặc thử lại."
            />
          </p>
        ) : criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="No proof criteria are declared. Nothing is counted as verified until one is."
              vi="Chưa khai báo tiêu chí bằng chứng. Không có gì được tính là đã xác minh trước khi có tiêu chí."
            />
          </p>
        ) : (
          <ul className={LIST_CLASS}>
            {criteria.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-medium break-words">{c.title}</span>
                  <Badge variant="outline">
                    <LocalizedText en={PURPOSE[c.purpose].en} vi={PURPOSE[c.purpose].vi} />
                  </Badge>
                  {c.mandatory && (
                    <Badge variant="outline">
                      <LocalizedText en="Mandatory" vi="Bắt buộc" />
                    </Badge>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {c.satisfied ? (
                    <LocalizedText en="Satisfied" vi="Đã đạt" />
                  ) : (
                    (c.reasonLabel ?? <LocalizedText en="Not satisfied" vi="Chưa đạt" />)
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reliedOn.length > 0 && (
        <section aria-labelledby="context-evidence" className="flex flex-col gap-2">
          <h3 id="context-evidence" className="text-sm font-medium text-muted-foreground">
            <LocalizedText
              en="Evidence relied on (exact versions)"
              vi="Bằng chứng đang được tính (phiên bản chính xác)"
            />
          </h3>
          <ul className={LIST_CLASS}>
            {reliedOn.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span className="text-sm break-words">{r.exact}</span>
                <span className="text-sm break-words text-muted-foreground">{r.criterion}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            <LocalizedText
              en="The exact recorded versions a verifier accepted. Promoting a newer version never silently replaces them; each claim's basis is under Evidence basis."
              vi="Các phiên bản đã ghi nhận chính xác mà người xác minh đã chấp nhận. Thăng cấp phiên bản mới hơn không tự động thay thế chúng; cơ sở từng tuyên bố nằm trong phần Cơ sở bằng chứng."
            />
          </p>
        </section>
      )}

      {item.dependencyReasons.length > 0 && (
        <section aria-labelledby="context-blocked" className="flex flex-col gap-2">
          <h3 id="context-blocked" className="text-sm font-medium text-muted-foreground">
            <LocalizedText en="Why it cannot proceed yet" vi="Vì sao chưa thể tiếp tục" />
          </h3>
          <ul className={LIST_CLASS}>
            {item.dependencyReasons.map((r) => (
              <li
                key={r.edgeId}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
              >
                <span className="text-sm">
                  {titles[r.sourceId] ? (
                    <Link href={linkToItem(r.sourceId)} className="font-medium underline">
                      {titles[r.sourceId]}
                    </Link>
                  ) : (
                    <LocalizedText
                      en="A prerequisite of this record"
                      vi="Một điều kiện tiên quyết của bản ghi này"
                    />
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {GATE_LABEL[r.gate] ?? r.gate} — {GATE_REASON[r.code] ?? r.code}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            <LocalizedText
              en="Prerequisites are managed under “Prerequisites and dependents”."
              vi="Điều kiện tiên quyết được quản lý trong phần “Điều kiện tiên quyết và công việc phụ thuộc”."
            />
          </p>
        </section>
      )}
    </section>
  )
}
