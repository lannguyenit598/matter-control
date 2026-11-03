'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'
import { McError } from '@/lib/mc/errors'

import { playbookRepository } from './repository'
import {
  applyPlaybookInputSchema,
  createPlaybookInputSchema,
  publishPlaybookInputSchema,
  type PlaybookApplicationPreview,
} from './schemas'

/*
 * RLF-05 server actions. Create/publish are receipted workspace commands (If-Match on the
 * workspace); apply is a receipted matter command. An unknown outcome is recovered only by the
 * same key — never by a second apply.
 */

function invalid(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

export async function createPlaybookAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createPlaybookInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await playbookRepository.create(p.data)
    revalidatePath(`/workspaces/${p.data.workspaceId}`)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function publishPlaybookAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = publishPlaybookInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await playbookRepository.publish(p.data)
    revalidatePath(`/workspaces/${p.data.workspaceId}`)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function applyPlaybookAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = applyPlaybookInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await playbookRepository.apply(p.data)
    revalidatePath(`/matters/${p.data.matterId}/work`)
    return { ok: true, id: res.data.revisionId, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

/** Read-only preview (stores nothing): the exact entries and the problems apply would refuse. */
export async function previewPlaybookAction(
  matterId: string,
  revisionId: string,
): Promise<{ ok: true; preview: PlaybookApplicationPreview } | { ok: false; error: string }> {
  try {
    await requireSession()
    const preview = await playbookRepository.preview(matterId, revisionId)
    return { ok: true, preview }
  } catch (error) {
    if (error instanceof McError) return { ok: false, error: error.code }
    return { ok: false, error: 'error' }
  }
}
