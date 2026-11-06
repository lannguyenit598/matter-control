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
