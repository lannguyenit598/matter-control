'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Textarea } from '@/components/atoms/textarea'
import { FormField } from '@/components/molecules/form-field'
import { ConfirmActionButton } from '@/components/organisms/confirm-action-button'
import { IntentForm } from '@/components/organisms/intent-form'

import {
  assessClaimAction,
  createCriterionAction,
  raiseDisputeAction,
  resolveDisputeAction,
  revokeAssessmentAction,
  reviseCriterionAction,
  setApplicabilityAction,
  setVerifierAction,
  submitEvidenceAction,
  withdrawEvidenceAction,
} from '../actions'
import { CRITERION_REASON, userName, VERSION_RULE_LABEL } from '../labels'
import type { Checklist, Criterion } from '../schemas'

export type ProofContext = {
  matterId: string
  /** Caller's matter role and id (affordances only; the API decides every right). */
  role: string
  /** Item ETag, sent as If-Match for applicability. */
  itemEtag: string
  names: Record<string, string>
  documents: { id: string; name: string }[]
  versions: { id: string; label: string }[]
  /** Active EDITOR/OWNER members who could be designated. */
  verifierCandidates: { id: string; name: string }[]
}

const STATE_TEXT: Record<string, string> = {
  UNVERIFIED: 'Unverified',
  PARTIALLY_VERIFIED: 'Partially verified',
  VERIFIED: 'Verified',
  DISPUTED: 'Disputed',
  NOT_REQUIRED: 'Proof not required',
}

const canWrite = (role: string) => role === 'OWNER' || role === 'EDITOR'

/**
 * Proof of one record: criteria are what would count, evidence is what was offered, an
 * assessment is an independent verifier's decision on one offer. Nothing here sets a verification
 * state: it is derived by the API and only displayed.
 */
export function ProofPanel({ checklist, ctx }: { checklist: Checklist; ctx: ProofContext }) {
  const { subject } = checklist
  const isVerifier = checklist.verifiers.includes(checklist.callerId) && canWrite(ctx.role)
  const evidenceById = Object.fromEntries(checklist.evidence.map((e) => [e.id, e]))
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm">
        <span className="font-medium">
          {STATE_TEXT[checklist.verification] ?? checklist.verification}
        </span>
        {' · '}
        <span className="text-muted-foreground">
          Derived from the criteria below at {checklist.asOf}. It cannot be edited.
        </span>
      </p>

      {checklist.criteria.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="No criteria yet, so nothing can be verified. Add what would count as proof."
            vi="Chưa có tiêu chí nên chưa thể xác minh. Hãy nêu bằng chứng được chấp nhận."
          />
        </p>
      )}
      <ul className="flex flex-col gap-4">
        {checklist.criteria.map((c) => (
          <li key={c.id} className="rounded-md border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium">
                {c.title}
                {c.retired && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    <LocalizedText en="(retired)" vi="(ngừng áp dụng)" />
                  </span>
                )}
              </h3>
              <span className="text-sm">
                {c.satisfied ? 'Satisfied' : (CRITERION_REASON[c.reason ?? ''] ?? 'Not satisfied')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {c.mandatory ? 'Mandatory' : 'Optional'} · {VERSION_RULE_LABEL[c.versionRule]}
              {c.validDays > 0 ? ` · valid ${c.validDays} days once accepted` : ''} · revision{' '}
              {c.revision}
            </p>
            {c.description && <p className="mt-1 text-sm break-words">{c.description}</p>}
            <ul className="mt-3 flex flex-col gap-3">
              {c.claims.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  <LocalizedText
                    en="No evidence offered for this criterion."
                    vi="Chưa cung cấp bằng chứng cho tiêu chí này."
                  />
                </li>
              )}
              {c.claims.map((k) => {
                const ev = evidenceById[k.evidenceId]
                const a = k.assessment
                const independent =
                  ev !== undefined &&
                  ev.submittedBy !== checklist.callerId &&
                  k.claimedBy !== checklist.callerId
                const openDispute = checklist.openDisputes.find((d) => d.assessmentId === a?.id)
                return (
                  <li key={k.id} className="rounded border bg-muted/30 p-3 text-sm">
                    <p>
                      {ev?.kind === 'DOCUMENT_VERSION'
                        ? `Document version ${ev.versionId?.slice(0, 8)}`
                        : `Reference “${ev?.reference ?? ''}”`}{' '}
                      offered by {userName(ctx.names, k.claimedBy)}
                      {ev?.withdrawnAt ? ' · withdrawn' : ''}
                      {k.criterionRevision !== c.revision
                        ? ' · for an earlier revision of this criterion'
                        : ''}
                    </p>
                    {a ? (
                      <p className="mt-1">
                        <strong>{a.verdict === 'ACCEPTED' ? 'Accepted' : 'Rejected'}</strong> by{' '}
                        {userName(ctx.names, a.reviewer)}: {a.rationale}
                        {a.revokedAt ? ` · revoked (${a.revokedReason ?? ''})` : ''}
                        {a.effectiveUntil ? ` · counts until ${a.effectiveUntil}` : ''}
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">
                        <LocalizedText
                          en="Waiting for an independent verifier."
                          vi="Đang chờ người xác minh độc lập."
                        />
                      </p>
                    )}
                    {k.criterionRevision === c.revision &&
                      !ev?.withdrawnAt &&
                      isVerifier &&
                      independent &&
                      !openDispute && (
                        <AssessForm
                          matterId={ctx.matterId}
                          claimId={k.id}
                          epoch={subject.proofEpoch}
                          versionId={ev?.versionId ?? ''}
                          seenAssessmentId={a?.id ?? ''}
                        />
                      )}
                    {isVerifier && !independent && !a && (
                      <p className="mt-1 text-muted-foreground">
                        <LocalizedText
                          en="You supplied or offered this, so someone else must review it."
                          vi="Bạn đã cung cấp hoặc đề xuất bằng chứng này, nên người khác phải đánh giá."
                        />
                      </p>
                    )}
                    {a?.verdict === 'ACCEPTED' &&
                      !a.revokedAt &&
                      k.criterionRevision === c.revision && (
                        <div className="mt-2 flex flex-wrap gap-4">
                          {canWrite(ctx.role) && !openDispute && (
                            <ReasonForm
                              label="Challenge this acceptance"
                              draftKey={`assessment:${a.id}:dispute`}
                              run={(reason) =>
                                raiseDisputeAction({
                                  matterId: ctx.matterId,
                                  targetId: a.id,
                                  reason,
                                })
                              }
                            />
                          )}
                          {isVerifier && independent && (
                            <ReasonForm
                              label="Revoke this acceptance"
                              draftKey={`assessment:${a.id}:revoke`}
                              run={(reason) =>
                                revokeAssessmentAction({
                                  matterId: ctx.matterId,
                                  targetId: a.id,
                                  reason,
                                })
                              }
                            />
                          )}
                        </div>
                      )}
                    {openDispute && (
                      <div className="mt-2 text-sm">
                        <p>
                          Challenged by {userName(ctx.names, openDispute.raisedBy)}:{' '}
                          {openDispute.reason}
                        </p>
                        {isVerifier &&
                          independent &&
                          openDispute.raisedBy !== checklist.callerId && (
                            <ReasonForm
                              label="Resolve the dispute"
                              draftKey={`dispute:${openDispute.id}:resolve`}
                              run={(resolution) =>
                                resolveDisputeAction({
                                  matterId: ctx.matterId,
                                  disputeId: openDispute.id,
                                  resolution,
                                })
                              }
                            />
                          )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
            {canWrite(ctx.role) && !c.retired && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm underline">
                  <LocalizedText
                    en="Revise or retire this criterion"
                    vi="Sửa đổi hoặc ngừng áp dụng tiêu chí"
                  />
                </summary>
                <CriterionForm ctx={ctx} itemId={subject.id} existing={c} />
              </details>
            )}
          </li>
        ))}
      </ul>

      {canWrite(ctx.role) && subject.proofRequired && (
        <>
          <section aria-labelledby="add-criterion">
            <h3 id="add-criterion" className="mb-2 font-medium">
              <LocalizedText en="Add a criterion" vi="Thêm tiêu chí" />
            </h3>
            <CriterionForm ctx={ctx} itemId={subject.id} />
          </section>
          <section aria-labelledby="offer-evidence">
            <h3 id="offer-evidence" className="mb-2 font-medium">
              <LocalizedText en="Offer evidence" vi="Cung cấp bằng chứng" />
            </h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Offering evidence proves nothing by itself: a designated verifier who did not supply
              it must accept it.
            </p>
            <EvidenceForm ctx={ctx} criteria={checklist.criteria.filter((c) => !c.retired)} />
          </section>
        </>
      )}

      {checklist.evidence.some(
        (e) => !e.withdrawnAt && (e.submittedBy === checklist.callerId || ctx.role === 'OWNER'),
      ) && (
        <section aria-labelledby="withdraw-evidence">
          <h3 id="withdraw-evidence" className="mb-2 font-medium">
            <LocalizedText en="Withdraw evidence" vi="Rút bằng chứng" />
          </h3>
          <ul className="flex flex-col gap-2">
            {checklist.evidence
              .filter(
                (e) =>
                  !e.withdrawnAt && (e.submittedBy === checklist.callerId || ctx.role === 'OWNER'),
              )
              .map((e) => (
                <li key={e.id} className="text-sm">
                  {e.kind === 'DOCUMENT_VERSION'
                    ? `Version ${e.versionId?.slice(0, 8)}`
                    : e.reference}
                  <ReasonForm
                    label="Withdraw"
                    draftKey={`evidence:${e.id}:withdraw`}
                    run={(reason) =>
                      withdrawEvidenceAction({ matterId: ctx.matterId, targetId: e.id, reason })
                    }
                  />
                </li>
              ))}
          </ul>
        </section>
      )}

      {ctx.role === 'OWNER' && subject.proofRequired && (
        <section aria-labelledby="applicability">
          <h3 id="applicability" className="mb-2 font-medium">
            <LocalizedText en="Is proof needed?" vi="Có cần bằng chứng không?" />
          </h3>
          <ApplicabilityForm ctx={ctx} subject={subject} />
        </section>
      )}

      <section aria-labelledby="verifiers">
        <h3 id="verifiers" className="mb-2 font-medium">
          <LocalizedText en="Designated verifiers" vi="Người xác minh được chỉ định" />
        </h3>
        <p className="mb-2 text-sm text-muted-foreground">
          Owner status alone is not verifier authority. A verifier must be an Editor or Owner of the
          matter.
        </p>
        {checklist.verifiers.length === 0 ? (
          <p className="text-sm">
            <LocalizedText
              en="No verifier is designated, so proof stays pending."
              vi="Chưa chỉ định người xác minh nên bằng chứng vẫn chờ xử lý."
            />
          </p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {checklist.verifiers.map((v) => (
              <li key={v} className="flex flex-wrap items-center gap-3">
                {userName(ctx.names, v)}
                {ctx.role === 'OWNER' && (
                  <ConfirmActionButton
                    label="Revoke"
                    confirmLabel="Revoke verifier"
                    warning="They will no longer be able to review proof."
                    run={() =>
                      setVerifierAction({ matterId: ctx.matterId, userId: v, revoke: true })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {ctx.role === 'OWNER' &&
          ctx.verifierCandidates.some((c) => !checklist.verifiers.includes(c.id)) && (
            <div className="mt-3">
              <IntentForm
                receipted={false}
                submitLabel={<LocalizedText en="Designate verifier" vi="Chỉ định người xác minh" />}
                run={(v) =>
                  setVerifierAction({
                    matterId: ctx.matterId,
                    userId: v.userId ?? '',
                    revoke: false,
                  })
                }
              >
                {({ errors }) => (
                  <FormField
                    label={<LocalizedText en="Member" vi="Thành viên" />}
                    required
                    error={errors.userId?.[0]}
                  >
                    {(c) => (
                      <Select
                        name="userId"
                        placeholder="Choose a member"
                        options={ctx.verifierCandidates
                          .filter((m) => !checklist.verifiers.includes(m.id))
                          .map((m) => ({ value: m.id, label: m.name }))}
                        {...c}
                      />
                    )}
                  </FormField>
                )}
              </IntentForm>
            </div>
          )}
      </section>
    </div>
  )
}

function ReasonForm({
  label,
  draftKey,
  run,
}: {
  label: string
  draftKey: string
  run: (reason: string) => ReturnType<typeof withdrawEvidenceAction>
}) {
  return (
    <details>
      <summary className="cursor-pointer text-sm underline">{label}</summary>
      <IntentForm
        receipted={false}
        draftKey={draftKey}
        submitLabel={label}
        run={(v) => run(v.reason ?? '')}
      >
        {({ errors }) => (
          <FormField
            label={<LocalizedText en="Reason" vi="Lý do" />}
            required
            error={errors.reason?.[0] ?? errors.resolution?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
        )}
      </IntentForm>
    </details>
  )
}

function AssessForm({
  matterId,
  claimId,
  epoch,
  versionId,
  seenAssessmentId,
}: {
  matterId: string
  claimId: string
  epoch: number
  versionId: string
  seenAssessmentId: string
}) {
  return (
    <details className="mt-2" open>
      <summary className="cursor-pointer text-sm underline">
        <LocalizedText en="Review this evidence" vi="Đánh giá bằng chứng" />
      </summary>
      <IntentForm
        // A draft belongs to the assessment it was written against: a newer verdict remounts a clean form.
        key={`claim:${claimId}:assess:${seenAssessmentId || 'none'}`}
        receipted={false}
        draftKey={`claim:${claimId}:assess:${seenAssessmentId || 'none'}`}
        submitLabel={<LocalizedText en="Record decision" vi="Ghi nhận quyết định" />}
        run={(v) =>
          assessClaimAction({
            matterId,
            claimId,
            expectedSubjectEpoch: epoch,
            verdict: v.verdict ?? '',
            rationale: v.rationale ?? '',
            assessedVersionId: versionId,
            validDays: v.validDays || '0',
            expectedAssessmentId: seenAssessmentId,
          })
        }
      >
        {({ errors }) => (
          <>
            {versionId && (
              <p className="text-sm text-muted-foreground">
                You are assessing version {versionId.slice(0, 8)}; open it from Documents to read it
                first.
              </p>
            )}
            <FormField
              label={<LocalizedText en="Decision" vi="Quyết định" />}
              required
              error={errors.verdict?.[0]}
            >
              {(c) => (
                <Select
                  name="verdict"
                  placeholder="Choose"
                  options={[
                    { value: 'ACCEPTED', label: <LocalizedText en="Accept" vi="Chấp nhận" /> },
                    { value: 'REJECTED', label: <LocalizedText en="Reject" vi="Từ chối" /> },
                  ]}
                  {...c}
                />
              )}
            </FormField>
            <FormField
              label={<LocalizedText en="Rationale" vi="Căn cứ" />}
              required
              error={errors.rationale?.[0]}
            >
              {(c) => <Textarea name="rationale" rows={2} maxLength={2000} {...c} />}
            </FormField>
            <FormField
              label={
                <LocalizedText
                  en="Counts for (days, optional)"
                  vi="Hiệu lực (ngày, không bắt buộc)"
                />
              }
              hint={
                <LocalizedText
                  en="Empty: until the evidence’s own validity ends."
                  vi="Để trống: đến khi bằng chứng hết hiệu lực."
                />
              }
              error={errors.validDays?.[0]}
            >
              {(c) => <Input type="number" min={0} max={36500} name="validDays" {...c} />}
            </FormField>
          </>
        )}
      </IntentForm>
    </details>
  )
}

function CriterionForm({
  ctx,
  itemId,
  existing,
}: {
  ctx: ProofContext
  itemId: string
  existing?: Criterion
}) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`item:${itemId}:criterion:${existing?.id ?? 'new'}`}
      submitLabel={existing ? 'Save revision' : 'Add criterion'}
      run={(v) => {
        const base = {
          matterId: ctx.matterId,
          itemId,
          title: v.title ?? '',
          description: v.description ?? '',
          mandatory: v.mandatory ?? 'yes',
          versionRule: v.versionRule ?? 'NONE',
          documentId: v.documentId ?? '',
          fixedVersionId: v.fixedVersionId ?? '',
          validDays: v.validDays || '0',
        }
        return existing
          ? reviseCriterionAction({
              ...base,
              criterionId: existing.id,
              ifMatch: existing.etag,
              reason: v.reason ?? '',
              retire: v.retire ?? 'no',
            })
          : createCriterionAction(base)
      }}
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Title" vi="Tiêu đề" />}
            required
            error={errors.title?.[0]}
          >
            {(c) => (
              <Input
                name="title"
                maxLength={200}
                defaultValue={existing?.title}
                autoComplete="off"
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Description" vi="Mô tả" />}
            error={errors.description?.[0]}
          >
            {(c) => (
              <Textarea
                name="description"
                rows={2}
                maxLength={2000}
                defaultValue={existing?.description}
                {...c}
              />
            )}
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={<LocalizedText en="Required?" vi="Bắt buộc?" />}>
              {(c) => (
                <Select
                  name="mandatory"
                  defaultValue={existing && !existing.mandatory ? 'no' : 'yes'}
                  options={[
                    { value: 'yes', label: <LocalizedText en="Mandatory" vi="Bắt buộc" /> },
                    { value: 'no', label: <LocalizedText en="Optional" vi="Không bắt buộc" /> },
                  ]}
                  {...c}
                />
              )}
            </FormField>
            <FormField
              label={
                <LocalizedText
                  en="Valid for (days once accepted, 0 = unbounded)"
                  vi="Hiệu lực sau chấp nhận (ngày; 0 = không giới hạn)"
                />
              }
              error={errors.validDays?.[0]}
            >
              {(c) => (
                <Input
                  type="number"
                  min={0}
                  max={36500}
                  name="validDays"
                  defaultValue={existing?.validDays ?? 0}
                  {...c}
                />
              )}
            </FormField>
          </div>
          <FormField
            label={<LocalizedText en="Which evidence counts" vi="Bằng chứng nào được chấp nhận" />}
            hint={
              <LocalizedText
                en="A current-version criterion is invalidated when another version is promoted."
                vi="Tiêu chí gắn với bản hiện hành mất hiệu lực khi chọn phiên bản khác."
              />
            }
          >
            {(c) => (
              <Select
                name="versionRule"
                defaultValue={existing?.versionRule ?? 'NONE'}
                options={Object.entries(VERSION_RULE_LABEL).map(([value, label]) => ({
                  value,
                  label,
                }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={
              <LocalizedText
                en="Document (current-version rule)"
                vi="Tài liệu (quy tắc bản hiện hành)"
              />
            }
          >
            {(c) => (
              <Select
                name="documentId"
                placeholder="None"
                defaultValue={existing?.documentId ?? ''}
                options={ctx.documents.map((d) => ({ value: d.id, label: d.name }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={
              <LocalizedText
                en="Exact version (fixed-version rule)"
                vi="Phiên bản cụ thể (quy tắc bản cố định)"
              />
            }
          >
            {(c) => (
              <Select
                name="fixedVersionId"
                placeholder="None"
                defaultValue={existing?.fixedVersionId ?? ''}
                options={ctx.versions.map((x) => ({ value: x.id, label: x.label }))}
                {...c}
              />
            )}
          </FormField>
          {existing && (
            <>
              <FormField
                label={<LocalizedText en="Reason for the change" vi="Lý do thay đổi" />}
                required
                error={errors.reason?.[0]}
              >
                {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
              </FormField>
              {ctx.role === 'OWNER' && (
                <FormField
                  label={
                    <LocalizedText en="Retire this criterion?" vi="Ngừng áp dụng tiêu chí này?" />
                  }
                  hint={
                    <LocalizedText
                      en="Owners only. Retiring changes what counts as verified."
                      vi="Chỉ dành cho chủ sở hữu. Ngừng tiêu chí làm thay đổi điều kiện được xác minh."
                    />
                  }
                >
                  {(c) => (
                    <Select
                      name="retire"
                      defaultValue="no"
                      options={[
                        {
                          value: 'no',
                          label: <LocalizedText en="No, keep it" vi="Không, giữ lại" />,
                        },
                        {
                          value: 'yes',
                          label: <LocalizedText en="Yes, retire it" vi="Có, ngừng áp dụng" />,
                        },
                      ]}
                      {...c}
                    />
                  )}
                </FormField>
              )}
            </>
          )}
        </>
      )}
    </IntentForm>
  )
}

function EvidenceForm({ ctx, criteria }: { ctx: ProofContext; criteria: Criterion[] }) {
  return (
    <IntentForm
      receipted
      draftKey={`matter:${ctx.matterId}:evidence`}
      submitLabel={<LocalizedText en="Offer evidence" vi="Cung cấp bằng chứng" />}
      run={(v, key) =>
        submitEvidenceAction({
          matterId: ctx.matterId,
          idempotencyKey: key,
          versionId: v.versionId ?? '',
          reference: v.reference ?? '',
          description: v.description ?? '',
          validFrom: v.validFrom ?? '',
          validUntil: v.validUntil ?? '',
          claims: v.claims ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <FormField
            label={<LocalizedText en="Document version" vi="Phiên bản tài liệu" />}
            hint={
              <LocalizedText
                en="Or give an external reference below."
                vi="Hoặc nhập tham chiếu bên ngoài bên dưới."
              />
            }
          >
            {(c) => (
              <Select
                name="versionId"
                placeholder="None"
                options={ctx.versions.map((x) => ({ value: x.id, label: x.label }))}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="External reference" vi="Tham chiếu bên ngoài" />}
            error={errors.reference?.[0]}
          >
            {(c) => <Input name="reference" maxLength={500} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Description" vi="Mô tả" />}
            error={errors.description?.[0]}
          >
            {(c) => <Textarea name="description" rows={2} maxLength={2000} {...c} />}
          </FormField>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">
              <LocalizedText en="Offer it for these criteria" vi="Cung cấp cho các tiêu chí này" />
            </legend>
            {criteria.length === 0 && (
              <p className="text-sm text-muted-foreground">
                <LocalizedText en="Add a criterion first." vi="Hãy thêm tiêu chí trước." />
              </p>
            )}
            {criteria.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="claims" value={c.id} className="size-4" />
                {c.title}
              </label>
            ))}
          </fieldset>
        </>
      )}
    </IntentForm>
  )
}

function ApplicabilityForm({ ctx, subject }: { ctx: ProofContext; subject: Checklist['subject'] }) {
  const notRequired = subject.verificationApplicability === 'NOT_REQUIRED'
  return (
    <IntentForm
      receipted={false}
      draftKey={`item:${subject.id}:applicability`}
      submitLabel={notRequired ? 'Require proof again' : 'Declare proof not required'}
      run={(v) =>
        setApplicabilityAction({
          matterId: ctx.matterId,
          itemId: subject.id,
          ifMatch: ctx.itemEtag,
          notRequired: notRequired ? 'no' : 'yes',
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Reason" vi="Lý do" />}
          required
          hint={
            notRequired
              ? `Currently not required: ${subject.applicabilityReason ?? ''}`
              : 'Only possible when no mandatory criterion applies and nothing is disputed.'
          }
          error={errors.reason?.[0]}
        >
          {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
        </FormField>
      )}
    </IntentForm>
  )
}
