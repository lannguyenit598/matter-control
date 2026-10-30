import {
  ArrowRight,
  CircleAlert,
  FileSignature,
  Archive,
  RotateCcw,
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { TaskDialog } from '@/components/organisms/form-dialog'
import { ReadFailure } from '@/components/organisms/read-failure'
import {
  AdvanceForm,
  CorrectionForm,
  NegativeForm,
  OwnerStepForm,
  SignatureApplicabilityForm,
} from '@/features/filings/components/filing-forms'
import { FilingView } from '@/features/filings/components/filing-view'
import { STAGE_LABEL } from '@/features/filings/labels'
import { filingRepository } from '@/features/filings/repository'
import { matterRepository } from '@/features/matters/repository'
import { proofRepository } from '@/features/proof/repository'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Filing' }

type Props = PageProps<'/matters/[matterId]/filings/[filingId]'>

export default function FilingPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <FilingDetailView params={params} />
    </Suspense>
  )
}

async function FilingDetailView({ params }: Pick<Props, 'params'>) {
  const { matterId, filingId } = await params
  const here = `/matters/${matterId}/filings/${filingId}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [{ detail }, matter, members, parties, docs, evidence] = await Promise.all([
      filingRepository.get(matterId, filingId),
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.parties(matterId),
      proofRepository.documents(matterId),
      filingRepository.evidence(matterId),
    ])
    const docDetails = await Promise.all(
      docs.items.map((d) => proofRepository.document(matterId, d.id)),
    )
    return {
      detail,
      matter: matter.matter,
      members: members.items,
      parties: parties.items,
      docDetails,
      evidence,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="filing" />
  const { detail, matter, members, parties, docDetails, evidence } = read.value
  const role = matter.callerRole
  const canEdit = role === 'OWNER' || role === 'EDITOR'
  const it = detail.item
  const users = Object.fromEntries(members.map((m) => [m.userId, m.displayName]))
  const versions = docDetails.flatMap((d) =>
    d.detail.versions.map((v) => ({
      id: v.id,
      label: `${d.detail.document.name} · v${v.no} · ${v.filename}`,
    })),
  )
  const evidenceOpts = evidence
    .filter((e) => !e.withdrawnAt)
    .map((e) => ({
      id: e.id,
      label: `${e.kind === 'DOCUMENT_VERSION' ? 'Document version' : (e.reference ?? 'Reference')}${e.description ? ` · ${e.description}` : ''} (${e.submittedAt})`,
    }))
  const authority = parties.find((p) => p.id === detail.filing.authorityPartyId)
  const closed = it.execution === 'COMPLETED' || it.execution === 'CANCELLED'
  const memberOpts = members
    .filter((m) => m.status === 'ACTIVE')
    .map((m) => ({ id: m.userId, label: m.displayName }))

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/matters/${matterId}/filings`} className="text-sm underline">
        <ArrowLeft aria-hidden className="inline size-4 shrink-0" />{' '}
        <LocalizedText en="All filings" vi="Tất cả thủ tục" />
      </Link>
      <PageHeader
        title={it.title}
        description={`Authority: ${authority?.name ?? 'unknown'} · read at ${detail.asOf}`}
      />
      <p className="text-sm">
        <LocalizedText en="Status" vi="Trạng thái" /> {it.execution.toLowerCase().replace('_', ' ')}
        {it.waitingCondition ? ` · waiting: ${it.waitingCondition}` : ''} · owner{' '}
        {users[it.ownerId ?? ''] ?? 'unassigned'} ·{' '}
        <Link href={`/matters/${matterId}/work/${it.id}`} className="underline">
          <LocalizedText en="Proof and dependencies" vi="Bằng chứng và phụ thuộc" />
        </Link>
      </p>

      <FilingView
        detail={detail}
        labels={{
          users,
          versions: Object.fromEntries(versions.map((v) => [v.id, v.label])),
          evidence: Object.fromEntries(evidenceOpts.map((e) => [e.id, e.label])),
        }}
      />

      {(canEdit || role === 'OWNER') && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Actions" vi="Thao tác" />
            </CardTitle>
            <CardDescription>
              <LocalizedText
                en="Nothing here changes the filing until you submit it. A refused step changes nothing and says why."
                vi="Không có thao tác nào thay đổi thủ tục cho đến khi bạn gửi. Bước bị từ chối không thay đổi gì và có nêu lý do."
              />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-2">
            {canEdit && !closed && detail.next.length > 0 && (
              <TaskDialog
                trigger={
                  <>
                    {' '}
                    <ArrowRight aria-hidden />
                    <LocalizedText en="Record the next step" vi="Ghi nhận bước tiếp theo" />
                  </>
                }
                title={<LocalizedText en="Record the next step" vi="Ghi nhận bước tiếp theo" />}
                description={
                  <>
                    <strong className="break-words">{it.title}</strong>
                    {' · '}
                    {STAGE_LABEL[detail.filing.stage]}
                    {'. '}
                    <LocalizedText
                      en="Only what is recorded here changes the filing."
                      vi="Chỉ những gì được ghi nhận ở đây mới thay đổi thủ tục."
                    />
                  </>
                }
                successNotice={<LocalizedText en="Step recorded." vi="Đã ghi nhận bước." />}
              >
                <AdvanceForm
                  matterId={matterId}
                  detail={detail}
                  versions={versions}
                  evidence={evidenceOpts}
                  members={memberOpts}
                />
              </TaskDialog>
            )}
            {canEdit &&
              !closed &&
              !detail.filing.negativeOpen &&
              ['SUBMISSION', 'RECEIPT', 'AUTHORITY_REVIEW', 'SUPPLEMENT', 'RESPONSE'].includes(
                detail.filing.stage,
              ) && (
                <TaskDialog
                  trigger={
                    <>
                      {' '}
                      <CircleAlert aria-hidden />
                      <LocalizedText
                        en="Record a rejection or withdrawal"
                        vi="Ghi nhận từ chối hoặc rút hồ sơ"
                      />
                    </>
                  }
                  triggerVariant="outline"
                  title={
                    <LocalizedText
                      en="Record a rejection or withdrawal"
                      vi="Ghi nhận từ chối hoặc rút hồ sơ"
                    />
                  }
                  description={
                    <LocalizedText
                      en="The stage does not change and the filing is not approved by it."
                      vi="Việc ghi nhận này không đổi giai đoạn và không có nghĩa thủ tục đã được phê duyệt."
                    />
                  }
                  successNotice={<LocalizedText en="Outcome recorded." vi="Đã ghi nhận kết quả." />}
                >
                  <NegativeForm matterId={matterId} detail={detail} evidence={evidenceOpts} />
                </TaskDialog>
              )}
            {role === 'OWNER' && !closed && (
              <TaskDialog
                trigger={
                  <>
                    {' '}
                    <FileSignature aria-hidden />
                    <LocalizedText en="Signature applicability" vi="Yêu cầu chữ ký" />
                  </>
                }
                triggerVariant="outline"
                title={<LocalizedText en="Signature applicability" vi="Yêu cầu chữ ký" />}
                description={
                  <LocalizedText
                    en="Only an owner can decide that signatures do not apply to this filing."
                    vi="Chỉ chủ sở hữu được quyết định thủ tục này không cần chữ ký."
                  />
                }
                successNotice={
                  <LocalizedText en="Decision recorded." vi="Đã ghi nhận quyết định." />
                }
              >
                <SignatureApplicabilityForm matterId={matterId} detail={detail} />
              </TaskDialog>
            )}
            {role === 'OWNER' && detail.filing.negativeOpen && (
              <TaskDialog
                trigger={
                  <>
                    {' '}
                    <Archive aria-hidden />
                    <LocalizedText
                      en="Close after the negative outcome"
                      vi="Đóng sau kết quả bất lợi"
                    />
                  </>
                }
                triggerVariant="outline"
                title={
                  <LocalizedText
                    en="Close after the negative outcome"
                    vi="Đóng sau kết quả bất lợi"
                  />
                }
                successNotice={<LocalizedText en="Filing closed." vi="Đã đóng thủ tục." />}
              >
                <OwnerStepForm matterId={matterId} detail={detail} step="closure" />
              </TaskDialog>
            )}
            {role === 'OWNER' && closed && (
              <TaskDialog
                trigger={
                  <>
                    {' '}
                    <RotateCcw aria-hidden />
                    <LocalizedText en="Reopen" vi="Mở lại" />
                  </>
                }
                triggerVariant="outline"
                title={<LocalizedText en="Reopen" vi="Mở lại" />}
                successNotice={<LocalizedText en="Filing reopened." vi="Đã mở lại thủ tục." />}
              >
                <OwnerStepForm matterId={matterId} detail={detail} step="reopening" />
              </TaskDialog>
            )}
            {role === 'OWNER' && detail.observations.length > 0 && (
              <TaskDialog
                trigger={
                  <>
                    {' '}
                    <Pencil aria-hidden />
                    <LocalizedText en="Correct an observation" vi="Đính chính ghi nhận" />
                  </>
                }
                triggerVariant="outline"
                title={<LocalizedText en="Correct an observation" vi="Đính chính ghi nhận" />}
                description={
                  <LocalizedText
                    en="The original stays; a correction is appended beside it."
                    vi="Bản gốc được giữ nguyên; bản đính chính được bổ sung bên cạnh."
                  />
                }
                successNotice={
                  <LocalizedText en="Correction recorded." vi="Đã ghi nhận đính chính." />
                }
              >
                <CorrectionForm matterId={matterId} detail={detail} />
              </TaskDialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
