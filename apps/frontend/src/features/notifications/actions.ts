'use server'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { notificationsRepository } from './repository'

export type MarkSeenOutcome = McActionResult & { seenAt?: string }

/** Marks the whole feed seen. The badge is derived from seenAt, so a refresh recomputes it. */
export async function markSeenAction(): Promise<MarkSeenOutcome> {
  try {
    await requireSession()
    const res = await notificationsRepository.markSeen()
    return { ok: true, seenAt: res.data.seenAt }
  } catch (error) {
    return toMcFailure(error)
  }
}
