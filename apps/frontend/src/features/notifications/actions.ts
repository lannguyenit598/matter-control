'use server'

import { requireSession } from '@/lib/auth'
import { fieldFailure, toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { notificationsRepository } from './repository'
import { notificationKeysSchema } from './schemas'

export type MarkSeenOutcome = McActionResult & { seenAt?: string }

/** Acknowledges only keys displayed by this browser; current access is rechecked by the API. */
export async function markSeenAction(keys: string[]): Promise<MarkSeenOutcome> {
  try {
    await requireSession()
    const parsed = notificationKeysSchema.safeParse(keys)
    if (!parsed.success) return fieldFailure('keys', 'The notification selection is invalid.')
    const res = await notificationsRepository.markSeen(parsed.data)
    return { ok: true, seenAt: res.data.seenAt }
  } catch (error) {
    return toMcFailure(error)
  }
}
