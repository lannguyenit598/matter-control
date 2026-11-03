'use server'

import { revalidatePath } from 'next/cache'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { requirementRepository } from './repository'
import { createRequirementInputSchema } from './schemas'

export async function createRequirementAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = createRequirementInputSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues)
        (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
      return {
        ok: false,
        kind: 'validation',
        error: 'Please fix the highlighted fields.',
        fieldErrors,
      }
    }
    const { matterId, ...rest } = parsed.data
    const res = await requirementRepository.create(matterId, rest)
    revalidatePath(`/matters/${matterId}`)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}
