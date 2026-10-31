'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Unlink } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IconDisclosure } from '@/components/molecules/icon-disclosure'
import { SearchPicker } from '@/components/molecules/search-picker'
import { IntentForm } from '@/components/organisms/intent-form'
import { withFrom } from '@/lib/mc/paths'

import { addDependencyAction, removeDependencyAction, searchWorkItemsAction } from '../actions'
import { EXECUTION_LABEL, GATE_LABEL, GATE_REASON } from '../labels'
import type { Detail } from '../schemas'

import { RejectionDetails } from './rejection-details'

type Edge = Detail['upstream'][number]

/**
 * Prerequisites (what blocks this record) and dependents (what this record blocks), each with its
 * gate and whether it is satisfied right now. Links carry the current page as their origin so
 * "Back" returns here, not to wherever the other record was first opened.
 */
export function DependencyPanel({
  matterId,
  detail,
  here,
  canEdit,
  titles,
}: {
  matterId: string
  detail: Detail
  here: string
  canEdit: boolean
  titles: Record<string, string>
}) {
  const it = detail.item
  const open = (id: string) => withFrom(`/matters/${matterId}/work/${id}`, here)
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="up-h" className="flex flex-col gap-2">
        <h3 id="up-h" className="font-medium">
          Prerequisites ({detail.upstream.length})
        </h3>
        {detail.upstream.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="Nothing blocks this record: it has no prerequisites."
              vi="Không có điều kiện tiên quyết nên bản ghi này không bị chặn."
            />
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {detail.upstream.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 p-3">
                <EdgeLine edge={e} href={open(e.other.id)} />
                {canEdit && (
                  <RemoveForm
                    matterId={matterId}
                    targetId={it.id}
                    edgeId={e.id}
                    etag={detail.etag}
                    titles={titles}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="down-h" className="flex flex-col gap-2">
        <h3 id="down-h" className="font-medium">
          Blocks ({detail.downstream.length})
        </h3>
        {detail.downstream.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              en="No other record depends on this one."
              vi="Không có bản ghi khác phụ thuộc vào bản ghi này."
            />
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {detail.downstream.map((e) => (
              <li key={e.id} className="p-3">
                <EdgeLine edge={e} href={open(e.other.id)} downstream />
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && (
        <IntentForm
          receipted={false}
          draftKey={`item:${it.id}:add-dependency`}
          submitLabel={<LocalizedText en="Add prerequisite" vi="Thêm điều kiện tiên quyết" />}
          renderRejection={(r) => <RejectionDetails rejection={r} titles={titles} />}
          run={(v) =>
            addDependencyAction({
              matterId,
              targetId: it.id,
              ifMatch: detail.etag,
              sourceId: v.sourceId ?? '',
              gate: v.gate ?? 'COMPLETION',
              reason: v.reason ?? '',
            })
          }
        >
          {({ errors }) => (
            <>
              <SearchPicker
                name="sourceId"
                legend={<LocalizedText en="Must be satisfied first" vi="Phải được đáp ứng trước" />}
                searchLabel={
                  <LocalizedText
                    en="Search this matter’s records by title"
                    vi="Tìm bản ghi của hồ sơ theo tiêu đề"
                  />
                }
                required
                search={(query) => searchWorkItemsAction({ matterId, query, excludeId: it.id })}
                noMatch={
                  <LocalizedText
                    en="No record you can read matches. Check the title, or add the record first."
                    vi="Không có bản ghi nào bạn xem được khớp. Kiểm tra tiêu đề hoặc thêm bản ghi trước."
                  />
                }
                hint={
                  <LocalizedText
                    en="Every record you can read is searchable, not only the first page."
                    vi="Tìm được mọi bản ghi bạn xem được, không chỉ trang đầu."
                  />
                }
                error={errors.sourceId?.[0]}
              />
              <FormField
                label={<LocalizedText en="Gate" vi="Điều kiện" />}
                hint={
                  <LocalizedText
                    en="Completion: the prerequisite must be completed. Proof: it must also be verified."
                    vi="Hoàn tất: điều kiện tiên quyết phải hoàn thành. Bằng chứng: còn phải được xác minh."
                  />
                }
              >
                {(c) => (
                  <Select
                    name="gate"
                    defaultValue="COMPLETION"
                    options={[
                      { value: 'COMPLETION', label: GATE_LABEL.COMPLETION! },
                      { value: 'PROOF', label: GATE_LABEL.PROOF! },
                    ]}
                    {...c}
                  />
                )}
              </FormField>
              <FormField
                label={<LocalizedText en="Reason" vi="Lý do" />}
                required
                error={errors.reason?.[0]}
              >
                {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
              </FormField>
            </>
          )}
        </IntentForm>
      )}
    </div>
  )
}

function EdgeLine({
  edge,
  href,
  downstream = false,
}: {
  edge: Edge
  href: string
  downstream?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Link href={href} className="font-medium underline">
        {edge.other.title}
      </Link>
      <Badge variant="outline">
        {edge.other.kind === 'REQUIREMENT' ? 'Requirement' : 'Action'}
      </Badge>
      <Badge variant="neutral">
        {EXECUTION_LABEL[edge.other.execution] ?? edge.other.execution}
      </Badge>
      <Badge variant="outline">{GATE_LABEL[edge.gate] ?? edge.gate}</Badge>
      {edge.satisfied ? (
        <Badge variant="success">
          <LocalizedText en="Satisfied" vi="Đã đáp ứng" />
        </Badge>
      ) : (
        <Badge variant="destructive">
          <LocalizedText en="Not satisfied" vi="Chưa đáp ứng" />
          {edge.reason ? `: ${GATE_REASON[edge.reason] ?? edge.reason}` : ''}
        </Badge>
      )}
      {downstream && <span className="text-muted-foreground">depends on this record</span>}
    </div>
  )
}

function RemoveForm({
  matterId,
  targetId,
  edgeId,
  etag,
  titles,
}: {
  matterId: string
  targetId: string
  edgeId: string
  etag: string
  titles: Record<string, string>
}) {
  return (
    <IconDisclosure
      icon={<Unlink />}
      label={{ en: 'Remove this prerequisite…', vi: 'Gỡ điều kiện tiên quyết…' }}
    >
      <div>
        <IntentForm
          receipted={false}
          draftKey={`item:${targetId}:remove:${edgeId}`}
          submitLabel={<LocalizedText en="Remove prerequisite" vi="Gỡ điều kiện tiên quyết" />}
          renderRejection={(r) => <RejectionDetails rejection={r} titles={titles} />}
          run={(v) =>
            removeDependencyAction({
              matterId,
              targetId,
              edgeId,
              ifMatch: etag,
              reason: v.reason ?? '',
            })
          }
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Scope-change reason" vi="Lý do đổi phạm vi" />}
              required
              hint={
                <LocalizedText
                  en="Removing a prerequisite is an audited scope change. It never marks anything as satisfied."
                  vi="Gỡ điều kiện tiên quyết là thay đổi phạm vi có lưu vết; không tự đánh dấu đã đáp ứng."
                />
              }
              error={errors.reason?.[0]}
            >
              {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
            </FormField>
          )}
        </IntentForm>
      </div>
    </IconDisclosure>
  )
}
