'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { UUID_V7 } from '@/lib/mc/idempotency'
import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { termSheetRepository } from './repository'

const promotionSchema = z.object({
  matterId: z.uuid(),
  termLineId: z.uuid(),
  expectedRevision: z.number().int().positive(),
  idempotencyKey: z.string().regex(UUID_V7),
})

const reconciliationSchema = z.object({
  matterId: z.uuid(),
  idempotencyKey: z.string().regex(UUID_V7),
  documentVersionId: z.uuid(),
})

const NOT_CONFIRMED =
  'The earlier import is not confirmed yet. Keep this attempt: retry it with the same file, or check again later.'

/**
 * Settles an import whose answer was lost from the caller's own receipt, without sending the file
 * again. Only a receipt for the same key, of kind TERM_SHEET_IMPORTED and for the same source
 * version confirms it. Anything else — no receipt yet, another kind or version, a refusal or a
 * transient failure — leaves the outcome unknown, so the caller keeps the original key.
 */
export async function reconcileTermSheetImportAction(input: {
  matterId: string
  idempotencyKey: string
  documentVersionId: string
}): Promise<McActionResult & { created?: number; replaced?: number; unchanged?: number }> {
  try {
    await requireSession()
    if (!reconciliationSchema.safeParse(input).success) {
      return { ok: false, kind: 'validation', error: 'Invalid reconciliation request.' }
    }
    const receipt = await termSheetRepository.reconcile(input.matterId, input.idempotencyKey)
    const sheet = receipt.termSheet
    if (
      receipt.idempotencyKey !== input.idempotencyKey ||
      receipt.kind !== 'TERM_SHEET_IMPORTED' ||
      sheet?.documentVersionId !== input.documentVersionId
    ) {
      return { ok: false, kind: 'outcome-unknown', error: NOT_CONFIRMED, retrySameKey: true }
    }
    revalidatePath(`/matters/${input.matterId}/term-sheet`)
    return {
      ok: true,
      created: sheet.created,
      replaced: sheet.replaced,
      unchanged: sheet.unchanged,
    }
  } catch (error) {
    // skip: every failure here (404 no receipt, refusal, timeout) is "not confirmed", never an outcome
    console.error(error)
    return { ok: false, kind: 'outcome-unknown', error: NOT_CONFIRMED, retrySameKey: true }
  }
}

export async function promoteTermLineAction(input: {
  matterId: string
  termLineId: string
  expectedRevision: number
  idempotencyKey: string
}): Promise<
  McActionResult & {
    targetKind?: 'context_record' | 'milestone' | 'action' | 'requirement'
    targetMissing?: boolean
  }
> {
  try {
    await requireSession()
    if (!promotionSchema.safeParse(input).success) {
      return { ok: false, kind: 'validation', error: 'Invalid promotion request.' }
    }
    const res = await termSheetRepository.promote(
      input.matterId,
      input.termLineId,
      input.idempotencyKey,
      input.expectedRevision,
    )
    revalidatePath(`/matters/${input.matterId}/term-sheet`)
    return {
      ok: true,
      id: res.data.targetId,
      replayed: res.data.replayed,
      targetKind: res.data.targetKind,
      targetMissing: res.data.targetMissing,
    }
  } catch (error) {
    return toMcFailure(error)
  }
}
