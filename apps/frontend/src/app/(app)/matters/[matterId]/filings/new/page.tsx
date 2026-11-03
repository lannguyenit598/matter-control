import { ArrowLeft } from 'lucide-react'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { CreateFilingForm } from '@/features/filings/components/filing-forms'
import { matterRepository } from '@/features/matters/repository'
import { searchWorkItemsAction } from '@/features/work/actions'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'New filing' }

export default function NewFilingPage({ params }: PageProps<'/matters/[matterId]/filings/new'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewFiling params={params} />
    </Suspense>
  )
}

/**
 * Filing creation links several records (a Requirement, an authority, an accountable person), so
 * it is a page of its own with a stable URL rather than a modal. Everything it offers is read now
 * with the caller's own rights; without a Requirement or an authority the form says what is
 * missing and links to where to add it. Opening the page sends nothing.
 */
async function NewFiling({ params }: Pick<PageProps<'/matters/[matterId]/filings/new'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${matterId}/filings/new`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, members, parties, reqs] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.parties(matterId),
      workRepository.list(matterId, { kind: 'REQUIREMENT' }, 1),
    ])
    return {
      matter: matter.matter,
      members: members.items,
      parties: parties.items,
      reqs: reqs.page.items,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, members, parties, reqs } = read.value
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  return (
    <div className="flex flex-col gap-6">
      <Link href={`/matters/${matterId}/filings`} className="text-sm underline">
        <ArrowLeft aria-hidden className="inline size-4 shrink-0" />{' '}
        <LocalizedText en="All filings" vi="Tất cả thủ tục" />
      </Link>
      <PageHeader
        title={<LocalizedText en="New filing" vi="Thủ tục mới" />}
        description={
          <>
            <strong className="break-words">{matter.title}</strong>
            {' · '}
            <LocalizedText
              en="Records what happens at each stage. It does not file anything."
              vi="Ghi nhận diễn biến tại từng giai đoạn; hệ thống không nộp hồ sơ thay bạn."
            />
          </>
        }
      />
      {canEdit ? (
        <div className="max-w-2xl">
          <CreateFilingForm
            matterId={matterId}
            requirements={reqs.map((r) => ({ id: r.item.id, label: r.item.title }))}
            searchRecords={searchWorkItemsAction}
            parties={parties.map((p) => ({ id: p.id, label: p.name }))}
            members={members
              .filter((m) => m.status === 'ACTIVE')
              .map((m) => ({ id: m.userId, label: m.displayName }))}
          />
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          <LocalizedText
            en="Only owners and editors of this matter can create a filing."
            vi="Chỉ chủ sở hữu và biên tập viên của hồ sơ mới tạo được thủ tục."
          />
        </p>
      )}
    </div>
  )
}
