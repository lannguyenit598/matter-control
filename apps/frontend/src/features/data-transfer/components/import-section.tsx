'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { useRef, useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'

import { acknowledgeTransferAction, importCommitAction, importPreviewAction } from '../actions'
import { ACCESS_LOST, ACCESS_LOST_TEXT, ROW_ACCESS_LOST } from '../labels'
import {
  freezeImportIntent,
  importFingerprint,
  reconcileOutcomes,
  type FrozenImportIntent,
  type RowOutcome,
} from '../intent'
import type { ImportPreviewResult } from '../schemas'

import { OutcomeList } from './outcome-list'

type Outcome =
  | { kind: 'results'; rows: RowOutcome[]; submitted: number }
  | { kind: 'failure'; message: string; retrySameKey: boolean }
  | { kind: 'denied'; unresolved: boolean }

/**
 * Structured import in four steps: file, grouped validation, commit, result and recovery. A
 * connected group with one invalid row is rejected whole and says why; independent valid groups are
 * unaffected. The commit freezes its keys for the file it previewed, so a lost answer is recovered
 * by retrying the same attempt.
 */
export function ImportSection({ matterId }: { matterId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{
    result: ImportPreviewResult
    fingerprint: string
  } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [intent, setIntent] = useState<FrozenImportIntent | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  // Plain state rather than a transition: the work is an awaited Server Action and its result is
  // stored by this handler once the answer has arrived.
  const start = (fn: () => Promise<void>, command = false) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    void fn()
      .catch(() => {
        if (command) {
          setOutcome({
            kind: 'failure',
            message:
              'We could not confirm whether this was saved. Retry the same attempt to confirm.',
            retrySameKey: true,
          })
        } else {
          setPreview(null)
          setPreviewError('The preview could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        busy.current = false
        setPending(false)
      })
  }

  const reset = (f: File | null) => {
    if (busy.current || locked) return
    setFile(f)
    setPreview(null)
    setPreviewError(null)
    setIntent(null)
    setOutcome(null)
  }
  // Access ended: remove the file, the preview and the frozen attempt.
  const purge = () => {
    const unresolved = locked
    setFile(null)
    setPreview(null)
    setPreviewError(null)
    setIntent(null)
    setOutcome({ kind: 'denied', unresolved })
  }
  const locked =
    outcome !== null &&
    ((outcome.kind === 'results' && outcome.rows.some((r) => r.status === 'UNKNOWN')) ||
      (outcome.kind === 'failure' && outcome.retrySameKey))
  const validGroups = preview?.result.groups.filter((g) => g.valid).length ?? 0

  const commit = () =>
    start(async () => {
      if (!file || !preview) return
      const rowKeys = preview.result.rows.map((r) => r.rowKey)
      const same = intent && intent.fingerprint === importFingerprint(file, rowKeys)
      const frozen = same ? intent : freezeImportIntent(file, rowKeys)
      setIntent(frozen)
      const r = await importCommitAction(matterId, file, frozen.plan)
      if (
        r.ok &&
        r.results?.some((x) => x.status === 'FAILURE' && ROW_ACCESS_LOST.has(x.code ?? ''))
      ) {
        purge()
      } else if (r.ok && r.results) {
        const receipts = reconcileOutcomes(r.results, rowKeys)
        setOutcome({ kind: 'results', rows: receipts, submitted: rowKeys.length })
        if (!receipts.some((x) => x.status === 'UNKNOWN')) {
          await acknowledgeTransferAction(matterId, 'import', frozen.plan.runKey)
          setIntent(null)
          setPreview(null)
        }
      } else if (!r.ok && ACCESS_LOST.has(r.kind)) {
        purge()
      } else if (!r.ok) {
        setOutcome({
          kind: 'failure',
          message: r.error,
          retrySameKey: locked || r.kind === 'outcome-unknown',
        })
      } else {
        throw new Error('Missing command result')
      }
    }, true)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="import-heading">
      <h2 id="import-heading" className="text-lg font-semibold">
        <LocalizedText en="Import CSV or XLSX" vi="Nhập CSV hoặc XLSX" />
      </h2>
      <p className="text-sm text-muted-foreground">
        Required columns: rowkey, kind, title. Optional: description, internalowner, due,
        verification, dependencies (semicolon-separated row keys of this file or existing item ids).
        Nothing in the file is evaluated: a value starting with = + - or @ stays literal text. A
        repeat of the same source replays; changed content is a conflict and never overwrites. An
        imported VERIFIED claim stays a claim.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <LocalizedText en="File" vi="Tệp" />
        <input
          type="file"
          accept=".csv,.xlsx"
          disabled={pending || locked}
          onChange={(e) => reset(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={pending || !file || locked}
          onClick={() =>
            start(async () => {
              if (!file) return
              setPreviewError(null)
              const r = await importPreviewAction(matterId, file)
              if (r.ok && r.preview) {
                setPreview({
                  result: r.preview,
                  fingerprint: importFingerprint(
                    file,
                    r.preview.rows.map((x) => x.rowKey),
                  ),
                })
                setOutcome(null)
                setIntent(null)
              } else if (!r.ok && ACCESS_LOST.has(r.kind)) {
                purge()
              } else if (!r.ok) {
                setPreview(null)
                setPreviewError(r.error)
              }
            })
          }
        >
          <LocalizedText en="Preview" vi="Xem trước" />
        </Button>
        <Button
          disabled={pending || !file || !preview || (validGroups === 0 && !locked)}
          onClick={commit}
        >
          {locked ? (
            <LocalizedText en="Retry the same attempt" vi="Gửi lại đúng lần gửi này" />
          ) : (
            <LocalizedText en="Commit valid groups" vi="Ghi nhận các nhóm hợp lệ" />
          )}
        </Button>
      </div>
      {previewError && (
        <Alert
          variant="destructive"
          title={
            <LocalizedText en="The file could not be previewed" vi="Không thể xem trước tệp" />
          }
        >
          {previewError}
        </Alert>
      )}
      {preview && preview.result.rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <LocalizedText en="The file has no data rows." vi="Tệp không có dòng dữ liệu." />
        </p>
      )}
      {preview && preview.result.groups.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm" aria-label="Groups">
          {preview.result.groups.map((g) => (
            <li key={g.id} className="rounded-md border p-2">
              <p>
                <Badge variant={g.valid ? 'success' : 'destructive'}>
                  {g.valid ? 'Valid group' : 'Rejected whole'}
                </Badge>{' '}
                Group {g.id}: {g.rowIdx.length} row(s)
                {g.rowIdx.length > 1 ? ', connected by dependencies' : ''}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {g.rowIdx.map((i) => {
                  const r = preview.result.rows[i]
                  if (!r) return null
                  return (
                    <li key={`${r.rowKey}-${i}`}>
                      <span className="font-mono">{r.rowKey}</span> — {r.kind} “{r.title}”
                      {r.importedVerificationClaim && (
                        <>
                          {' '}
                          — source verification claim: {r.importedVerificationClaim}{' '}
                          <LocalizedText
                            en="(unverified source label)"
                            vi="(nhãn nguồn chưa được xác minh)"
                          />
                        </>
                      )}
                      {r.errors.length > 0 && <> — {r.errors.join('; ')}</>}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {outcome?.kind === 'failure' && (
        <Alert
          variant="destructive"
          title={outcome.retrySameKey ? 'The answer was lost' : 'Commit failed'}
        >
          {outcome.message}
        </Alert>
      )}
      {outcome?.kind === 'denied' && (
        <Alert
          variant="destructive"
          title={<LocalizedText en="Access ended" vi="Quyền truy cập đã kết thúc" />}
        >
          {ACCESS_LOST_TEXT}
          {outcome.unresolved && (
            <>
              {' '}
              <LocalizedText
                en="An earlier attempt was still UNKNOWN: it has not been confirmed or rolled back."
                vi="Lần gửi trước vẫn CHƯA RÕ KẾT QUẢ: chưa được xác nhận và chưa thể coi là đã hoàn tác."
              />
            </>
          )}
        </Alert>
      )}
      {outcome?.kind === 'failure' && outcome.retrySameKey && intent && (
        <OutcomeList
          results={Object.keys(intent.plan.rowKeys).map((rowKey) => ({
            rowKey,
            status: 'UNKNOWN',
          }))}
          submitted={Object.keys(intent.plan.rowKeys).length}
        />
      )}
      {outcome?.kind === 'results' && (
        <OutcomeList results={outcome.rows} submitted={outcome.submitted} />
      )}
    </section>
  )
}
