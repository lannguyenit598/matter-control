'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'

import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'
import { callMcAction, MESSAGES, type McActionResult } from '@/lib/mc/action-result'
import type { McRejection } from '@/lib/mc/errors'
import {
  clearAttempt,
  clearDraft,
  loadDraft,
  saveAttempt,
  saveDraft,
  type DraftValues,
} from '@/lib/mc/drafts'
import { newIdempotencyKey } from '@/lib/mc/idempotency'
import { usePendingAttempt } from '@/lib/mc/use-attempt'

import { useDraftNamespace } from './draft-scope'

export type IntentFormProps = {
  submitLabel: ReactNode
  /**
   * Whether the command is receipted (creation sent with an idempotency key, contract §2.1).
   * Only a receipted command may be retried with the same key after an unknown outcome. A
   * CAS-only command (membership grant) is never resent: it must be re-read first.
   */
  receipted: boolean
  /**
   * Scope + intent under which the entered values are kept across navigation (for example
   * `matter:<id>:new-action`). Omit to keep nothing. The per-session namespace is added for you.
   */
  draftKey?: string
  /** Runs the Server Action. `key` is stable for this intent and changes only after success. */
  run: (values: Record<string, string>, key: string) => Promise<McActionResult>
  /** Fields. Receives per-field server errors keyed by field name. */
  children: (ctx: { errors: Record<string, string[] | undefined>; pending: boolean }) => ReactNode
  /**
   * Renders the details of a domain rejection (why, failed gates, cycle path, alternatives).
   * Supplied by the feature that knows the domain wording; without it only the summary shows.
   */
  renderRejection?: (rejection: McRejection) => ReactNode
  /** Called after a successful save, e.g. to navigate to the created record. */
  onSuccess?: (result: Extract<McActionResult, { ok: true }>) => void
  className?: string
}

/** What a form shows after a reload when its create may or may not have landed. */
const RESTORED_UNKNOWN: Extract<McActionResult, { ok: false }> = {
  ok: false,
  kind: 'outcome-unknown',
  error: MESSAGES['outcome-unknown'],
  retrySameKey: true,
}

/**
 * One form = one user intent = one idempotency key. A retry after an unknown outcome reuses the
 * key (the server replays or reconciles, never double-applies); a new key is minted only after
 * success. Each failure kind offers its own recovery instead of one generic error.
 */
export function IntentForm({
  submitLabel,
  receipted,
  draftKey,
  run,
  children,
  renderRejection,
  onSuccess,
  className,
}: IntentFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [ownKey, setOwnKey] = useState(() => newIdempotencyKey())
  const [result, setResult] = useState<McActionResult | null>(null)
  const [pending, start] = useTransition()
  const [attempt, setAttempt] = useState(0)
  // The exact payload of an attempt whose outcome is unknown. A same-key retry sends THIS, not
  // whatever the fields say now: the key identifies one request, and the server would refuse
  // (422) a different body under it.
  const frozen = useRef<Record<string, string> | null>(null)

  const namespace = useDraftNamespace()
  const draftsOn = namespace !== null && draftKey !== undefined
  // A receipted create whose answer was lost before a reload: the stored attempt carries the same
  // key and the exact values, so the one safe recovery (same request, same key) is still the only
  // one offered. It is read from storage, not copied into state, so it can never go stale.
  const pendingAttempt = usePendingAttempt(receipted ? namespace : null, draftKey)
  const key = pendingAttempt?.key ?? ownKey
  const dropDraft = () => {
    if (!draftsOn) return
    clearDraft(namespace, draftKey)
    clearAttempt(namespace, draftKey)
  }

  // Restore a kept draft once, after mount, into the uncontrolled fields.
  useEffect(() => {
    if (!draftsOn) return
    const draft = loadDraft(namespace, draftKey)
    const form = formRef.current
    if (draft && form) applyValues(form, draft)
    // only when the identity or scope changes: never overwrite what the user is typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, draftKey])

  const shown = result ?? (pendingAttempt ? RESTORED_UNKNOWN : null)
  const failure = shown && !shown.ok ? shown : null
  const retrying = failure?.retrySameKey === true
  // A CAS-only command with an unknown outcome is blocked until the state is re-read.
  const blocked = failure?.requiresReread === true

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (blocked) return // the handler enforces it, not only the disabled button
    const sent = frozen.current ?? pendingAttempt?.values ?? null
    const values = retrying && sent ? sent : readValues(event.currentTarget)
    start(async () => {
      const r = await callMcAction(() => run(values, key), { receipted })
      setResult(r)
      setAttempt((n) => n + 1)
      if (
        !r.ok &&
        (r.kind === 'unauthenticated' || r.kind === 'forbidden' || r.kind === 'not-found')
      ) {
        // The right to see this ended: do not keep (or later revive) what was typed for it.
        dropDraft()
      }
      if (r.ok) {
        dropDraft()
        frozen.current = null
        setOwnKey(newIdempotencyKey())
        formRef.current?.reset()
        router.refresh()
        onSuccess?.(r)
      } else if (r.kind === 'outcome-unknown' && r.retrySameKey) {
        frozen.current = values
        if (draftsOn) saveAttempt(namespace, draftKey, { key, values })
      } else {
        frozen.current = null
        if (draftsOn) clearAttempt(namespace, draftKey)
      }
    })
  }

  /** Re-read current state with the caller's own rights, then allow a NEW intent. */
  function reread() {
    start(() => {
      router.refresh()
    })
    setResult(null)
  }

  /** Abandon an unconfirmed receipted request and start a different intent with a new key. */
  function discard() {
    dropDraft()
    frozen.current = null
    setOwnKey(newIdempotencyKey())
    setResult(null)
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onInput={(event) => {
        if (draftsOn) saveDraft(namespace, draftKey, readValues(event.currentTarget))
      }}
      className={className ?? 'flex flex-col gap-4'}
      noValidate
    >
      {children({ errors: failure?.fieldErrors ?? {}, pending })}
      {failure && (
        <Alert key={attempt} variant="destructive" title={titleFor(failure.kind)}>
          {failure.error}
          {failure.rejection && renderRejection?.(failure.rejection)}
          {failure.kind === 'unauthenticated' && (
            <>
              {' '}
              <Link className="underline" href="/login">
                <LocalizedText en="Sign in" vi="Đăng nhập" />
              </Link>
            </>
          )}
          {failure.kind === 'stale' && (
            <>
              {' '}
              <button type="button" className="underline" onClick={() => router.refresh()}>
                <LocalizedText en="Reload" vi="Tải lại" />
              </button>
            </>
          )}
        </Alert>
      )}
      {result?.ok && (
        <Alert key={attempt}>
          {result.replayed ? (
            <LocalizedText
              en="Already saved: this request had been recorded before."
              vi="Đã lưu: yêu cầu này đã được ghi nhận trước đó."
            />
          ) : (
            <LocalizedText en="Saved." vi="Đã lưu." />
          )}
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {blocked ? (
          <Button type="button" variant="outline" loading={pending} onClick={reread}>
            <LocalizedText en="Reload current state" vi="Đọc lại trạng thái hiện tại" />
          </Button>
        ) : (
          <Button type="submit" loading={pending}>
            {retrying ? (
              <LocalizedText
                en="Retry the same request (safe to send again)"
                vi="Thử lại đúng yêu cầu này (gửi lại an toàn)"
              />
            ) : (
              submitLabel
            )}
          </Button>
        )}
        {retrying && (
          <Button type="button" variant="ghost" disabled={pending} onClick={discard}>
            <LocalizedText
              en="Discard and start a different request"
              vi="Bỏ yêu cầu này và bắt đầu yêu cầu khác"
            />
          </Button>
        )}
      </div>
    </form>
  )
}

function titleFor(kind: Extract<McActionResult, { ok: false }>['kind']): ReactNode {
  switch (kind) {
    case 'outcome-unknown':
      return <LocalizedText en="Outcome not confirmed" vi="Chưa xác nhận được kết quả" />
    case 'stale':
      return <LocalizedText en="Out of date" vi="Dữ liệu đã cũ" />
    case 'unavailable':
      return <LocalizedText en="Service unavailable" vi="Dịch vụ chưa sẵn sàng" />
    case 'unauthenticated':
      return <LocalizedText en="Signed out" vi="Đã đăng xuất" />
    case 'forbidden':
      return <LocalizedText en="Not permitted" vi="Không có quyền" />
    case 'rejected':
      return <LocalizedText en="Not changed" vi="Không có thay đổi" />
    default:
      return <LocalizedText en="Could not save" vi="Không thể lưu" />
  }
}

/** Reads the form into name -> value; repeated names (checkbox sets) are comma-joined. */
function readValues(form: HTMLFormElement): DraftValues {
  const out: DraftValues = {}
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value !== 'string') continue
    out[name] = name in out ? `${out[name]},${value}` : value
  }
  return out
}

/** Writes a kept draft back into the named controls. */
function applyValues(form: HTMLFormElement, draft: DraftValues) {
  for (const [name, value] of Object.entries(draft)) {
    const nodes = form.elements.namedItem(name)
    if (!nodes) continue
    const list = nodes instanceof RadioNodeList ? Array.from(nodes) : [nodes]
    const picked = value.split(',')
    for (const node of list) {
      if (node instanceof HTMLInputElement && (node.type === 'checkbox' || node.type === 'radio')) {
        node.checked = picked.includes(node.value)
      } else if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLSelectElement
      ) {
        node.value = value
      }
    }
  }
}
