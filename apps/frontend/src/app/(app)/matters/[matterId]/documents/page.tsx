import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Skeleton } from '@/components/atoms/skeleton'
import { PageHeader } from '@/components/molecules/page-header'
import { ReadFailure } from '@/components/organisms/read-failure'
import { matterRepository } from '@/features/matters/repository'
import { CreateDocumentForm } from '@/features/proof/components/document-forms'
import { proofRepository } from '@/features/proof/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Documents' }

export default function DocumentsPage({ params }: PageProps<'/matters/[matterId]/documents'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Documents params={params} />
    </Suspense>
  )
}

async function Documents({ params }: Pick<PageProps<'/matters/[matterId]/documents'>, 'params'>) {
  const { matterId } = await params
  const here = `/matters/${matterId}/documents`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(async () => {
    const [matter, docs] = await Promise.all([
      matterRepository.get(matterId),
      proofRepository.documents(matterId),
    ])
    return { matter: matter.matter, docs: docs.items }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, docs } = read.value
  const canEdit = matter.callerRole === 'OWNER' || matter.callerRole === 'EDITOR'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={matter.title}
        description={
          <LocalizedText en="Documents and their versions" vi="Tài liệu và các phiên bản" />
        }
        actions={canEdit && <CreateDocumentForm matterId={matterId} matterTitle={matter.title} />}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="Documents" vi="Tài liệu" />
          </CardTitle>
          <CardDescription>
            <LocalizedText
              en="Every upload is an immutable version. Only an owner makes a version current."
              vi="Mỗi lần tải lên tạo một phiên bản bất biến. Chỉ chủ sở hữu được chọn phiên bản hiện hành."
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LocalizedText en="No documents yet." vi="Chưa có tài liệu." />{' '}
              {canEdit && (
                <LocalizedText
                  en="Use New document at the top of the page."
                  vi="Dùng nút Tài liệu mới ở đầu trang."
                />
              )}
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`/matters/${matterId}/documents/${d.id}`} className="underline">
                    {d.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {d.currentVersionId ? 'Has a current version' : 'No current version'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
