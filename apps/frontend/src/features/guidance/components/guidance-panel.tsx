'use client'

import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { EmptyState } from '@/components/molecules/empty-state'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { IntentForm } from '@/components/organisms/intent-form'

import { addGuidanceDraftAction, createGuidanceAction, publishGuidanceAction } from '../actions'
import type { GuidanceDoc } from '../schemas'

/**
 * Matter guidance (RLF-07): OWNER/EDITOR append drafts; only the matter OWNER publishes an
 * immutable revision. Guidance is readable text with attributable references — it never
 * satisfies a criterion and never changes legal state, and it never leaves its Matter.
 */
export function GuidancePanel({
  matterId,
  docs,
  canDraft,
  canPublish,
}: {
  matterId: string
  docs: GuidanceDoc[]
  canDraft: boolean
  canPublish: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      {docs.length === 0 ? (
        <EmptyState
          title={<LocalizedText en="No guidance yet" vi="Chưa có hướng dẫn nào" />}
          description={
            <LocalizedText
              en="Drafts stay inside this Matter; a published revision is immutable and readable by every member."
              vi="Bản nháp chỉ nằm trong hồ sơ này; phiên bản đã công bố là bất biến và mọi thành viên đều đọc được."
            />
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {docs.map((d) => (
            <GuidanceDocRow
              key={d.id}
              matterId={matterId}
              doc={d}
              canDraft={canDraft}
              canPublish={canPublish}
            />
          ))}
        </ul>
      )}
      {canDraft && (
        <section
          aria-label="New guidance"
          className="flex flex-col gap-3 rounded-lg border bg-card p-3"
        >
          <h3 className="text-sm font-semibold">
            <LocalizedText en="New guidance" vi="Hướng dẫn mới" />
          </h3>
          <IntentForm
            receipted
            draftKey={`guidance:${matterId}:new`}
            submitLabel={<LocalizedText en="Create draft" vi="Tạo bản nháp" />}
            run={(v, key) =>
              createGuidanceAction({
                matterId,
                idempotencyKey: key,
                title: v.title ?? '',
                body: v.body ?? '',
              })
            }
          >
            {({ errors }) => (
              <>
                <FormField
                  label={<LocalizedText en="Title" vi="Tiêu đề" />}
                  required
                  error={errors.title?.[0]}
                >
                  {(c) => <Input name="title" maxLength={300} autoComplete="off" {...c} />}
                </FormField>
                <FormField
                  label={<LocalizedText en="Guidance text" vi="Nội dung hướng dẫn" />}
                  required
                  error={errors.body?.[0]}
                >
                  {(c) => <Textarea name="body" rows={4} maxLength={20000} {...c} />}
                </FormField>
              </>
            )}
          </IntentForm>
        </section>
      )}
    </div>
  )
}

function GuidanceDocRow({
  matterId,
  doc,
  canDraft,
  canPublish,
}: {
  matterId: string
  doc: GuidanceDoc
  canDraft: boolean
  canPublish: boolean
}) {
  const [drafting, setDrafting] = useState(false)
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold break-words">{doc.title}</span>
        <Badge variant="outline">
          {doc.revisions.length} <LocalizedText en="revisions" vi="phiên bản" />
        </Badge>
      </div>
      <ol className="flex flex-col gap-2">
        {doc.revisions.map((r) => (
          <li key={r.id} className="flex flex-col gap-1 rounded-md border px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                v{r.no} · <LocalizedInstant iso={r.createdAt} />
              </span>
              <Badge variant={r.status === 'PUBLISHED' ? 'timing' : 'outline'}>
                {r.status === 'PUBLISHED' ? (
                  <LocalizedText en="Published" vi="Đã công bố" />
                ) : (
                  <LocalizedText en="Draft" vi="Bản nháp" />
                )}
              </Badge>
            </div>
            <p className="text-sm break-words whitespace-pre-wrap">{r.body}</p>
            {r.sourceRefs.length > 0 && (
              <p className="text-xs break-words text-muted-foreground">
                <LocalizedText en="References" vi="Tham chiếu" />:{' '}
                {r.sourceRefs.map((x) => x.reference || x.note || 'document version').join('; ')}
              </p>
            )}
            {canPublish && r.status === 'DRAFT' && (
              <IntentForm
                receipted
                draftKey={`guidance-pub:${r.id}`}
                submitLabel={<LocalizedText en={`Publish v${r.no}`} vi={`Công bố v${r.no}`} />}
                run={(_v, key) =>
                  publishGuidanceAction({
                    matterId,
                    documentId: doc.id,
                    revisionId: r.id,
                    idempotencyKey: key,
                  })
                }
              >
                {() => null}
              </IntentForm>
            )}
          </li>
        ))}
      </ol>
      {canDraft && !drafting && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setDrafting(true)}
        >
          <LocalizedText en="Add draft" vi="Thêm bản nháp" />
        </Button>
      )}
      {drafting && (
        <IntentForm
          receipted
          draftKey={`guidance-draft:${doc.id}`}
          submitLabel={<LocalizedText en="Append draft" vi="Lưu bản nháp" />}
          run={(v, key) =>
            addGuidanceDraftAction({
              matterId,
              documentId: doc.id,
              idempotencyKey: key,
              body: v.body ?? '',
            })
          }
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="New draft text" vi="Nội dung bản nháp mới" />}
              required
              error={errors.body?.[0]}
            >
              {(c) => <Textarea name="body" rows={3} maxLength={20000} {...c} />}
            </FormField>
          )}
        </IntentForm>
      )}
    </li>
  )
}
