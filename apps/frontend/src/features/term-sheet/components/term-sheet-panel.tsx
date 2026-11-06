'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { Button } from '@/components/atoms/button'
import { LocalizedText } from '@/components/molecules/localized-text'

import { useDraftNamespace } from '@/components/organisms/draft-scope'
import { useLocale } from '@/hooks/use-locale'
import { callMcAction, type McActionResult } from '@/lib/mc/action-result'
import { clearAttempt, saveAttempt, type PendingAttempt } from '@/lib/mc/drafts'
import { newIdempotencyKey } from '@/lib/mc/idempotency'
import { usePendingAttempt } from '@/lib/mc/use-attempt'

import { promoteTermLineAction, reconcileTermSheetImportAction } from '../actions'
import { TERM_FIELDS, type TermField, type TermSheetLine } from '../schemas'

/*
 * The panel reads what the API decided: every line shows its source pin (document version +
 * content hash) and its promotion link; nothing here invents readiness. vi labels are DRAFT
 * pending terminology R10 — they must be checked against the terminology table before merge.
 * Submission goes through the house transition pattern (useTransition covers BOTH the import
 * and the promote, so neither action can double-fire).
 */

const FIELD_LABEL: Record<TermField, { en: string; vi: string }> = {
  PARTY: { en: 'Party', vi: 'Bên' },
  EFFECTIVE_DATE: { en: 'Effective date', vi: 'Ngày hiệu lực' },
  RENEWAL_DATE: { en: 'Renewal date', vi: 'Ngày gia hạn' },
  NOTICE_PERIOD: { en: 'Notice period', vi: 'Thời hạn báo trước' },
  VALUE_AMOUNT: { en: 'Value', vi: 'Giá trị' },
  VALUE_CURRENCY: { en: 'Currency', vi: 'Tiền tệ' },
  GOVERNING_LAW: { en: 'Governing law', vi: 'Luật áp dụng' },
  NOTE: { en: 'Note', vi: 'Ghi chú' },
}

const PROMOTED_KIND: Record<string, { en: string; vi: string }> = {
  context_record: { en: 'Entity record', vi: 'Hồ sơ thực thể' },
  milestone: { en: 'Milestone', vi: 'Mốc' },
  action: { en: 'Action draft', vi: 'Nháp hành động' },
  requirement: { en: 'Requirement draft', vi: 'Nháp yêu cầu' },
}

function valueOf(line: TermSheetLine): string {
  if (line.valueText !== null) return line.valueText
  if (line.valueDate !== null) return line.valueDate.slice(0, 10)
  return '—'
}

const MAX_SHEET_BYTES = 5 * 1024 * 1024

export function TermSheetPanel({
  matterId,
  matterRevision,
  canEdit,
  lines,
}: {
  matterId: string
  matterRevision: number
  /** OWNER/EDITOR: the API refuses import and promotion to anyone else, so the UI hides them. */
  canEdit: boolean
  lines: TermSheetLine[]
}) {
  const [message, setMessage] = useState<{ en: string; vi: string } | null>(null)
  const [sourceVersion, setSourceVersion] = useState<string>()
  const [rowErrors, setRowErrors] = useState<Record<string, string[]>>({})
  const [target, setTarget] = useState<{ id: string; kind?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const namespace = useDraftNamespace()
  const scope = `matter:${matterId}:term-sheet`
  const stored = usePendingAttempt(namespace, scope)
  const [local, setLocal] = useState<{
    namespace: string | null
    scope: string
    attempt: PendingAttempt | null
  }>()
  const attempt = local?.namespace === namespace && local.scope === scope ? local.attempt : stored
  const router = useRouter()
  const locale = useLocale()

  function remember(next: PendingAttempt | null) {
    setLocal({ namespace, scope, attempt: next })
    if (!namespace) return
    if (next) saveAttempt(namespace, scope, next)
    else clearAttempt(namespace, scope)
  }

  function finish(result: McActionResult, isRetry: boolean) {
    // Keep the key whenever the earlier outcome may still be unknown. An expired session is
    // refused by the BFF before the API sees the retry, so it settles nothing; logout purges it.
    // A 403 on a RETRY only means the retry was refused — the first attempt may have committed.
    // A 403 on a FRESH send is a definitive refusal of that attempt, so its key can be cleared.
    const keepKey =
      !result.ok &&
      (['outcome-unknown', 'unavailable', 'error', 'unauthenticated'].includes(result.kind) ||
        (isRetry && result.kind === 'forbidden'))
    if (result.ok || !keepKey) remember(null)
    setRowErrors(result.ok ? {} : (result.fieldErrors ?? {}))
    // The revision or line this page holds is outdated: reload it so the next attempt can succeed.
    if (!result.ok && ['stale', 'not-found', 'key-conflict'].includes(result.kind)) router.refresh()
    if (!result.ok) {
      setMessage({
        en: result.error,
        vi: ['outcome-unknown', 'unavailable', 'error', 'unauthenticated'].includes(result.kind)
          ? 'Chưa xác nhận được kết quả. Hãy thử lại cùng yêu cầu.'
          : result.kind === 'stale'
            ? 'Dữ liệu đã thay đổi. Hãy tải lại rồi xác nhận lại.'
            : isRetry && result.kind === 'forbidden'
              ? 'Cần quyền ghi để xác nhận lại. Yêu cầu trước đó vẫn đang chờ kết quả.'
              : 'Yêu cầu bị từ chối. Hãy kiểm tra thông tin.',
      })
    }
  }

  function submitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || attempt?.values.kind === 'promote') return
    const form = event.currentTarget
    const input = new FormData(form)
    // Read the chosen file from the input's own FileList and send exactly that one.
    const file = (form.elements.namedItem('file') as HTMLInputElement | null)?.files?.[0]
    const version = String(input.get('documentVersionId') ?? '').trim()
    const format = file instanceof File ? file.name.split('.').at(-1)?.toLowerCase() : undefined
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > MAX_SHEET_BYTES ||
      !version ||
      (format !== 'csv' && format !== 'xlsx')
    ) {
      setMessage({
        en: 'Choose a CSV or XLSX file up to 5 MiB and enter its source version.',
        vi: 'Chọn file CSV hoặc XLSX tối đa 5 MiB và nhập phiên bản nguồn.',
      })
      return
    }
    startTransition(async () => {
      let digest: string
      try {
        digest = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
        )
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
      } catch {
        setMessage({
          en: 'The file could not be read. Select it again before submitting.',
          vi: 'Không đọc được file. Hãy chọn lại trước khi gửi.',
        })
        return
      }
      if (
        attempt &&
        (attempt.values.digest !== digest ||
          attempt.values.version !== version ||
          attempt.values.format !== format)
      ) {
        setMessage({
          en: 'Select the original file and source version to confirm the pending import.',
          vi: 'Chọn lại file và phiên bản nguồn ban đầu để xác nhận lượt nhập đang chờ.',
        })
        return
      }
      const isRetry = !!attempt
      const next = attempt ?? {
        key: newIdempotencyKey(),
        values: { kind: 'import', digest, version, format, revision: String(matterRevision) },
      }
      remember(next)
      input.set('file', file)
      input.set('documentVersionId', next.values.version!)
      input.set('format', next.values.format!)
      input.set('expectedRevision', next.values.revision!)
      const result = await callMcAction(
        async () => {
          const response = await fetch(`/api/matters/${matterId}/term-lines/import`, {
            method: 'POST',
            headers: { 'Idempotency-Key': next.key },
            body: input,
          })
          const data = (await response.json()) as McActionResult
          if (typeof data?.ok !== 'boolean' || data.ok !== response.ok)
            throw new Error('Invalid import response')
          return data
        },
        { receipted: true },
      )
      finish(result, isRetry)
      if (result.ok) {
        setMessage({
          en: 'Import completed; the list below shows the current facts.',
          vi: 'Nhập hoàn tất; danh sách dưới đây là các dữ kiện hiện tại.',
        })
        setSourceVersion('')
        form.reset()
        router.refresh()
      }
    })
  }

  function submitPromotion(next: PendingAttempt, isRetry: boolean) {
    if (pending) return
    startTransition(async () => {
      remember(next)
      const input = {
        matterId,
        termLineId: next.values.lineId!,
        expectedRevision: Number(next.values.revision),
        idempotencyKey: next.key,
      }
      let kind: string | undefined
      let missing = false
      const result = await callMcAction(
        async () => {
          const response = await promoteTermLineAction(input)
          kind = response.targetKind
          missing = response.targetMissing === true
          return response
        },
        { receipted: true },
      )
      finish(result, isRetry)
      if (result.ok && result.id) {
        setTarget(missing ? null : { id: result.id, kind })
        setMessage({
          en: missing
            ? 'The original draft is no longer present in this matter.'
            : 'Draft record confirmed.',
          vi: missing ? 'Bản nháp ban đầu không còn trong hồ sơ này.' : 'Đã xác nhận bản nháp.',
        })
        router.refresh()
      }
    })
  }

  // A lost import whose file is gone is settled from its receipt; the key is never dropped while
  // the outcome is unknown, so a new intent waits for this one.
  function checkImport(pendingAttempt: PendingAttempt) {
    startTransition(async () => {
      const result = (await callMcAction(
        () =>
          reconcileTermSheetImportAction({
            matterId,
            idempotencyKey: pendingAttempt.key,
            documentVersionId: pendingAttempt.values.version!,
          }),
        { receipted: true },
      )) as McActionResult & { created?: number; replaced?: number; unchanged?: number }
      finish(result, true)
      if (result.ok) {
        setMessage({
          en: `The earlier import was applied: ${result.created ?? 0} created, ${result.replaced ?? 0} replaced, ${result.unchanged ?? 0} unchanged.`,
          vi: `Lượt nhập trước đã được áp dụng: ${result.created ?? 0} tạo mới, ${result.replaced ?? 0} thay thế, ${result.unchanged ?? 0} giữ nguyên.`,
        })
        setSourceVersion('')
        router.refresh()
      }
    })
  }

  function promote(line: TermSheetLine) {
    if (pending || attempt) return
    if (
      !window.confirm(
        locale === 'vi'
          ? 'Tạo bản nháp từ dòng điều khoản này? Dữ kiện sẽ được giữ nguyên.'
          : 'Create a draft record from this term line? The fact itself stays unchanged.',
      )
    )
      return
    submitPromotion(
      {
        key: newIdempotencyKey(),
        values: { kind: 'promote', lineId: line.id, revision: String(line.revision) },
      },
      false,
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText
            en="You have read-only access: only owners and editors can import or promote term lines."
            vi="Bạn chỉ có quyền xem (read-only): chỉ chủ sở hữu và người chỉnh sửa mới nhập hoặc tạo bản nháp."
          />
        </p>
      )}
      {canEdit && (
        <section aria-labelledby="term-sheet-import" className="flex flex-col gap-3">
          <h3 id="term-sheet-import" className="text-sm font-semibold">
            <LocalizedText en="Import term sheet" vi="Nhập bảng điều khoản" />
          </h3>
          <form onSubmit={submitImport} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <LocalizedText en="Source document version id" vi="Mã phiên bản tài liệu nguồn" />
              <input
                name="documentVersionId"
                value={
                  sourceVersion ?? (attempt?.values.kind === 'import' ? attempt.values.version : '')
                }
                onChange={(event) => setSourceVersion(event.target.value)}
                required
                className="w-72 rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <LocalizedText en="Spreadsheet (CSV/XLSX)" vi="Bảng tính (CSV/XLSX)" />
              <input type="file" name="file" required accept=".csv,.xlsx" className="text-sm" />
            </label>
            <Button type="submit" disabled={pending || attempt?.values.kind === 'promote'}>
              {attempt?.values.kind === 'import' ? (
                <LocalizedText en="Confirm pending import" vi="Xác nhận lượt nhập đang chờ" />
              ) : (
                <LocalizedText en="Import" vi="Nhập" />
              )}
            </Button>
          </form>
        </section>
      )}

      {/* The live region stays mounted; only its content changes, so a screen reader announces. */}
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {message ? <LocalizedText en={message.en} vi={message.vi} /> : null}
      </p>

      {Object.keys(rowErrors).length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {Object.entries(rowErrors).map(([row, errors]) => (
            <li key={row}>
              {row}: {errors.join(' ')}
            </li>
          ))}
        </ul>
      )}
      {attempt && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            {attempt.values.kind === 'import' ? (
              <LocalizedText
                en="An earlier import has no confirmed outcome. Retry it with the same file, or check its result."
                vi="Lượt nhập trước chưa có kết quả xác nhận. Hãy thử lại với đúng file đó, hoặc kiểm tra kết quả."
              />
            ) : (
              <LocalizedText
                en="An earlier promotion has no confirmed outcome. Confirm it to replay the same request."
                vi="Lượt tạo bản nháp trước chưa có kết quả xác nhận. Hãy xác nhận để gửi lại đúng yêu cầu đó."
              />
            )}
          </p>
          {attempt.values.kind === 'promote' && canEdit && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => submitPromotion(attempt, true)}
            >
              <LocalizedText
                en="Confirm pending promotion"
                vi="Xác nhận lượt tạo bản nháp đang chờ"
              />
            </Button>
          )}
          {attempt.values.kind === 'promote' && !canEdit && (
            <p className="text-sm text-muted-foreground">
              <LocalizedText
                en="Write access is needed to confirm the pending promotion."
                vi="Cần quyền ghi để xác nhận lượt tạo bản nháp đang chờ."
              />
            </p>
          )}
          {attempt.values.kind === 'import' && (
            <Button variant="outline" disabled={pending} onClick={() => checkImport(attempt)}>
              <LocalizedText en="Check import result" vi="Kiểm tra kết quả nhập" />
            </Button>
          )}
        </div>
      )}
      {target && (
        <p className="text-sm">
          {target.kind === 'action' || target.kind === 'requirement' ? (
            <Link className="underline" href={`/matters/${matterId}/work/${target.id}`}>
              <LocalizedText en="Open confirmed draft" vi="Mở bản nháp đã xác nhận" />
            </Link>
          ) : (
            <>
              <LocalizedText en="Draft ID" vi="Mã bản nháp" /> {target.id}
            </>
          )}
        </p>
      )}
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          <LocalizedText en="Contract term lines" vi="Các dòng điều khoản hợp đồng" />
        </caption>
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="px-3 py-2 font-medium">
              <LocalizedText en="Term" vi="Điều khoản" />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <LocalizedText en="Value" vi="Giá trị" />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <LocalizedText en="Source" vi="Nguồn" />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              <LocalizedText en="Status" vi="Trạng thái" />
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">
                <LocalizedText en="Actions" vi="Hành động" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                <LocalizedText
                  en="No term lines yet — import the contract's term sheet to fill this grid."
                  vi="Chưa có dòng nào — nhập bảng điều khoản để điền lưới này."
                />
              </td>
            </tr>
          ) : null}
          {lines.map((line) => (
            <tr key={line.id} className="border-b">
              <th scope="row" className="px-3 py-2 text-left font-medium">
                <LocalizedText
                  en={FIELD_LABEL[line.field]?.en ?? line.field}
                  vi={FIELD_LABEL[line.field]?.vi ?? line.field}
                />
              </th>
              <td className="px-3 py-2">{valueOf(line)}</td>
              <td className="px-3 py-2">
                <span
                  title={`version ${line.documentVersionId}`}
                  className="font-mono text-xs text-muted-foreground"
                >
                  {line.sourceHash.slice(0, 10)}…
                </span>
              </td>
              <td className="px-3 py-2">
                {line.promotedRef ? (
                  <LocalizedText
                    en={PROMOTED_KIND[line.promotedKind]?.en ?? 'Promoted'}
                    vi={PROMOTED_KIND[line.promotedKind]?.vi ?? 'Đã tạo bản nháp'}
                  />
                ) : (
                  <LocalizedText en="Fact only" vi="Chỉ là dữ kiện" />
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {line.promotedRef ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {line.promotedRef.slice(0, 8)}…
                  </span>
                ) : canEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending || !!attempt}
                    onClick={() => promote(line)}
                  >
                    <LocalizedText en="Promote" vi="Tạo bản nháp" />
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        {TERM_FIELDS.length}{' '}
        <LocalizedText en="term kinds are tracked." vi="loại điều khoản được theo dõi." />
      </p>
    </div>
  )
}
