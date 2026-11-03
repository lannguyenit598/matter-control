'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { EmptyState } from '@/components/molecules/empty-state'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { IntentForm } from '@/components/organisms/intent-form'

import { convertIntakeAction, createIntakeAction, declineIntakeAction } from '../actions'
import type { IntakeRecord } from '../schemas'

const STATUS_LABEL: Record<IntakeRecord['status'], { en: string; vi: string }> = {
  PENDING: { en: 'Pending', vi: 'Đang chờ' },
  CONVERTED: { en: 'Converted to work', vi: 'Đã chuyển thành công việc' },
  DECLINED: { en: 'Declined', vi: 'Đã từ chối' },
}

/**
 * Matter intake (RLF-06): record the original request with its attributable requester, decline
 * it with an accountable reason, or convert it into one real Requirement or Action. Conversion
 * is receipted and atomic; it never executes or verifies the work it creates.
 */
export function IntakePanel({
  matterId,
  records,
  members,
  canTriage,
}: {
  matterId: string
  records: IntakeRecord[]
  members: { value: string; label: string }[]
  canTriage: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <EmptyState
          title={<LocalizedText en="No intake recorded" vi="Chưa ghi nhận yêu cầu nào" />}
          description={
            <LocalizedText
              en="Requests that arrived for this Matter are recorded here with their original text and requester, then converted into work or declined with a reason."
              vi="Các yêu cầu gửi tới hồ sơ này được ghi tại đây với nội dung và người gửi gốc, sau đó được chuyển thành công việc hoặc từ chối kèm lý do."
            />
          }
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {records.map((r) => (
            <IntakeRow
              key={r.id}
              matterId={matterId}
              record={r}
              members={members}
              canTriage={canTriage}
            />
          ))}
        </ul>
      )}
      {canTriage && (
        <section
          aria-label="Record an intake"
          className="flex flex-col gap-3 rounded-lg border bg-card p-3"
        >
          <h3 className="text-sm font-semibold">
            <LocalizedText en="Record a request" vi="Ghi nhận yêu cầu" />
          </h3>
          <IntentForm
            receipted
            draftKey={`intake:${matterId}:new`}
            submitLabel={<LocalizedText en="Record intake" vi="Ghi nhận yêu cầu" />}
            run={(v, key) =>
              createIntakeAction({
                matterId,
                idempotencyKey: key,
                title: v.title ?? '',
                requestText: v.requestText ?? '',
                requester: v.requester ?? '',
              })
            }
          >
            {({ errors }) => (
              <>
                <FormField
                  label={<LocalizedText en="Title" vi="Tiêu đề" />}
                  required
                  error={errors.title?.[0]}
                >
                  {(c) => <Input name="title" maxLength={300} autoComplete="off" {...c} />}
                </FormField>
                <FormField
                  label={<LocalizedText en="The request as it arrived" vi="Nội dung yêu cầu gốc" />}
                  error={errors.requestText?.[0]}
                >
                  {(c) => <Textarea name="requestText" rows={3} maxLength={10000} {...c} />}
                </FormField>
                <FormField
                  label={
                    <LocalizedText
                      en="Who asked (not a member)"
                      vi="Ai đã yêu cầu (không phải thành viên)"
                    />
                  }
                  error={errors.requester?.[0]}
                >
                  {(c) => <Input name="requester" maxLength={200} autoComplete="off" {...c} />}
                </FormField>
              </>
            )}
          </IntentForm>
        </section>
      )}
    </div>
  )
}

function IntakeRow({
  matterId,
  record,
  members,
  canTriage,
}: {
  matterId: string
  record: IntakeRecord
  members: { value: string; label: string }[]
  canTriage: boolean
}) {
  const [declining, setDeclining] = useState(false)
  const [converting, setConverting] = useState(false)
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium break-words">{record.title}</span>
        <Badge variant="outline">
          <LocalizedText en={STATUS_LABEL[record.status].en} vi={STATUS_LABEL[record.status].vi} />
        </Badge>
      </div>
      {record.requestText && (
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
          {record.requestText}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {record.requester && <span>{record.requester} · </span>}
        <LocalizedText en="Received" vi="Nhận lúc" /> <LocalizedInstant iso={record.receivedAt} />
        {record.triageReason && (
          <>
            {' · '}
            <LocalizedText en="Reason" vi="Lý do" />: {record.triageReason}
          </>
        )}
      </p>
      {record.itemId && (
        <Link className="text-sm underline" href={`/matters/${matterId}/work/${record.itemId}`}>
          <LocalizedText en="Open the created work" vi="Mở công việc đã tạo" />
        </Link>
      )}
      {canTriage && record.status === 'PENDING' && !declining && !converting && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="control-target rounded-md border px-2 py-1 text-sm hover:bg-accent"
            onClick={() => setConverting(true)}
          >
            <LocalizedText en="Convert to work" vi="Chuyển thành công việc" />
          </button>
          <button
            type="button"
            className="control-target rounded-md border px-2 py-1 text-sm hover:bg-accent"
            onClick={() => setDeclining(true)}
          >
            <LocalizedText en="Decline with a reason" vi="Từ chối kèm lý do" />
          </button>
        </div>
      )}
      {declining && (
        <IntentForm
          receipted={false}
          draftKey={`intake:${record.id}:decline`}
          submitLabel={<LocalizedText en="Decline" vi="Từ chối" />}
          run={(v) =>
            declineIntakeAction({
              matterId,
              intakeId: record.id,
              ifMatch: record.etag,
              reason: v.reason ?? '',
            })
          }
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="Why is this declined?" vi="Vì sao từ chối?" />}
              required
              error={errors.reason?.[0]}
            >
              {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
            </FormField>
          )}
        </IntentForm>
      )}
      {converting && (
        <IntentForm
          receipted
          draftKey={`intake:${record.id}:convert`}
          submitLabel={<LocalizedText en="Create the work" vi="Tạo công việc" />}
          run={(v, key) =>
            convertIntakeAction({
              matterId,
              intakeId: record.id,
              idempotencyKey: key,
              kind: (v.kind ?? 'ACTION') as 'REQUIREMENT' | 'ACTION',
              title: v.title ?? record.title,
              outcome: v.outcome ?? '',
              owner: v.owner ?? '',
            })
          }
        >
          {({ errors }) => (
            <>
              <FormField label={<LocalizedText en="Create as" vi="Tạo dưới dạng" />} required>
                {(c) => (
                  <Select
                    name="kind"
                    defaultValue="ACTION"
                    options={[
                      { value: 'ACTION', label: 'Action' },
                      { value: 'REQUIREMENT', label: 'Requirement' },
                    ]}
                    {...c}
                  />
                )}
              </FormField>
              <FormField
                label={<LocalizedText en="Title" vi="Tiêu đề" />}
                required
                error={errors.title?.[0]}
              >
                {(c) => (
                  <Input
                    name="title"
                    maxLength={300}
                    autoComplete="off"
                    defaultValue={record.title}
                    {...c}
                  />
                )}
              </FormField>
              <FormField
                label={<LocalizedText en="Outcome to reach" vi="Kết quả cần đạt" />}
                required
                error={errors.outcome?.[0]}
              >
                {(c) => <Input name="outcome" maxLength={5000} autoComplete="off" {...c} />}
              </FormField>
              <FormField
                label={<LocalizedText en="Owner (optional)" vi="Người phụ trách (tùy chọn)" />}
              >
                {(c) => (
                  <Select
                    name="owner"
                    placeholder="Choose"
                    options={[{ value: '', label: '—' }, ...members]}
                    {...c}
                  />
                )}
              </FormField>
            </>
          )}
        </IntentForm>
      )}
    </li>
  )
}
