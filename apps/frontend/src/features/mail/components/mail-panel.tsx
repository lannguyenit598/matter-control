'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Alert } from '@/components/molecules/alert'
import { EmptyState } from '@/components/molecules/empty-state'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedInstant } from '@/components/molecules/localized-instant'
import { LocalizedText } from '@/components/molecules/localized-text'
import { useLocale } from '@/hooks/use-locale'
import { callMcAction, type McActionResult } from '@/lib/mc/action-result'
import { newIdempotencyKey } from '@/lib/mc/idempotency'

import { uploadEmlAction, type MailUploadOutcome } from '../actions'
import { isEmlFile, MAX_EML_BYTES, type MailItem } from '../schemas'

type UploadState =
  | { kind: 'idle' }
  | { kind: 'done'; documentId: string; mailId: string; replayed: boolean }
  | { kind: 'failed'; result: Extract<McActionResult, { ok: false }> }

/**
 * Email capture on the matter Documents page: one .eml upload becomes an immutable document
 * version, and the captured rows below read from the same matter. The key is minted per selected
 * file and reused for every retry of that same selection; a different file is a new intent.
 */
export function MailPanel({ matterId, items }: { matterId: string; items: MailItem[] }) {
  const locale = useLocale()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [key, setKey] = useState(() => newIdempotencyKey())
  const [clientError, setClientError] = useState<string | null>(null)
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const [pending, start] = useTransition()

  function pick(chosen: File | null) {
    setFile(chosen)
    setClientError(null)
    setState({ kind: 'idle' })
    // A different file is a different intent, so it gets a different key even after a failure.
    setKey(newIdempotencyKey())
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    if (!isEmlFile(file)) {
      setClientError(locale === 'vi' ? 'Chỉ nhận tệp .eml.' : 'Only .eml files are accepted.')
      return
    }
    if (file.size > MAX_EML_BYTES) {
      setClientError(
        locale === 'vi'
          ? 'Tệp lớn hơn giới hạn 25 MiB.'
          : 'That file is larger than the 25 MiB limit.',
      )
      return
    }
    const form = new FormData()
    form.set('file', file)
    form.set('direction', 'INBOUND')
    start(async () => {
      const r: MailUploadOutcome = await callMcAction(() => uploadEmlAction(matterId, form, key), {
        receipted: true,
      })
      if (r.ok) {
        setState({
          kind: 'done',
          documentId: r.documentId ?? '',
          mailId: r.mailId ?? '',
          replayed: r.replayed === true,
        })
        setFile(null)
        setKey(newIdempotencyKey())
        formRef.current?.reset()
        router.refresh()
        return
      }
      setState({ kind: 'failed', result: r })
      // An unknown outcome keeps the key: retrying the same file resends the same receipted request.
      if (!r.retrySameKey) setKey(newIdempotencyKey())
    })
  }

  const captured = state.kind === 'done' ? items.find((m) => m.id === state.mailId) : undefined

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        aria-label={locale === 'vi' ? 'Ghi nhận email' : 'Email capture'}
        className="flex flex-col gap-3"
      >
        <FormField
          label={<LocalizedText en="Email file (.eml)" vi="Tệp email (.eml)" />}
          required
          hint={
            <LocalizedText
              en="The .eml becomes an immutable document version; direction is recorded as inbound."
              vi="Tệp .eml tạo một phiên bản tài liệu bất biến; hướng thư được ghi nhận là thư đến."
            />
          }
          error={clientError ?? undefined}
        >
          {(c) => (
            <Input
              type="file"
              name="file"
              accept=".eml"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
              {...c}
            />
          )}
        </FormField>
        <div>
          <Button type="submit" loading={pending} disabled={!file}>
            <LocalizedText en="Upload" vi="Tải lên" />
          </Button>
        </div>
      </form>
      {state.kind === 'done' && (
        <p role="status" className="text-sm">
          {state.replayed ? (
            <LocalizedText
              en="This message had already been stored."
              vi="Email này đã được lưu trước đó."
            />
          ) : (
            <LocalizedText en="Captured." vi="Đã ghi nhận." />
          )}{' '}
          {captured && <>“{captured.subject}” </>}
          {state.documentId && (
            <Link href={`/matters/${matterId}/documents/${state.documentId}`} className="underline">
              <LocalizedText en="Open the document" vi="Mở tài liệu" />
            </Link>
          )}
        </p>
      )}
      {state.kind === 'failed' && (
        <Alert
          variant="destructive"
          title={
            state.result.kind === 'outcome-unknown' ? (
              <LocalizedText en="Outcome not confirmed" vi="Chưa xác nhận được kết quả" />
            ) : (
              <LocalizedText en="Upload failed" vi="Tải lên thất bại" />
            )
          }
        >
          {state.result.error}
        </Alert>
      )}
      {items.length === 0 ? (
        <EmptyState
          titleAs="h3"
          className="py-8"
          title={<LocalizedText en="No captured email yet" vi="Chưa ghi nhận email nào" />}
          description={
            <LocalizedText
              en="Upload a .eml file to keep the message and its attachments inside this Matter."
              vi="Tải lên tệp .eml để lưu thư và tệp đính kèm của nó trong hồ sơ này."
            />
          }
        />
      ) : (
        <ul
          className="flex flex-col divide-y"
          aria-label={locale === 'vi' ? 'Email đã ghi nhận' : 'Captured email'}
        >
          {items.map((m) => (
            <MailRow key={m.id} matterId={matterId} item={m} />
          ))}
        </ul>
      )}
    </div>
  )
}

/** One captured message: links to the document version it created, excerpt stays one line. */
function MailRow({ matterId, item }: { matterId: string; item: MailItem }) {
  const locale = useLocale()
  // Truncated recipients: the first few plus a count, so a long thread never breaks the row.
  const shown = item.recipients.slice(0, 3).join(', ')
  const rest = item.recipients.length - Math.min(item.recipients.length, 3)
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={`/matters/${matterId}/documents/${item.documentId}`}
          className="text-sm font-medium break-words underline underline-offset-2"
        >
          {item.subject}
        </Link>
        <span className="text-xs break-words text-muted-foreground">
          {item.sender}
          {item.recipients.length > 0 && (
            <>
              {' → '}
              {shown}
              {rest > 0 && <> +{rest}</>}
            </>
          )}
        </span>
        {item.excerpt && (
          <span className="max-w-prose truncate text-xs text-muted-foreground">{item.excerpt}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={item.direction === 'INBOUND' ? 'neutral' : 'outline'}>
          {locale === 'vi'
            ? item.direction === 'INBOUND'
              ? 'Thư đến'
              : 'Thư đi'
            : item.direction === 'INBOUND'
              ? 'Inbound'
              : 'Outbound'}
        </Badge>
        <LocalizedInstant iso={item.sentAt} className="text-xs text-muted-foreground" />
      </div>
    </li>
  )
}
