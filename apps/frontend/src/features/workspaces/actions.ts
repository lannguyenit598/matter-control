'use server'

import { revalidatePath } from 'next/cache'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { workspaceRepository } from './repository'
import {
  createWorkspaceInputSchema,
  grantWorkspaceMemberInputSchema,
  revokeWorkspaceMemberInputSchema,
} from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input. Nothing from the client is trusted, and the API still decides every right per call.
 */

function validationResult(error: import('zod').ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

export async function createWorkspaceAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = createWorkspaceInputSchema.safeParse(input)
    if (!parsed.success) return validationResult(parsed.error)
    const res = await workspaceRepository.create(parsed.data)
    revalidatePath('/workspaces')
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function grantWorkspaceMemberAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = grantWorkspaceMemberInputSchema.safeParse(input)
    if (!parsed.success) return validationResult(parsed.error)
    const { workspaceId, ifMatch, ...body } = parsed.data
    await workspaceRepository.grantMember(workspaceId, body, ifMatch)
    revalidatePath(`/workspaces/${workspaceId}`)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function revokeWorkspaceMemberAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const parsed = revokeWorkspaceMemberInputSchema.safeParse(input)
    if (!parsed.success) return { ok: false, kind: 'error', error: 'Invalid request.' }
    await workspaceRepository.revokeMember(
      parsed.data.workspaceId,
      parsed.data.userId,
      parsed.data.ifMatch,
    )
    revalidatePath(`/workspaces/${parsed.data.workspaceId}`)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}
