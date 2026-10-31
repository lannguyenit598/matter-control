import { ArrowLeft, ChevronDown, ListTodo } from 'lucide-react'
import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { OutcomeVerificationBadge } from '@/features/filings/components/outcome-verification'
import { EvidenceBasis } from '@/features/proof/components/evidence-basis'
import { ProofPanel } from '@/features/proof/components/proof-panel'
import { proofRepository } from '@/features/proof/repository'
import { DependencyPanel } from '@/features/work/components/dependency-panel'
import { EscalationPanel } from '@/features/work/components/escalation-panel'
import { ExecutionPanel } from '@/features/work/components/execution-panel'
import { MetadataForm } from '@/features/work/components/metadata-form'
import { WorkNow } from '@/features/work/components/work-now'
import {
  AttentionBadge,
  DependencyBadge,
  ExecutionBadge,
  KindBadge,
  TimingBadge,
  VerificationBadge,
} from '@/features/work/components/work-badges'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'
import { safeInternalPath } from '@/lib/mc/paths'

export const metadata: Metadata = { title: 'Work item' }

export default function WorkItemPage({
  params,
  searchParams,
}: PageProps<'/matters/[matterId]/work/[itemId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <WorkItem params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function WorkItem({
  params,
  searchParams,
}: Pick<PageProps<'/matters/[matterId]/work/[itemId]'>, 'params' | 'searchParams'>) {
  const { matterId, itemId } = await params
  const raw = await searchParams
  const fromRaw = Array.isArray(raw.from) ? raw.from[0] : raw.from
  const criterionRaw = Array.isArray(raw.criterion) ? raw.criterion[0] : raw.criterion
  const criterionId = criterionRaw && criterionRaw.length <= 100 ? criterionRaw : undefined
  const gridPath = `/matters/${matterId}/work`
  // Back goes to where this record was opened from (another record, the grid with its filters,
  // My Actions...), never to a guess.
  const from = safeInternalPath(fromRaw, gridPath)
  const here = `/matters/${matterId}/work/${itemId}${fromRaw ? `?from=${encodeURIComponent(from)}` : ''}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />

  const read = await attempt(async () => {
    const [{ detail, asOf }, matter, members, workstreams, parties, all] = await Promise.all([
      workRepository.get(matterId, itemId),
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.workstreams(matterId),
      workRepository.parties(matterId),
      workRepository.list(matterId, {}, 200),
    ])
    // Proof is read separately: a failure here must not hide the record itself.
    // A filing keeps its package/signature checklist reachable whatever its outcome flag says (BF-02).
    const proof =
      detail.item.proofRequired || detail.isFiling
        ? await attempt(async () => {
            const [{ checklist }, docs] = await Promise.all([
              proofRepository.checklist(matterId, itemId),
              proofRepository.documents(matterId),
            ])
            const details = await Promise.all(
              docs.items.map((d) => proofRepository.document(matterId, d.id)),
            )
            return { checklist, docs: docs.items, details: details.map((x) => x.detail) }
          })
        : null
    return {
      proof,
      detail,
      asOf,
      matter: matter.matter,
      members: members.items,
      workstreams: workstreams.items,
      parties: parties.items,
      all: all.page.items,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="record" />
  const { detail, asOf, matter, members, workstreams, parties, all, proof } = read.value
  const names = Object.fromEntries(members.map((m) => [m.userId, m.displayName]))
  const it = detail.item
  const role = matter.callerRole
  const canEdit = role === 'OWNER' || role === 'EDITOR'
  const titles = Object.fromEntries(all.map((e) => [e.item.id, e.item.title]))
  const owner = members.find((m) => m.userId === it.ownerId)
  const party = parties.find((p) => p.id === it.waitingPartyId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={from} className="underline">
          <ArrowLeft aria-hidden className="inline size-4 shrink-0" />{' '}
          <LocalizedText en="Back" vi="Quay lại" />
        </Link>
        <Link href={gridPath} className="text-muted-foreground underline">
          <ListTodo aria-hidden className="inline size-4 shrink-0" />{' '}
          <LocalizedText en="All work items" vi="Tất cả bản ghi công việc" />
        </Link>
      </div>
      <PageHeader
        title={it.title}
        description={asOf ? `Read at ${asOf}` : undefined}
        actions={<KindBadge kind={it.kind} />}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <p aria-label="State at a glance" className="flex flex-wrap items-center gap-2 text-sm">
            <ExecutionBadge state={it.execution} />
            <DependencyBadge state={it.dependency} />
            <VerificationBadge item={it} />
            <OutcomeVerificationBadge state={detail.outcomeVerification} />
            <AttentionBadge derived={detail.derived} />
          </p>
          <WorkNow item={it} derived={detail.derived} role={role} partyName={party?.name}>
            <ExecutionPanel
              matterId={matterId}
              entry={detail}
              role={role}
              parties={parties}
              titles={titles}
            />
          </WorkNow>
        </CardContent>
      </Card>

      <Disclosure
        id="state-axes"
        title={<LocalizedText en="All state axes" vi="Tất cả các trục trạng thái" />}
      >
        <Card>
          <CardHeader>
            <CardDescription>
              Five independent dimensions. None implies another: completed is not verified, waiting
              is not blocked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {it.importedVerificationClaim && (
                <Axis
                  term={
                    <LocalizedText
                      en="Imported verification claim"
                      vi="Nhãn xác minh từ nguồn nhập"
                    />
                  }
                >
                  <span>
                    {it.importedVerificationClaim} — source label only; not verified proof.
                  </span>
                </Axis>
              )}
              <Axis term={<LocalizedText en="Execution" vi="Thực hiện" />}>
                <ExecutionBadge state={it.execution} />
              </Axis>
              <Axis term={<LocalizedText en="Verification" vi="Xác minh" />}>
                <VerificationBadge item={it} />
              </Axis>
              <Axis term={<LocalizedText en="Dependency" vi="Phụ thuộc" />}>
                <DependencyBadge state={it.dependency} />
              </Axis>
              <Axis term={<LocalizedText en="Timing" vi="Thời hạn" />}>
                <TimingBadge derived={detail.derived} />
              </Axis>
              <Axis term={<LocalizedText en="Attention" vi="Mức chú ý" />}>
                <AttentionBadge derived={detail.derived} />
              </Axis>
              <Axis term={<LocalizedText en="Owner" vi="Người phụ trách" />}>
                {owner ? (
                  owner.displayName
                ) : (
                  <span className="text-muted-foreground">
                    {it.ownerId ? 'Not an active member' : 'Unassigned'}
                  </span>
                )}
              </Axis>
              <Axis term={<LocalizedText en="Due" vi="Hạn" />}>
                {it.dueAt ? (
                  <LocalizedInstant iso={it.dueAt} />
                ) : (
                  <span className="text-muted-foreground">
                    <LocalizedText en="No due date" vi="Chưa có hạn" />
                  </span>
                )}
              </Axis>
              {it.completedAt && (
                <Axis term={<LocalizedText en="Completed" vi="Đã hoàn tất" />}>
                  <LocalizedInstant iso={it.completedAt} />
                </Axis>
              )}
              {it.execution === 'WAITING' && (
                <Axis term={<LocalizedText en="Waiting on" vi="Đang chờ" />}>
                  {party?.name ?? 'an external party'}: {it.waitingCondition}
                </Axis>
              )}
              {it.escalation && (
                <Axis term={<LocalizedText en="Escalation" vi="Nâng mức ưu tiên" />}>
                  {it.escalation}
                </Axis>
              )}
            </dl>
            {it.dependencyReasons.length > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                <LocalizedText
                  en="Blocked: see the failed gates under Prerequisites."
                  vi="Đang bị chặn: xem điều kiện chưa đạt trong phần Điều kiện tiên quyết."
                />
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              <LocalizedText
                en="Verification changes only through evidence review; it cannot be edited here."
                vi="Trạng thái xác minh chỉ đổi qua đánh giá bằng chứng; không thể sửa tại đây."
              />
            </p>
          </CardContent>
        </Card>
      </Disclosure>

      {proof && (
        <Card id="proof">
          <CardHeader>
            <CardTitle>
              <LocalizedText en="Proof" vi="Bằng chứng" />
            </CardTitle>
            <CardDescription>
              <LocalizedText
                en="Criteria say what would count. A verifier who did not supply the evidence decides."
                vi="Tiêu chí xác định bằng chứng phù hợp. Người xác minh độc lập với người cung cấp sẽ đánh giá."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proof.ok ? (
              <ProofPanel
                checklist={proof.value.checklist}
                ctx={{
                  matterId,
                  role,
                  itemEtag: detail.etag,
                  isFiling: detail.isFiling,
                  names,
                  documents: proof.value.docs.map((d) => ({ id: d.id, name: d.name })),
                  versions: proof.value.details.flatMap((d) =>
                    d.versions.map((v) => ({
                      id: v.id,
                      label: `${d.document.name} · v${v.no} · ${v.filename}`,
                    })),
                  ),
                  verifierCandidates: members
                    .filter(
                      (m) => m.status === 'ACTIVE' && (m.role === 'OWNER' || m.role === 'EDITOR'),
                    )
                    .map((m) => ({ id: m.userId, name: m.displayName })),
                }}
              />
            ) : (
              <ReadFailure kind={proof.kind} retryHref={here} subject="proof" partial />
            )}
            {proof.ok && (
              <EvidenceBasis
                checklist={proof.value.checklist}
                docs={proof.value.details}
                names={names}
                selectedId={criterionId}
                linkTo={(id) => {
                  const base = `/matters/${matterId}/work/${itemId}`
                  const qs = new URLSearchParams()
                  if (fromRaw) qs.set('from', from)
                  if (id) qs.set('criterion', id)
                  return qs.size ? `${base}?${qs}` : base
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Disclosure
        id="prerequisites"
        open={it.dependencyReasons.length > 0}
        title={
          <LocalizedText
            en="Prerequisites and dependents"
            vi="Điều kiện tiên quyết và công việc phụ thuộc"
          />
        }
      >
        <Card>
          <CardHeader>
            <CardDescription>
              <LocalizedText
                en="What must be satisfied before this record can proceed, and what waits on it."
                vi="Các điều kiện cần đạt trước khi tiếp tục và những công việc đang chờ bản ghi này."
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DependencyPanel
              matterId={matterId}
              detail={detail}
              here={here}
              canEdit={canEdit}
              titles={titles}
            />
          </CardContent>
        </Card>
      </Disclosure>

      <Disclosure id="details" title={<LocalizedText en="Edit details" vi="Sửa chi tiết" />}>
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <MetadataForm
              matterId={matterId}
              entry={detail}
              members={members}
              workstreams={workstreams}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      </Disclosure>

      {role === 'OWNER' && (
        <Disclosure
          id="escalation"
          title={<LocalizedText en="Escalation (owner)" vi="Nâng mức ưu tiên (chủ sở hữu)" />}
        >
          <Card>
            <CardHeader>
              <CardDescription>
                <LocalizedText
                  en="Owners can mark a record critical with a reason."
                  vi="Chủ sở hữu có thể đánh dấu bản ghi là nghiêm trọng khi nêu rõ lý do."
                />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EscalationPanel matterId={matterId} entry={detail} />
            </CardContent>
          </Card>
        </Disclosure>
      )}
    </div>
  )
}

function Axis({ term, children }: { term: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-1 break-words">{children}</dd>
    </div>
  )
}

/** Secondary controls stay one deliberate step away; every control inside remains mounted. */
function Disclosure({
  id,
  title,
  open,
  children,
}: {
  id: string
  title: React.ReactNode
  open?: boolean
  children: React.ReactNode
}) {
  return (
    <details id={id} open={open || undefined} className="group flex flex-col gap-3 border-t pt-4">
      <summary className="control-target flex cursor-pointer list-none items-center justify-between text-lg font-semibold">
        {title}
        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      {children}
    </details>
  )
}
