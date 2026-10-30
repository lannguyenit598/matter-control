import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { buttonVariants } from '@/components/atoms/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { STAGE_LABEL } from '@/features/filings/labels'
import { filingRepository } from '@/features/filings/repository'
import { matterRepository } from '@/features/matters/repository'
import { workRepository } from '@/features/work/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Filings' }

export default function FilingsPage({ params }: PageProps<'/matters/[matterId]/filings'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Filings params={params} />
    </Suspense>
  )
}

async function Filings({ params }: Pick<PageProps<'/matters/[matterId]/filings'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${matterId}/filings`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, filings, parties, reqs] = await Promise.all([
      matterRepository.get(matterId),
      filingRepository.list(matterId),
      workRepository.parties(matterId),
      workRepository.list(matterId, { kind: 'REQUIREMENT' }, 200),
    ])
    return {
      matter: matter.matter,
      filings: filings.items,
      parties: parties.items,
      reqs: reqs.page.items,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, filings, parties, reqs } = read.value
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  const partyName = Object.fromEntries(parties.map((p) => [p.id, p.name]))
  const reqTitle = Object.fromEntries(reqs.map((r) => [r.item.id, r.item.title]))
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={<LocalizedText en="Regulatory filings" vi="Thủ tục với cơ quan quản lý" />}
        actions={
          canEdit && (
            <Link href={`/matters/${matterId}/filings/new`} className={buttonVariants()}>
              <LocalizedText en="New filing" vi="Thủ tục mới" />
            </Link>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="Filings" vi="Thủ tục" />
          </CardTitle>
          <CardDescription>
            <LocalizedText
              en="MatterControl records what happened at each stage. It does not file anything."
              vi="MatterControl ghi nhận diễn biến tại từng giai đoạn; hệ thống không nộp hồ sơ thay bạn."
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LocalizedText en="No filings yet." vi="Chưa có thủ tục." />
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {filings.map((f) => (
                <li key={f.item.id} className="flex flex-col gap-1 py-3">
                  <Link
                    href={`/matters/${matterId}/filings/${f.item.id}`}
                    className="font-medium underline"
                  >
                    {f.item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {STAGE_LABEL[f.filing.stage]} ·{' '}
                    {partyName[f.filing.authorityPartyId] ?? 'authority'} · serves “
                    {reqTitle[f.filing.requirementId] ?? 'a Requirement'}”
                    {f.filing.negativeOpen ? ` · ${f.filing.negativeOutcome?.toLowerCase()}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
