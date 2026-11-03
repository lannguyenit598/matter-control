'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { guidanceRepository } from './repository'
import {
  addGuidanceDraftInputSchema,
  createGuidanceInputSchema,
  publishGuidanceInputSchema,
} from './schemas'

/*
 * RLF-07 server actions. Create/draft are receipted; publication is a receipted OWNER command
 * that never changes legal state.
 */

function invalid(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

const matterPaths = (matterId: string) => {
  revalidatePath(`/matters/${matterId}/work`)
  revalidatePath(`/matters/${matterId}`)
}

export async function createGuidanceAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createGuidanceInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await guidanceRepository.create(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function addGuidanceDraftAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = addGuidanceDraftInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await guidanceRepository.addDraft(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function publishGuidanceAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = publishGuidanceInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await guidanceRepository.publish(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}
