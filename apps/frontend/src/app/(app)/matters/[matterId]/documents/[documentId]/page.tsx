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
import {
  PromoteForm,
  SignatureDialog,
  UploadVersionDialog,
} from '@/features/proof/components/document-forms'
import { formatBytes } from '@/features/proof/labels'
import { proofRepository } from '@/features/proof/repository'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

export const metadata: Metadata = { title: 'Document' }

type Props = PageProps<'/matters/[matterId]/documents/[documentId]'>

export default function DocumentPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DocumentView params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function DocumentView({ params, searchParams }: Pick<Props, 'params' | 'searchParams'>) {
  const { matterId, documentId } = await params
  const raw = await searchParams
  const promoteRaw = Array.isArray(raw.promoteTo) ? raw.promoteTo[0] : raw.promoteTo
  const promoteTo = promoteRaw && /^[A-Za-z0-9_-]{1,100}$/.test(promoteRaw) ? promoteRaw : undefined
  const here = `/matters/${matterId}/documents/${documentId}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />

  const read = await attempt(async () => {
    const [matter, d] = await Promise.all([
      matterRepository.get(matterId),
      proofRepository.document(matterId, documentId, promoteTo),
    ])
    return { matter: matter.matter, ...d }
  })
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="document" />
  const { matter, detail, etag } = read.value
  const role = matter.callerRole
  const canEdit = role === 'OWNER' || role === 'EDITOR'
  const doc = detail.document
  const target = promoteTo ? detail.versions.find((v) => v.id === promoteTo) : undefined
  const impact = detail.promotionImpact

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/matters/${matterId}/documents`} className="text-sm underline">
        <LocalizedText en="← All documents" vi="← Tất cả tài liệu" />
      </Link>
      <PageHeader
        title={doc.name}
        description={`Read at ${detail.asOf}`}
        actions={
          canEdit && (
            <UploadVersionDialog matterId={matterId} documentId={doc.id} documentName={doc.name} />
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <LocalizedText en="Versions" vi="Các phiên bản" />
          </CardTitle>
          <CardDescription>
            <LocalizedText
              en="“Current” is an explicit decision by an owner, never the most recent upload."
              vi="Phiên bản hiện hành do chủ sở hữu quyết định rõ ràng, không tự động là bản tải lên mới nhất."
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <LocalizedText en="No versions yet." vi="Chưa có phiên bản." />
            </p>
          ) : (
            <ol className="flex flex-col divide-y">
              {[...detail.versions].reverse().map((v) => (
                <li key={v.id} className="flex flex-col gap-1 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      <LocalizedText en="Version" vi="Phiên bản" /> {v.no}
                      {v.current && ' · current'}
                    </span>
                    <span className="flex gap-3">
                      <a
                        href={`/api/matters/${matterId}/documents/${doc.id}/versions/${v.id}/content`}
                        className="underline"
                        download={v.filename}
                      >
                        <LocalizedText en="Download" vi="Tải xuống" />
                      </a>
                      {role === 'OWNER' && !v.current && (
                        <Link href={`${here}?promoteTo=${v.id}`} className="underline">
                          <LocalizedText en="Make current…" vi="Chọn làm hiện hành…" />
                        </Link>
                      )}
                    </span>
                  </div>
                  <p className="break-words text-muted-foreground">
                    {v.filename} · {v.mediaType} · {formatBytes(v.sizeBytes)} · uploaded{' '}
                    <LocalizedInstant iso={v.uploadedAt} />
                  </p>
                  <p className="font-mono text-xs break-all text-muted-foreground">
                    sha256 {v.sha256}
                  </p>
                  {detail.signatures
                    .filter((s) => s.versionId === v.id)
                    .map((s) => (
                      <p key={s.id}>
                        Signature observed: {s.signer} at <LocalizedInstant iso={s.signedAt} />
                      </p>
                    ))}
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-2">
                      <SignatureDialog
                        matterId={matterId}
                        versionId={v.id}
                        versionLabel={`Version ${v.no} · ${v.filename}`}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {role === 'OWNER' && target && impact && (
        <Card>
          <CardHeader>
            <CardTitle>Make version {target.no} current</CardTitle>
            <CardDescription>
              Replaces{' '}
              {doc.currentVersionId
                ? `version ${detail.versions.find((v) => v.id === doc.currentVersionId)?.no ?? '?'}`
                : 'no version'}
              . Nothing changes until you confirm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromoteForm
              matterId={matterId}
              detail={detail}
              etag={etag ?? ''}
              targetVersionId={target.id}
              invalidated={impact.invalidatedCriteria}
              unaffected={impact.unaffectedCriteria}
              titles={{}}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
