'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'

import {
  advanceFilingAction,
  correctObservationAction,
  createFilingAction,
  filingOwnerStepAction,
  recordNegativeAction,
  setSignatureApplicabilityAction,
} from '../actions'
import { STAGE_LABEL, toInstant } from '../labels'
import type { FilingDetail, FilingStage } from '../schemas'

type Option = { id: string; label: string }

export function CreateFilingForm({
  matterId,
  requirements,
  parties,
  members,
}: {
  matterId: string
  requirements: Option[]
  parties: Option[]
  members: Option[]
}) {
  const router = useRouter()
  if (!requirements.length || !parties.length)
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p>
          <LocalizedText
            en="A filing needs a Requirement to serve and an external authority. Add the missing details first, then return here."
            vi="Thủ tục cần gắn với một Yêu cầu và cơ quan phụ trách. Thêm thông tin còn thiếu rồi quay lại đây."
          />
        </p>
        {!requirements.length && (
          <Link className="control-target w-fit underline" href={`/matters/${matterId}/work`}>
            <LocalizedText
              en="Open Work, then choose Add work and Requirement"
              vi="Mở Công việc, rồi chọn Thêm công việc và Yêu cầu"
            />
          </Link>
        )}
        {!parties.length && (
          <Link className="control-target w-fit underline" href={`/matters/${matterId}/planning`}>
            <LocalizedText
              en="Add an authority under Planning"
              vi="Thêm cơ quan phụ trách trong Kế hoạch"
            />
          </Link>
        )}
      </div>
    )
  return (
    <IntentForm
      receipted
      draftKey={`matter:${matterId}:new-filing`}
      onSuccess={(r) => r.id && router.push(`/matters/${matterId}/filings/${r.id}`)}
      submitLabel={<LocalizedText en="Create filing" vi="Tạo thủ tục" />}
      run={(v, key) =>
        createFilingAction({
          matterId,
          idempotencyKey: key,
          title: v.title ?? '',
          outcome: v.outcome ?? '',
          requirementId: v.requirementId ?? '',
          authorityPartyId: v.authorityPartyId ?? '',
          ownerId: v.ownerId ?? '',
          proofRequired: v.proofRequired ?? 'yes',
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
            {(c) => <Input name="title" maxLength={200} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Outcome sought" vi="Kết quả mong muốn" />}
            required
            error={errors.outcome?.[0]}
          >
            {(c) => <Textarea name="outcome" rows={2} maxLength={2000} {...c} />}
          </FormField>
          <FormField
            label={
              <LocalizedText
                en="Requirement this filing serves"
                vi="Yêu cầu mà thủ tục này phục vụ"
              />
            }
            required
            hint={
              <LocalizedText
                en="Approval never completes or verifies the Requirement by itself."
                vi="Phê duyệt thủ tục không tự động hoàn tất hoặc xác minh yêu cầu."
              />
            }
            error={errors.requirementId?.[0]}
          >
            {(c) => (
              <Select
                name="requirementId"
                placeholder="Choose a Requirement"
                options={requirements.map((r) => ({ value: r.id, label: r.label }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Authority" vi="Cơ quan phụ trách" />}
            required
            hint={
              <LocalizedText
                en="An external party of this matter. Create it under Planning if it is missing."
                vi="Một bên ngoài của hồ sơ. Thêm trong Kế hoạch nếu chưa có."
              />
            }
            error={errors.authorityPartyId?.[0]}
          >
            {(c) => (
              <Select
                name="authorityPartyId"
                placeholder="Choose the authority"
                options={parties.map((p) => ({ value: p.id, label: p.label }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Owner" vi="Người phụ trách" />}
            hint={
              <LocalizedText
                en="Required before package preparation starts."
                vi="Cần xác định trước khi bắt đầu chuẩn bị bộ hồ sơ."
              />
            }
          >
            {(c) => (
              <Select
                name="ownerId"
                placeholder="Unassigned"
                options={members.map((p) => ({ value: p.id, label: p.label }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Is proof required?" vi="Có cần bằng chứng không?" />}
          >
            {(c) => (
              <Select
                name="proofRequired"
                defaultValue="yes"
                options={[
                  {
                    value: 'yes',
                    label: (
                      <LocalizedText
                        en="Yes: package criteria must be verified"
                        vi="Có: tiêu chí bộ hồ sơ phải được xác minh"
                      />
                    ),
                  },
                  {
                    value: 'no',
                    label: (
                      <LocalizedText
                        en="No: only the authority’s outcome evidence is needed"
                        vi="Không: chỉ cần bằng chứng kết quả của cơ quan"
                      />
                    ),
                  },
                ]}
                {...c}
              />
            )}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}

function Checks({ name, legend, options }: { name: string; legend: string; options: Option[] }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">{legend}</legend>
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText en="None available yet." vi="Chưa có mục phù hợp." />
        </p>
      )}
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={name} value={o.id} className="size-4" />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}

/**
 * The next stage, with exactly the facts that stage needs. The API decides whether the guards hold
 * and answers a refusal with the reason; nothing here pre-judges it.
 */
export function AdvanceForm({
  matterId,
  detail,
  versions,
  evidence,
  members,
}: {
  matterId: string
  detail: FilingDetail
  versions: Option[]
  evidence: Option[]
  members: Option[]
}) {
  const [to, setTo] = useState<FilingStage>(detail.next[0]!)
  if (detail.next.length === 0) return null
  const submits = to === 'SUBMISSION' || to === 'RESPONSE'
  return (
    <IntentForm
      receipted={false}
      draftKey={`filing:${detail.item.id}:advance`}
      submitLabel={`Record ${STAGE_LABEL[to].toLowerCase()}`}
      run={(v) =>
        advanceFilingAction({
          matterId,
          filingId: detail.item.id,
          ifMatch: detail.etag,
          to,
          reference: v.reference ?? '',
          observedAt: toInstant(v.observedAt),
          evidenceIds: v.evidenceIds ?? '',
          versionIds: v.versionIds ?? '',
          externalRefs: v.externalRefs ?? '',
          requestRef: v.requestRef ?? '',
          cycleOwnerId: v.cycleOwnerId ?? '',
          cycleDue: toInstant(v.cycleDue),
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Move to" vi="Chuyển sang" />}
            required
            error={errors.to?.[0]}
          >
            {(c) => (
              <Select
                name="to"
                value={to}
                onChange={(e) => setTo(e.target.value as FilingStage)}
                options={detail.next.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
                {...c}
              />
            )}
          </FormField>
          {(submits || to === 'RECEIPT' || to === 'APPROVAL') && (
            <FormField
              label={submits ? 'Submission reference' : 'Reference'}
              required={submits}
              error={errors.reference?.[0]}
            >
              {(c) => <Input name="reference" maxLength={500} autoComplete="off" {...c} />}
            </FormField>
          )}
          {(submits || to === 'RECEIPT' || to === 'APPROVAL' || to === 'SUPPLEMENT') && (
            <FormField
              label={<LocalizedText en="When this happened" vi="Thời điểm xảy ra" />}
              hint={
                <LocalizedText
                  en="Your local time. Empty means now. It cannot be in the future."
                  vi="Giờ địa phương của bạn. Để trống là hiện tại; không được chọn tương lai."
                />
              }
              error={errors.observedAt?.[0]}
            >
              {(c) => <Input type="datetime-local" name="observedAt" {...c} />}
            </FormField>
          )}
          {(to === 'SIGNATURE' || submits) && (
            <>
              <Checks
                name="versionIds"
                legend={submits ? 'Exact versions submitted' : 'Versions the package will contain'}
                options={versions}
              />
              <FormField
                label={
                  <LocalizedText
                    en="External references (one per line)"
                    vi="Mã tham chiếu bên ngoài (mỗi dòng một mã)"
                  />
                }
                error={errors.externalRefs?.[0]}
              >
                {(c) => <Textarea name="externalRefs" rows={2} {...c} />}
              </FormField>
            </>
          )}
          {(to === 'RECEIPT' || to === 'APPROVAL') && (
            <Checks
              name="evidenceIds"
              legend={to === 'RECEIPT' ? 'Acknowledgement evidence' : 'Authority outcome evidence'}
              options={evidence}
            />
          )}
          {to === 'SUPPLEMENT' && (
            <>
              <FormField
                label={
                  <LocalizedText en="Authority request reference" vi="Mã yêu cầu của cơ quan" />
                }
                required
                error={errors.requestRef?.[0]}
              >
                {(c) => <Input name="requestRef" maxLength={500} autoComplete="off" {...c} />}
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label={<LocalizedText en="Owner of this cycle" vi="Người phụ trách vòng này" />}
                  required
                  error={errors.cycleOwnerId?.[0]}
                >
                  {(c) => (
                    <Select
                      name="cycleOwnerId"
                      placeholder="Choose"
                      options={members.map((m) => ({ value: m.id, label: m.label }))}
                      {...c}
                    />
                  )}
                </FormField>
                <FormField
                  label={<LocalizedText en="Due" vi="Hạn" />}
                  required
                  error={errors.cycleDue?.[0]}
                >
                  {(c) => <Input type="datetime-local" name="cycleDue" {...c} />}
                </FormField>
              </div>
            </>
          )}
          <FormField
            label={<LocalizedText en="Note (optional)" vi="Ghi chú (không bắt buộc)" />}
            error={errors.reason?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}

export function NegativeForm({
  matterId,
  detail,
  evidence,
}: {
  matterId: string
  detail: FilingDetail
  evidence: Option[]
}) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`filing:${detail.item.id}:negative`}
      submitLabel={<LocalizedText en="Record negative outcome" vi="Ghi nhận kết quả bất lợi" />}
      run={(v) =>
        recordNegativeAction({
          matterId,
          filingId: detail.item.id,
          ifMatch: detail.etag,
          outcome: v.outcome ?? '',
          reference: v.reference ?? '',
          observedAt: toInstant(v.observedAt),
          evidenceIds: v.evidenceIds ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Outcome" vi="Kết quả cần đạt" />}
            required
            error={errors.outcome?.[0]}
          >
            {(c) => (
              <Select
                name="outcome"
                placeholder="Choose"
                options={[
                  {
                    value: 'REJECTED',
                    label: <LocalizedText en="Rejected by the authority" vi="Bị cơ quan từ chối" />,
                  },
                  { value: 'WITHDRAWN', label: <LocalizedText en="Withdrawn" vi="Đã rút" /> },
                ]}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Reference" vi="Tham chiếu" />}
            error={errors.reference?.[0]}
          >
            {(c) => <Input name="reference" maxLength={500} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="When this happened" vi="Thời điểm xảy ra" />}
            error={errors.observedAt?.[0]}
          >
            {(c) => <Input type="datetime-local" name="observedAt" {...c} />}
          </FormField>
          <Checks name="evidenceIds" legend="Evidence (required)" options={evidence} />
        </>
      )}
    </IntentForm>
  )
}

export function OwnerStepForm({
  matterId,
  detail,
  step,
}: {
  matterId: string
  detail: FilingDetail
  step: 'closure' | 'reopening'
}) {
  const label = step === 'closure' ? 'Close after the negative outcome' : 'Reopen this filing'
  return (
    <IntentForm
      receipted={false}
      draftKey={`filing:${detail.item.id}:${step}`}
      submitLabel={label}
      run={(v) =>
        filingOwnerStepAction({
          matterId,
          filingId: detail.item.id,
          ifMatch: detail.etag,
          step,
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Reason" vi="Lý do" />}
          required
          hint={
            step === 'closure'
              ? 'Cancels the filing. The linked Requirement stays unmet.'
              : 'History is kept. Proof must be reviewed again and approval needs new outcome evidence.'
          }
          error={errors.reason?.[0]}
        >
          {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
        </FormField>
      )}
    </IntentForm>
  )
}

/**
 * The OWNER's explicit decision that signatures do not apply to this filing (or its withdrawal).
 * Without it a submission needs an observed signature on a submitted version; an editor's choice
 * about outcome proof never waives that guard.
 */
export function SignatureApplicabilityForm({
  matterId,
  detail,
}: {
  matterId: string
  detail: FilingDetail
}) {
  const waived = detail.filing.signatureNotRequired
  return (
    <IntentForm
      receipted={false}
      key={`filing:${detail.item.id}:signatures:${waived ? 'waived' : 'required'}`}
      draftKey={`filing:${detail.item.id}:signatures:${waived ? 'waived' : 'required'}`}
      submitLabel={waived ? 'Require signatures again' : 'Record that no signatures apply'}
      run={(v) =>
        setSignatureApplicabilityAction({
          matterId,
          filingId: detail.item.id,
          ifMatch: detail.etag,
          signatureNotRequired: waived ? 'no' : 'yes',
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Reason" vi="Lý do" />}
          required
          hint={
            waived
              ? 'Submission will again need an observed signature on a submitted version.'
              : 'Kept with your name and the time. It lets this filing be submitted without an observed signature.'
          }
          error={errors.reason?.[0]}
        >
          {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
        </FormField>
      )}
    </IntentForm>
  )
}

export function CorrectionForm({ matterId, detail }: { matterId: string; detail: FilingDetail }) {
  const originals = detail.observations.filter((o) => o.kind !== 'CORRECTION')
  return (
    <IntentForm
      receipted={false}
      draftKey={`filing:${detail.item.id}:correction`}
      submitLabel={<LocalizedText en="Append correction" vi="Bổ sung đính chính" />}
      run={(v) =>
        correctObservationAction({
          matterId,
          filingId: detail.item.id,
          ifMatch: detail.etag,
          observationId: v.observationId ?? '',
          reference: v.reference ?? '',
          observedAt: toInstant(v.observedAt),
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Observation to correct" vi="Ghi nhận cần đính chính" />}
            required
            error={errors.observationId?.[0]}
          >
            {(c) => (
              <Select
                name="observationId"
                placeholder="Choose"
                options={originals.map((o) => ({
                  value: o.id,
                  label: `#${o.seq} ${o.kind === 'STAGE' ? `${o.from} → ${o.to}` : o.kind}`,
                }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Corrected reference" vi="Tham chiếu đã đính chính" />}
            error={errors.reference?.[0]}
          >
            {(c) => <Input name="reference" maxLength={500} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Corrected time" vi="Thời gian đã đính chính" />}
            error={errors.observedAt?.[0]}
          >
            {(c) => <Input type="datetime-local" name="observedAt" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Why it was wrong" vi="Lý do sai" />}
            required
            error={errors.reason?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
        </>
      )}
    </IntentForm>
  )
}
