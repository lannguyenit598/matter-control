'use server'

import { revalidatePath } from 'next/cache'

import type { PickerResult } from '@/components/molecules/search-picker'
import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { workspaceRepository } from './repository'
import {
  createWorkspaceInputSchema,
  grantWorkspaceMemberInputSchema,
  revokeWorkspaceMemberInputSchema,
  searchWorkspacePeopleInputSchema,
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

/** The API returns at most this many people per query; reaching it means there may be more. */
const PEOPLE_LIMIT = 20

/**
 * Read for the person picker. It is a Server Action only to give the client one authenticated,
 * bounded read path (session first, Zod, repository): nothing here grants access, and the grant
 * command re-authorizes. 404 is ambiguous by API design (directory off, or the workspace is no
 * longer visible), so it is reported as `unavailable`, never as an empty result.
 */
export async function searchWorkspacePeopleAction(input: unknown): Promise<PickerResult> {
  try {
    await requireSession()
    const parsed = searchWorkspacePeopleInputSchema.safeParse(input)
    if (!parsed.success) return { status: 'invalid' }
    const { items } = await workspaceRepository.candidates(
      parsed.data.workspaceId,
      parsed.data.query,
    )
    return {
      status: 'ok',
      options: items.map((p) => ({ value: p.userId, label: p.displayName })),
      truncated: items.length >= PEOPLE_LIMIT,
    }
  } catch (error) {
    const failure = toMcFailure(error)
    if (failure.ok) return { status: 'error' }
    if (failure.kind === 'validation') return { status: 'invalid' }
    if (failure.kind === 'unauthenticated' || failure.kind === 'forbidden')
      return { status: 'denied' }
    return {
      status:
        failure.kind === 'not-found' || failure.kind === 'unavailable' ? 'unavailable' : 'error',
    }
  }
}
