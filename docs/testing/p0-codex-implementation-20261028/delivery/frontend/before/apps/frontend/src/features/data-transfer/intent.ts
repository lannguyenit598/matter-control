import { newIdempotencyKey } from '@/lib/mc/idempotency'

import type { BulkCommitInput, BulkRowInput, ImportPlan, RowStatus } from './schemas'

/*
 * Frozen retry intent. A commit mints its keys exactly once; every retry of the same intent resends
 * those keys, so a lost answer is recovered by the server's receipts and nothing is applied twice.
 * Changing the content starts a different intent with new keys. Pure functions: no React, no I/O.
 */

/** Content identity of the rows a preview or a commit was based on. */
export function bulkFingerprint(rows: BulkRowInput[]): string {
  return JSON.stringify(
    rows.map((r) => [
      r.rowKey,
      r.itemId,
      r.expectedRevision,
      r.title ?? null,
      r.description ?? null,
      r.internalOwner ?? null,
      r.due ?? null,
    ]),
  )
}

export type FrozenBulkIntent = { fingerprint: string; input: BulkCommitInput }

export function freezeBulkIntent(rows: BulkRowInput[]): FrozenBulkIntent {
  return {
    fingerprint: bulkFingerprint(rows),
    input: {
      attemptKey: newIdempotencyKey(),
      rows: rows.map((r) => ({ ...r, idempotencyKey: newIdempotencyKey() })),
    },
  }
}

/** Reuses the intent when the rows are unchanged, otherwise freezes a new one. */
export function intentFor(
  rows: BulkRowInput[],
  current: FrozenBulkIntent | null,
): FrozenBulkIntent {
  return current && current.fingerprint === bulkFingerprint(rows) ? current : freezeBulkIntent(rows)
}

export type FrozenImportIntent = { fingerprint: string; plan: ImportPlan }

/** The file's identity: name, size, modified time and the keys of the rows previewed. */
export function importFingerprint(
  file: { name: string; size: number; lastModified: number },
  rowKeys: string[],
): string {
  return JSON.stringify([file.name, file.size, file.lastModified, rowKeys])
}

export function freezeImportIntent(
  file: { name: string; size: number; lastModified: number },
  rowKeys: string[],
): FrozenImportIntent {
  return {
    fingerprint: importFingerprint(file, rowKeys),
    plan: {
      runKey: newIdempotencyKey(),
      rowKeys: Object.fromEntries(rowKeys.map((k) => [k, newIdempotencyKey()])),
    },
  }
}

export type RowOutcome = {
  rowKey: string
  status: RowStatus
  code?: string
  detail?: string
  itemId?: string
}

export type GroupedOutcomes = {
  succeeded: RowOutcome[]
  failed: RowOutcome[]
  unknown: RowOutcome[]
  /** Replayed rows are successes that were already applied by an earlier attempt. */
  replayed: number
  /** True when the three groups account for exactly the submitted rows. */
  balanced: boolean
}

export function groupOutcomes(results: RowOutcome[], submitted: number): GroupedOutcomes {
  const succeeded = results.filter((r) => r.status === 'SUCCESS' || r.status === 'SUCCESS_REPLAYED')
  const failed = results.filter((r) => r.status === 'FAILURE')
  const unknown = results.filter((r) => r.status === 'UNKNOWN')
  return {
    succeeded,
    failed,
    unknown,
    replayed: results.filter((r) => r.status === 'SUCCESS_REPLAYED').length,
    balanced: succeeded.length + failed.length + unknown.length === submitted,
  }
}
