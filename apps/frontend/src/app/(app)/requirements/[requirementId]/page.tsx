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
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => requirementRepository.get(requirementId))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="requirement" />
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
