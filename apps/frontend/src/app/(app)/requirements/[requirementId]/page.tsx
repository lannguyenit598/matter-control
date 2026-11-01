import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { RequirementDetail } from '@/features/requirements/components/requirement-detail'
import { requirementRepository } from '@/features/requirements/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Requirement' }

export default function RequirementPage({ params }: PageProps<'/requirements/[requirementId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Requirement params={params} />
    </Suspense>
  )
}

async function Requirement({ params }: Pick<PageProps<'/requirements/[requirementId]'>, 'params'>) {
  const { requirementId } = await params
  const here = `/requirements/${requirementId}`
  // UX-L-05: the failure keeps the page's h1 — a breadcrumb of facts still known (the hub and
  // the raw id), never a stale scope label.
  const fallbackHeading = (
    <nav aria-label="Current scope" className="flex items-center gap-2 text-sm font-normal">
      <Link className="underline" href="/workspaces">
        <LocalizedText en="Workspaces" vi="Không gian làm việc" />
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-muted-foreground">{requirementId}</span>
    </nav>
  )
  if (!(await getSession()))
    return <ReadFailure kind="sign-in" retryHref={here} heading={fallbackHeading} />
  const read = await attempt(() => requirementRepository.get(requirementId))
  if (!read.ok)
    return (
      <ReadFailure
        kind={read.kind}
        retryHref={here}
        subject="requirement"
        heading={fallbackHeading}
      />
    )
  const { requirement, asOf } = read.value
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={requirement.title}
        description={asOf ? `Read at ${asOf}` : undefined}
        actions={
          <Link href={`/matters/${requirement.matterId}`} className="text-sm underline">
            <LocalizedText en="Back to matter" vi="Quay lại hồ sơ" />
          </Link>
        }
      />
      <RequirementDetail requirement={requirement} />
    </div>
  )
}
