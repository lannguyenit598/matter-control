import { connection } from 'next/server'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { TermSheetPanel } from '@/features/term-sheet/components/term-sheet-panel'
import { termSheetRepository } from '@/features/term-sheet/repository'
import { toSheetLine } from '@/features/term-sheet/schemas'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'
import { pageMetadata } from '@/lib/page-metadata'

export const generateMetadata = pageMetadata('Term sheet', 'Bảng điều khoản')

export default function TermSheetPage({ params }: PageProps<'/matters/[matterId]/term-sheet'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <TermSheet params={params} />
    </Suspense>
  )
}

async function TermSheet({ params }: Pick<PageProps<'/matters/[matterId]/term-sheet'>, 'params'>) {
  const { matterId } = await params
  await connection()
  const here = `/matters/${matterId}/term-sheet`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, sheet] = await Promise.all([
      matterRepository.get(matterId),
      termSheetRepository.list(matterId),
    ])
    return { matter: matter.matter, sheet }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} />
  // Serialize only the client projection: matter id travels once as a prop, never per line.
  const lines = read.value.sheet.items.map(toSheetLine)
  const canEdit =
    read.value.matter.callerRole === 'OWNER' || read.value.matter.callerRole === 'EDITOR'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Term sheet"
        description="Structured facts imported from the contract's term sheet; promote a fact to draft the record that operationalizes it."
      />
      <Card>
        <CardHeader>
          <CardTitle>Contract term lines</CardTitle>
          <CardDescription>
            A term line is a fact, never an obligation: promoting it creates a draft that completes
            and verifies nothing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TermSheetPanel
            matterId={matterId}
            matterRevision={read.value.sheet.matterRevision}
            canEdit={canEdit}
            lines={lines}
          />
        </CardContent>
      </Card>
    </div>
  )
}
