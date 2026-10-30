import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Rows2, Rows3 } from 'lucide-react'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { buttonVariants } from '@/components/atoms/button'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { CreateRequirementForm } from '@/features/requirements/components/create-requirement-form'
import { CreateActionForm } from '@/features/work/components/create-action-form'
import { WorkFilters } from '@/features/work/components/work-filters'
import { WorkGrid } from '@/features/work/components/work-grid'
import { AddWorkDialog } from '@/features/work/components/add-work-dialog'
import { workRepository } from '@/features/work/repository'
import { gridQuerySchema } from '@/features/work/schemas'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Work' }

export default function WorkPage({ params, searchParams }: PageProps<'/matters/[matterId]/work'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Work params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Work({
  params,
  searchParams,
}: Pick<PageProps<'/matters/[matterId]/work'>, 'params' | 'searchParams'>) {
  const { matterId } = await params
  const raw = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  // URL input is untrusted: invalid values fall back to "no filter" instead of erroring.
  const query = gridQuerySchema.parse({
    kind: first(raw.kind) || undefined,
    execution: first(raw.execution) || undefined,
    dependency: first(raw.dependency) || undefined,
    timing: first(raw.timing) || undefined,
    attention: first(raw.attention) || undefined,
    owner: first(raw.owner) || undefined,
    workstream: first(raw.workstream) || undefined,
    q: first(raw.q) || undefined,
    sort: first(raw.sort) || undefined,
    desc: first(raw.desc) || undefined,
    cursor: first(raw.cursor) || undefined,
  })
  const density = first(raw.density) === 'compact' ? 'compact' : 'comfortable'
  const base = `/matters/${matterId}/work`
  const here = (() => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(raw)) {
      const value = first(v)
      if (value) p.set(k, value)
    }
    const s = p.toString()
    return s ? `${base}?${s}` : base
  })()
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />

  const read = await attempt(async () => {
    const [matter, members, workstreams, list] = await Promise.all([
      matterRepository.get(matterId),
      matterRepository.members(matterId),
      workRepository.workstreams(matterId),
      workRepository.list(matterId, query),
    ])
    return {
      matter: matter.matter,
      members: members.items,
      workstreams: workstreams.items,
      ...list,
    }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, members, workstreams, page, asOf } = read.value
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'

  const withParam = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(raw)) {
      const value = first(v)
      if (value) p.set(k, value)
    }
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) p.delete(k)
      else p.set(k, v)
    }
    const s = p.toString()
    return s ? `${base}?${s}` : base
  }
  const filtered = Boolean(
    query.kind ||
    query.execution ||
    query.dependency ||
    query.timing ||
    query.attention ||
    query.owner ||
    query.workstream ||
    query.q,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={asOf ? `Work items, read at ${asOf}` : 'Work items'}
        actions={
          canEdit && (
            <AddWorkDialog
              actionForm={<CreateActionForm matterId={matterId} />}
              requirementForm={<CreateRequirementForm matterId={matterId} />}
            />
          )
        }
      />
      <WorkFilters
        key={here}
        basePath={base}
        query={query}
        workstreams={workstreams}
        members={members}
        density={density}
      />
      <div
        className="flex flex-wrap items-center gap-2 text-xs"
        role="group"
        aria-labelledby="work-density-label"
      >
        <span id="work-density-label" className="text-muted-foreground">
          <LocalizedText en="Density:" vi="Mật độ:" />
        </span>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['comfortable', 'compact'] as const).map((d) => (
            <Link
              key={d}
              href={withParam({ density: d === 'comfortable' ? undefined : d })}
              scroll={false}
              aria-current={density === d ? 'true' : undefined}
              className={buttonVariants({
                variant: density === d ? 'outline' : 'ghost',
                size: 'sm',
              })}
            >
              {d === 'comfortable' ? <Rows2 aria-hidden /> : <Rows3 aria-hidden />}
              {d === 'comfortable' ? (
                <LocalizedText en="Comfortable" vi="Thoáng" />
              ) : (
                <LocalizedText en="Compact" vi="Gọn" />
              )}
            </Link>
          ))}
        </div>
      </div>
      <WorkGrid
        matterId={matterId}
        items={page.items}
        total={page.page.total}
        canEdit={canEdit}
        members={members}
        workstreams={workstreams}
        here={here}
        density={density}
        filtered={filtered}
        nextHref={page.page.nextCursor ? withParam({ cursor: page.page.nextCursor }) : null}
      />
      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="You can read the work in this matter but not change it."
            vi="Bạn được xem nhưng không được sửa công việc trong hồ sơ này."
          />
        </p>
      )}
    </div>
  )
}
