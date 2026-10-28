'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'
import { IntentForm } from '@/components/organisms/intent-form'
import { MESSAGES, type McActionResult } from '@/lib/mc/action-result'
import { newIdempotencyKey } from '@/lib/mc/idempotency'

import { createDocumentAction, promoteVersionAction, recordSignatureAction } from '../actions'
import type { DocumentDetail } from '../schemas'

export function CreateDocumentForm({ matterId }: { matterId: string }) {
  return (
    <IntentForm
      receipted
      draftKey={`matter:${matterId}:new-document`}
      submitLabel={<LocalizedText en="Create document" vi="Tạo tài liệu" />}
      run={(v, key) => createDocumentAction({ matterId, idempotencyKey: key, name: v.name ?? '' })}
    >
      {({ errors }) => (
        <FormField
          label={<LocalizedText en="Document name" vi="Tên tài liệu" />}
          required
          error={errors.name?.[0]}
        >
          {(c) => <Input name="name" maxLength={200} autoComplete="off" {...c} />}
        </FormField>
      )}
    </IntentForm>
  )
}

type UploadState =
  | { kind: 'idle' }
  | { kind: 'done'; replayed: boolean }
  | { kind: 'failed'; result: Extract<McActionResult, { ok: false }> }

/**
 * Uploads one file as the next version. The bytes go straight to the same-origin upload route
 * (never through a Server Action) with an idempotency key that stays the same for every retry of
 * this selection: an interrupted request is UNKNOWN, retrying with the same key either replays the
 * stored version or stores it once. A new file mints a new key.
 */
export function UploadVersionForm({
  matterId,
  documentId,
}: {
  matterId: string
  documentId: string
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [key, setKey] = useState(() => newIdempotencyKey())
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const [pending, start] = useTransition()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    start(async () => {
      try {
        const res = await fetch(`/api/matters/${matterId}/documents/${documentId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'Idempotency-Key': key,
            'X-Filename': encodeURIComponent(file.name),
          },
          body: file,
        })
        const json = (await res.json().catch(() => null)) as McActionResult | null
        if (res.ok && json?.ok) {
          setState({ kind: 'done', replayed: json.replayed === true })
          setFile(null)
          setKey(newIdempotencyKey())
          router.refresh()
          return
        }
        if (json && !json.ok) return setState({ kind: 'failed', result: json })
        // A 2xx or 5xx whose body is unusable may have committed: unknown, same key is safe.
        setState({
          kind: 'failed',
          result: {
            ok: false,
            kind: 'outcome-unknown',
            error: MESSAGES['outcome-unknown'],
            retrySameKey: true,
          },
        })
      } catch {
        setState({
          kind: 'failed',
          result: {
            ok: false,
            kind: 'outcome-unknown',
            error: MESSAGES['outcome-unknown'],
            retrySameKey: true,
          },
        })
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" aria-label="Upload a new version">
      <FormField
        label={<LocalizedText en="File" vi="Tệp" />}
        required
        hint={
          <LocalizedText
            en="Becomes the next version. It does not become current by being uploaded."
            vi="Tạo phiên bản tiếp theo. Việc tải lên không tự chọn làm hiện hành."
          />
        }
      >
        {(c) => (
          <Input
            type="file"
            name="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setKey(newIdempotencyKey()) // a different file is a different intent
              setState({ kind: 'idle' })
            }}
            {...c}
          />
        )}
      </FormField>
      <div>
        <Button type="submit" loading={pending} disabled={!file}>
          {state.kind === 'failed' && state.result.retrySameKey ? 'Retry upload' : 'Upload version'}
        </Button>
      </div>
      {state.kind === 'done' && (
        <p role="status" className="text-sm">
          {state.replayed ? 'This file had already been stored.' : 'Version stored.'}
        </p>
      )}
      {state.kind === 'failed' && (
        <Alert
          variant="destructive"
          title={
            state.result.kind === 'outcome-unknown' ? 'Outcome not confirmed' : 'Upload failed'
          }
        >
          {state.result.error}
        </Alert>
      )}
    </form>
  )
}

/**
 * Promotion of one exact version to current. The caller must state the current version it saw, a
 * reason, and acknowledge the impact that was computed for exactly this target; a changed document
 * makes the API refuse, so a stale screen can never promote.
 */
export function PromoteForm({
  matterId,
  detail,
  etag,
  targetVersionId,
  invalidated,
  unaffected,
  titles,
}: {
  matterId: string
  detail: DocumentDetail
  etag: string
  targetVersionId: string
  invalidated: string[]
  unaffected: string[]
  titles: Record<string, string>
}) {
  const doc = detail.document
  const token = detail.promotionImpact?.token ?? ''
  return (
    <IntentForm
      receipted={false}
      draftKey={`document:${doc.id}:promote:${targetVersionId}`}
      submitLabel={
        <LocalizedText en="Make this the current version" vi="Chọn phiên bản này làm hiện hành" />
      }
      run={(v) =>
        promoteVersionAction({
          matterId,
          documentId: doc.id,
          ifMatch: etag,
          targetVersionId,
          expectedCurrentVersionId: doc.currentVersionId ?? '',
          impactToken: token,
          acknowledged: v.acknowledged ?? '',
          reason: v.reason ?? '',
        })
      }
    >
      {({ errors }) => (
        <>
          <div className="text-sm">
            <p className="font-medium">
              <LocalizedText en="Impact of this promotion" vi="Ảnh hưởng của việc chọn phiên bản" />
            </p>
            <ul className="list-disc pl-5">
              <li>
                {invalidated.length === 0
                  ? 'No accepted proof depends on the current version.'
                  : `Proof that needs the current version is invalidated until reviewed again: ${invalidated.map((i) => titles[i] ?? i.slice(0, 8)).join(', ')}.`}
              </li>
              {unaffected.length > 0 && (
                <li>
                  <LocalizedText
                    en="Fixed-version criteria stay as they are:"
                    vi="Tiêu chí gắn với phiên bản cố định giữ nguyên:"
                  />{' '}
                  {unaffected.map((i) => titles[i] ?? i.slice(0, 8)).join(', ')}.
                </li>
              )}
            </ul>
          </div>
          <FormField
            label={<LocalizedText en="Reason" vi="Lý do" />}
            required
            error={errors.reason?.[0]}
          >
            {(c) => <Textarea name="reason" rows={2} maxLength={2000} {...c} />}
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="acknowledged" value="yes" className="size-4" />
            <LocalizedText en="I have read this impact" vi="Tôi đã đọc các ảnh hưởng này" />
          </label>
          {errors.acknowledged?.[0] && (
            <p role="alert" className="text-sm text-destructive">
              {errors.acknowledged[0]}
            </p>
          )}
        </>
      )}
    </IntentForm>
  )
}

export function SignatureForm({ matterId, versionId }: { matterId: string; versionId: string }) {
  return (
    <IntentForm
      receipted={false}
      draftKey={`version:${versionId}:signature`}
      submitLabel={<LocalizedText en="Record signature" vi="Ghi nhận chữ ký" />}
      run={(v) =>
        recordSignatureAction({
          matterId,
          versionId,
          signer: v.signer ?? '',
          signedAt: v.signedAt ? new Date(v.signedAt).toISOString() : '',
        })
      }
    >
      {({ errors }) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label={<LocalizedText en="Signer" vi="Người ký" />}
            required
            error={errors.signer?.[0]}
          >
            {(c) => <Input name="signer" maxLength={200} autoComplete="off" {...c} />}
          </FormField>
          <FormField
            label={<LocalizedText en="Observed signed at" vi="Thời điểm ký được ghi nhận" />}
            required
            error={errors.signedAt?.[0]}
          >
            {(c) => <Input type="datetime-local" name="signedAt" {...c} />}
          </FormField>
        </div>
      )}
    </IntentForm>
  )
}
