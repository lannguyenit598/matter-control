'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { matterRepository } from './repository'
import {
  createMatterInputSchema,
  grantMatterMemberInputSchema,
  revokeMatterMemberInputSchema,
} from './schemas'

function validationResult(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

export async function createMatterAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = createMatterInputSchema.safeParse(input)
    if (!parsed.success) return validationResult(parsed.error)
    const { workspaceId, ifMatch, ...rest } = parsed.data
    const res = await matterRepository.create(workspaceId, rest, ifMatch)
    revalidatePath(`/workspaces/${workspaceId}`)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function grantMatterMemberAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = grantMatterMemberInputSchema.safeParse(input)
    if (!parsed.success) return validationResult(parsed.error)
    const { matterId, ifMatch, ...body } = parsed.data
    await matterRepository.grantMember(matterId, body, ifMatch)
    revalidatePath(`/matters/${matterId}`)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function revokeMatterMemberAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = revokeMatterMemberInputSchema.safeParse(input)
    if (!parsed.success) return { ok: false, kind: 'error', error: 'Invalid request.' }
    await matterRepository.revokeMember(
      parsed.data.matterId,
      parsed.data.userId,
      parsed.data.ifMatch,
    )
    revalidatePath(`/matters/${parsed.data.matterId}`)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}
