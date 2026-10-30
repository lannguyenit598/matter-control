'use client'

import { useRef, useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Alert } from '@/components/molecules/alert'
import { FormField } from '@/components/molecules/form-field'

import { bulkCommitAction, bulkPreviewAction } from '../actions'
import {
  bulkFingerprint,
  intentFor,
  reconcileOutcomes,
  type FrozenBulkIntent,
  type RowOutcome,
} from '../intent'
import type { BulkPreviewResult, BulkRowInput } from '../schemas'

import { OutcomeList } from './outcome-list'

type Mode = 'unchanged' | 'set' | 'clear'
type Field = { mode: Mode; value: string }
type Draft = {
  rowKey: string
  itemId: string
  expectedRevision: string
  title: Field
  description: Field
  internalOwner: Field
  due: Field
}

const unchanged = (): Field => ({ mode: 'unchanged', value: '' })

/** Unchanged is the default; Clear exists only where clearing is permitted. */
const FIELDS: {
  key: keyof Pick<Draft, 'title' | 'description' | 'internalOwner' | 'due'>
  label: string
  clearable: boolean
}[] = [
  { key: 'title', label: 'Title', clearable: false },
  { key: 'description', label: 'Description', clearable: false },
  { key: 'internalOwner', label: 'Internal owner (user id)', clearable: true },
  { key: 'due', label: 'Due (RFC 3339)', clearable: true },
]

function toInput(d: Draft): BulkRowInput {
  const out: BulkRowInput = {
    rowKey: d.rowKey,
    itemId: d.itemId.trim(),
    expectedRevision: Number(d.expectedRevision),
  }
  for (const f of FIELDS) {
    const v = d[f.key]
    if (v.mode === 'set') out[f.key] = v.value
    if (v.mode === 'clear' && f.clearable) out[f.key] = ''
  }
  return out
}

type Outcome =
  | { kind: 'results'; rows: RowOutcome[]; submitted: number }
  | { kind: 'failure'; message: string; retrySameKey: boolean }

/**
 * Scoped bulk edit of four allow-listed fields. A commit freezes its keys once: a retry after a lost
 * answer resends the same keys, and editing the rows afterwards starts a different attempt.
 */
export function BulkSection({ matterId }: { matterId: string }) {
  const next = useRef(1)
  const [rows, setRows] = useState<Draft[]>([])
  const [preview, setPreview] = useState<{
    result: BulkPreviewResult
    fingerprint: string
    invalidated?: boolean
    inputs: BulkRowInput[]
  } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [intent, setIntent] = useState<FrozenBulkIntent | null>(null)
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

  const inputs = rows.map(toInput)
  const fingerprint = bulkFingerprint(inputs)
  const locked =
    outcome !== null &&
    ((outcome.kind === 'results' && outcome.rows.some((r) => r.status === 'UNKNOWN')) ||
      (outcome.kind === 'failure' && outcome.retrySameKey))
  const stale = preview !== null && (preview.invalidated || preview.fingerprint !== fingerprint)
  const canCommit =
    !pending &&
    rows.length > 0 &&
    preview !== null &&
    !stale &&
    (preview.result.rows.some((r) => r.valid) || locked)

  const invalidate = () => setPreview((current) => current && { ...current, invalidated: true })
  const update = (i: number, patch: Partial<Draft>) => {
    if (busy.current || locked) return
    invalidate()
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }

  const commit = () =>
    start(async () => {
      if (!canCommit || !preview) return
      const frozen = intentFor(preview.inputs, intent)
      setIntent(frozen)
      const r = await bulkCommitAction(matterId, frozen.input)
      if (r.ok && r.results) {
        const receipts = reconcileOutcomes(
          r.results,
          frozen.input.rows.map((row) => row.rowKey),
        )
        const unknown = receipts.some((x) => x.status === 'UNKNOWN')
        setOutcome({ kind: 'results', rows: receipts, submitted: frozen.input.rows.length })
        if (!unknown) {
          setIntent(null) // settled: the next edit is a new intent against fresh revisions
          setPreview(null)
        }
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
    <section className="flex flex-col gap-3" aria-labelledby="bulk-heading">
      <h2 id="bulk-heading" className="text-lg font-semibold">
        Bulk edit
      </h2>
      <p className="text-sm text-muted-foreground">
        Four fields only: title, description, internal owner, due. Each defaults to Unchanged. Rows
        commit independently, so one failure never blocks the others.
      </p>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No rows yet. Add the items you want to change.
        </p>
      )}
      {rows.map((row, i) => (
        <fieldset
          key={row.rowKey}
          disabled={pending || locked}
          className="grid gap-3 rounded-md border p-3 md:grid-cols-2"
        >
          <legend className="px-1 text-sm font-medium">Row {i + 1}</legend>
          <FormField label="Item id" required>
            {(c) => (
              <Input
                value={row.itemId}
                onChange={(e) => update(i, { itemId: e.target.value })}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label="Revision you read"
            required
            hint="The edit is refused if the item moved on."
          >
            {(c) => (
              <Input
                type="number"
                min={1}
                value={row.expectedRevision}
                onChange={(e) => update(i, { expectedRevision: e.target.value })}
                {...c}
              />
            )}
          </FormField>
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <FormField
                label={f.label}
                hint={f.clearable ? undefined : 'Cannot be cleared: a record always has this.'}
              >
                {(c) => (
                  <Select
                    value={row[f.key].mode}
                    options={[
                      { value: 'unchanged', label: 'Unchanged' },
                      { value: 'set', label: 'Set to…' },
                      ...(f.clearable ? [{ value: 'clear', label: 'Clear' }] : []),
                    ]}
                    onChange={(e) =>
                      update(i, {
                        [f.key]: { mode: e.target.value as Mode, value: row[f.key].value },
                      })
                    }
                    {...c}
                  />
                )}
              </FormField>
              {row[f.key].mode === 'set' && (
                <Input
                  aria-label={`${f.label} new value`}
                  value={row[f.key].value}
                  onChange={(e) => update(i, { [f.key]: { mode: 'set', value: e.target.value } })}
                />
              )}
            </div>
          ))}
          <Button
            variant="secondary"
            className="md:col-span-2 md:w-fit"
            onClick={() => {
              invalidate()
              setRows((rs) => rs.filter((_, j) => j !== i))
            }}
          >
            Remove row {i + 1}
          </Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={pending || locked}
          onClick={() => {
            invalidate()
            setRows((rs) => [
              ...rs,
              {
                rowKey: `row-${next.current++}`,
                itemId: '',
                expectedRevision: '1',
                title: unchanged(),
                description: unchanged(),
                internalOwner: unchanged(),
                due: unchanged(),
              },
            ])
          }}
        >
          Add row
        </Button>
        <Button
          variant="secondary"
          disabled={pending || rows.length === 0 || locked}
          onClick={() =>
            start(async () => {
              setPreviewError(null)
              const r = await bulkPreviewAction(matterId, inputs)
              if (r.ok && r.preview) {
                setPreview({ result: r.preview, fingerprint, inputs })
                setOutcome(null)
              } else if (!r.ok) {
                setPreview(null)
                setPreviewError(r.error)
              }
            })
          }
        >
          Preview
        </Button>
        <Button disabled={!canCommit} onClick={commit}>
          {locked ? 'Retry the same attempt' : 'Commit'}
        </Button>
      </div>
      {previewError && (
        <Alert variant="destructive" title="Preview failed">
          {previewError}
        </Alert>
      )}
      {stale && (
        <Alert variant="info" title="The rows changed after the preview">
          Preview again before committing, so what you commit is what you saw.
        </Alert>
      )}
      {preview && !stale && (
        <ul className="flex flex-col gap-1 text-sm" aria-label="Preview">
          {preview.result.rows.map((r) => (
            <li key={r.rowKey}>
              <Badge variant={r.valid ? 'success' : 'destructive'}>
                {r.valid ? 'Ready' : 'Will fail'}
              </Badge>{' '}
              <span className="font-mono">{r.itemId}</span>
              {r.found === false
                ? ' — not found in this matter'
                : r.title
                  ? ` — currently “${r.title}”, revision ${r.revision}`
                  : ''}
              {!r.valid && r.code ? ` (${r.code})` : ''}
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
      {outcome?.kind === 'failure' && outcome.retrySameKey && intent && (
        <OutcomeList
          results={intent.input.rows.map((row) => ({ rowKey: row.rowKey, status: 'UNKNOWN' }))}
          submitted={intent.input.rows.length}
        />
      )}
      {outcome?.kind === 'results' && (
        <OutcomeList results={outcome.rows} submitted={outcome.submitted} />
      )}
    </section>
  )
}
