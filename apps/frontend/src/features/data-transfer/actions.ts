'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'
import { McError } from '@/lib/mc/errors'

import {
  acknowledgeAttempt,
  attemptRows,
  attemptSlots,
  beginAttempt,
  endAttempt,
  revokeAttempts,
  type PendingAttempt,
} from './pending-attempts'
import { recoverySession } from './recovery-session'
import { ACCESS_LOST, ROW_ACCESS_LOST } from './labels'

import { dataTransferRepository } from './repository'
import { bulkCommitInputSchema, bulkRowInputSchema, importPlanSchema } from './schemas'
import type {
  BriefResult,
  BulkPreviewResult,
  BulkRowResult,
  ImportPreviewResult,
  ImportRowResult,
} from './schemas'

/*
 * Data operations (contract §2.7). The browser mints the idempotency keys once per intent (see
 * intent.ts) and sends them in: a retry after a lost answer resends the SAME keys, so the server's
 * receipts reconcile it and nothing is applied twice. Server code never invents keys, because a
 * server-side retry would have to mint new ones.
 */

function validationFailure(error: ZodError): McActionResult & { ok: false } {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[issue.path.length - 1] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

export type BulkPreviewOutcome = McActionResult & { preview?: BulkPreviewResult }
export type BulkCommitOutcome = McActionResult & { results?: BulkRowResult[] }
export type ImportPreviewOutcome = McActionResult & { preview?: ImportPreviewResult }
export type ImportCommitOutcome = McActionResult & { results?: ImportRowResult[] }
export type BriefOutcome = McActionResult & { brief?: BriefResult }

export async function bulkPreviewAction(
  matterId: string,
  rows: unknown,
): Promise<BulkPreviewOutcome> {
  try {
    await requireSession()
    const parsed = bulkRowInputSchema.array().min(1).safeParse(rows)
    if (!parsed.success) return validationFailure(parsed.error)
    return { ok: true, preview: await dataTransferRepository.bulkPreview(matterId, parsed.data) }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function bulkCommitAction(
  matterId: string,
  input: unknown,
): Promise<BulkCommitOutcome> {
  try {
    await requireSession()
    const parsed = bulkCommitInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error)
    return await executeAttempt({ kind: 'bulk', matterId, input: parsed.data })
  } catch (error) {
    return toMcFailure(error)
  }
}

const formatOf = (file: File) => (file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'csv')

export async function importPreviewAction(
  matterId: string,
  file: File,
): Promise<ImportPreviewOutcome> {
  try {
    await requireSession()
    const content = new Uint8Array(await file.arrayBuffer())
    const preview = await dataTransferRepository.importPreview(matterId, {
      sourceName: file.name,
      format: formatOf(file),
      content,
    })
    return { ok: true, preview }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function importCommitAction(
  matterId: string,
  file: File,
  plan: unknown,
): Promise<ImportCommitOutcome> {
  try {
    await requireSession()
    const parsed = importPlanSchema.safeParse(plan)
    if (!parsed.success) return validationFailure(parsed.error)
    if (file.size > 25 * 1024 * 1024)
      return {
        ok: false,
        kind: 'validation',
        error: 'The file exceeds the 25 MiB local upload limit.',
      }
    const content = new Uint8Array(await file.arrayBuffer())
    return await executeAttempt({
      kind: 'import',
      matterId,
      upload: { sourceName: file.name, format: formatOf(file), content },
      plan: parsed.data,
    })
  } catch (error) {
    return toMcFailure(error)
  }
}

async function executeAttempt(
  proposed: PendingAttempt,
): Promise<BulkCommitOutcome | ImportCommitOutcome> {
  const session = await recoverySession()
  const attempt = beginAttempt(session, proposed)
  if (!attempt)
    return {
      ok: false,
      kind: 'outcome-unknown',
      retrySameKey: true,
      error:
        'A retained attempt is unresolved or still running. Recover it before starting another.',
    }
  try {
    const results =
      attempt.kind === 'bulk'
        ? await dataTransferRepository.bulkCommit(
            attempt.matterId,
            attempt.input.attemptKey,
            attempt.input.rows,
          )
        : await dataTransferRepository.importCommit(attempt.matterId, attempt.upload, attempt.plan)
    if (results.some((row) => row.status === 'FAILURE' && ROW_ACCESS_LOST.has(row.code ?? ''))) {
      revokeAttempts(session, attempt.matterId)
    } else endAttempt(session, attempt, results)
    revalidatePath(`/matters/${attempt.matterId}/work`)
    return { ok: true, results }
  } catch (error) {
    endAttempt(session, attempt)
    const failure = toMcFailure(error)
    if (ACCESS_LOST.has(failure.kind)) revokeAttempts(session, attempt.matterId)
    return failure
  }
}

export type RecoveryOutcome = McActionResult & {
  attempts?: Array<{ kind: 'bulk' | 'import'; rows: string[]; blocked: boolean }>
  recoveries?: Array<{
    kind: 'bulk' | 'import'
    key: string
    rows: import('./intent').RowOutcome[]
  }>
}

/** Read/retry is explicit and re-authorized. A page reload never dispatches a mutation. */
export async function recoverTransfersAction(
  matterId: string,
  retry = false,
): Promise<RecoveryOutcome> {
  let session: Awaited<ReturnType<typeof recoverySession>> | undefined
  try {
    await requireSession()
    session = await recoverySession()
    await dataTransferRepository.authorizeRecovery(matterId)
    const retained = [...attemptSlots(session)].filter(
      ([, slot]) => slot.attempt?.matterId === matterId || slot.blocked === matterId,
    )
    const results: NonNullable<RecoveryOutcome['recoveries']> = retained.flatMap(([kind, slot]) =>
      slot.attempt && slot.results
        ? [
            {
              kind: kind as 'bulk' | 'import',
              key:
                slot.attempt.kind === 'bulk'
                  ? slot.attempt.input.attemptKey
                  : slot.attempt.plan.runKey,
              rows: slot.results,
            },
          ]
        : [],
    )
    if (retry)
      for (const [kind, slot] of retained) {
        if (!slot.attempt || slot.results) continue
        const outcome = await executeAttempt(slot.attempt)
        if (!outcome.ok)
          return {
            ok: false,
            kind: outcome.kind,
            error: outcome.error,
            retrySameKey: outcome.retrySameKey,
          }
        results.push({
          kind: kind as 'bulk' | 'import',
          key:
            slot.attempt.kind === 'bulk' ? slot.attempt.input.attemptKey : slot.attempt.plan.runKey,
          rows: outcome.results ?? [],
        })
      }
    return {
      ok: true,
      recoveries: results,
      attempts: [...attemptSlots(session)]
        .filter(([, slot]) => slot.attempt?.matterId === matterId || slot.blocked === matterId)
        .map(([kind, slot]) => ({
          kind: kind as 'bulk' | 'import',
          rows: slot.attempt ? attemptRows(slot.attempt) : [],
          blocked: !!slot.blocked,
        })),
    }
  } catch (error) {
    const failure = toMcFailure(error)
    if (session && ACCESS_LOST.has(failure.kind)) revokeAttempts(session, matterId)
    return failure
  }
}

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

export async function briefAction(matterId: string, t1: string, t2: string): Promise<BriefOutcome> {
  try {
    await requireSession()
    const bad: Record<string, string[]> = {}
    if (!RFC3339.test(t1))
      bad.t1 = ['Use RFC 3339 with an offset, for example 2026-10-27T09:00:00Z.']
    if (!RFC3339.test(t2))
      bad.t2 = ['Use RFC 3339 with an offset, for example 2026-10-27T09:00:00Z.']
    if (!bad.t1 && !bad.t2 && Date.parse(t2) < Date.parse(t1))
      bad.t2 = ['The end of the window cannot be before its start.']
    if (Object.keys(bad).length > 0)
      return {
        ok: false,
        kind: 'validation',
        error: 'Please fix the highlighted fields.',
        fieldErrors: bad,
      }
    return { ok: true, brief: await dataTransferRepository.brief(matterId, t1, t2) }
  } catch (error) {
    if (
      error instanceof McError &&
      (error.code === 'invalid-window' || error.code === 'bad-request')
    )
      return {
        ok: false,
        kind: 'validation',
        error: 'The window is not valid. No report was produced.',
        fieldErrors: { t2: ['The end of the window cannot be after the latest recorded change.'] },
      }
    if (error instanceof McError && error.code === 'brief-unreconstructable')
      return {
        ok: false,
        kind: 'error',
        error:
          'A correct brief cannot be produced: the history behind this window is incomplete. No report was created.',
      }
    return toMcFailure(error)
  }
}

export async function acknowledgeTransferAction(
  matterId: string,
  kind: 'bulk' | 'import',
  key: string,
): Promise<void> {
  await requireSession()
  acknowledgeAttempt(await recoverySession(), kind, matterId, key)
}
