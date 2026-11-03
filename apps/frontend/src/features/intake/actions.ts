'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { intakeRepository } from './repository'
import {
  convertIntakeInputSchema,
  createIntakeInputSchema,
  declineIntakeInputSchema,
} from './schemas'

/*
 * RLF-06 server actions. Create/convert are receipted; decline is CAS-only and never resent
 * after an unknown outcome.
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

export async function createIntakeAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createIntakeInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await intakeRepository.create(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function declineIntakeAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = declineIntakeInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await intakeRepository.decline(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.id }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function convertIntakeAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = convertIntakeInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await intakeRepository.convert(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.itemId ?? res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}
