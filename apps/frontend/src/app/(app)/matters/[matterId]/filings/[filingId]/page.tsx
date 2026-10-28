import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import {
  AdvanceForm,
  CorrectionForm,
  NegativeForm,
  OwnerStepForm,
  SignatureApplicabilityForm,
} from '@/features/filings/components/filing-forms'
import { FilingView } from '@/features/filings/components/filing-view'
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
        <LocalizedText en="← All filings" vi="← Tất cả thủ tục" />
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

      {canEdit && !closed && detail.next.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Record the next step" vi="Ghi nhận bước tiếp theo" />
            </CardTitle>
            <CardDescription>
              Only what is recorded here changes the filing. A refused step changes nothing and says
              why.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvanceForm
              matterId={matterId}
              detail={detail}
              versions={versions}
              evidence={evidenceOpts}
              members={memberOpts}
            />
          </CardContent>
        </Card>
      )}

      {canEdit &&
        !closed &&
        !detail.filing.negativeOpen &&
        ['SUBMISSION', 'RECEIPT', 'AUTHORITY_REVIEW', 'SUPPLEMENT', 'RESPONSE'].includes(
          detail.filing.stage,
        ) && (
          <Card>
            <CardHeader>
              <CardTitle>
                <LocalizedText
                  en="Record a rejection or withdrawal"
                  vi="Ghi nhận từ chối hoặc rút hồ sơ"
                />
              </CardTitle>
              <CardDescription>
                <LocalizedText
                  en="The stage does not change and the filing is not approved by it."
                  vi="Việc ghi nhận này không đổi giai đoạn và không có nghĩa thủ tục đã được phê duyệt."
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NegativeForm matterId={matterId} detail={detail} evidence={evidenceOpts} />
            </CardContent>
          </Card>
        )}

      {role === 'OWNER' && !closed && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Signature applicability" vi="Yêu cầu chữ ký" />
            </CardTitle>
            <CardDescription>
              <LocalizedText
                en="Only an owner can decide that signatures do not apply to this filing."
                vi="Chỉ chủ sở hữu được quyết định thủ tục này không cần chữ ký."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignatureApplicabilityForm matterId={matterId} detail={detail} />
          </CardContent>
        </Card>
      )}

      {role === 'OWNER' && detail.filing.negativeOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Close after the negative outcome" vi="Đóng sau kết quả bất lợi" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OwnerStepForm matterId={matterId} detail={detail} step="closure" />
          </CardContent>
        </Card>
      )}

      {role === 'OWNER' && closed && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Reopen" vi="Mở lại" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OwnerStepForm matterId={matterId} detail={detail} step="reopening" />
          </CardContent>
        </Card>
      )}

      {role === 'OWNER' && detail.observations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Correct an observation" vi="Đính chính ghi nhận" />
            </CardTitle>
            <CardDescription>
              <LocalizedText
                en="The original stays; a correction is appended beside it."
                vi="Bản gốc được giữ nguyên; bản đính chính được bổ sung bên cạnh."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CorrectionForm matterId={matterId} detail={detail} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
