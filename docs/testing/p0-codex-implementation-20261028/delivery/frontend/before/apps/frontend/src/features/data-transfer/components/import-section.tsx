'use client'

import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Alert } from '@/components/molecules/alert'

import { importCommitAction, importPreviewAction } from '../actions'
import {
  freezeImportIntent,
  importFingerprint,
  type FrozenImportIntent,
  type RowOutcome,
} from '../intent'
import type { ImportPreviewResult } from '../schemas'

import { OutcomeList } from './outcome-list'

type Outcome =
  | { kind: 'results'; rows: RowOutcome[]; submitted: number }
  | { kind: 'failure'; message: string; retrySameKey: boolean }

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
  // Plain state rather than a transition: the work is an awaited Server Action and its result is
  // stored by this handler once the answer has arrived.
  const start = (fn: () => Promise<void>) => {
    setPending(true)
    void fn().finally(() => setPending(false))
  }

  const reset = (f: File | null) => {
    setFile(f)
    setPreview(null)
    setPreviewError(null)
    setIntent(null)
    setOutcome(null)
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
      if (r.ok && r.results) {
        setOutcome({ kind: 'results', rows: r.results, submitted: rowKeys.length })
        if (!r.results.some((x) => x.status === 'UNKNOWN')) setIntent(null)
      } else if (!r.ok) {
        setOutcome({
          kind: 'failure',
          message: r.error,
          retrySameKey: r.kind === 'outcome-unknown',
        })
      }
    })

  return (
    <section className="flex flex-col gap-3" aria-labelledby="import-heading">
      <h2 id="import-heading" className="text-lg font-semibold">
        Import CSV or XLSX
      </h2>
      <p className="text-sm text-muted-foreground">
        Required columns: rowkey, kind, title. Optional: description, internalowner, due,
        dependencies (semicolon-separated row keys of this file or existing item ids). Nothing in
        the file is evaluated: a value starting with = + - or @ stays literal text. A repeat of the
        same source replays; changed content is a conflict and never overwrites. An imported
        VERIFIED claim stays a claim.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        File
        <input
          type="file"
          accept=".csv,.xlsx"
          disabled={locked}
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
              } else if (!r.ok) {
                setPreview(null)
                setPreviewError(r.error)
              }
            })
          }
        >
          Preview
        </Button>
        <Button
          disabled={pending || !file || !preview || (validGroups === 0 && !locked)}
          onClick={commit}
        >
          {locked ? 'Retry the same attempt' : 'Commit valid groups'}
        </Button>
        {locked && (
          <Button variant="secondary" onClick={() => reset(null)}>
            Discard this attempt
          </Button>
        )}
      </div>
      {previewError && (
        <Alert variant="destructive" title="The file could not be previewed">
          {previewError}
        </Alert>
      )}
      {preview && preview.result.rows.length === 0 && (
        <p className="text-sm text-muted-foreground">The file has no data rows.</p>
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
      {outcome?.kind === 'results' && (
        <OutcomeList results={outcome.rows} submitted={outcome.submitted} />
      )}
    </section>
  )
}
