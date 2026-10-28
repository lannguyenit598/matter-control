'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { workRepository } from './repository'
import {
  addDependencyInputSchema,
  createActionInputSchema,
  createMilestoneInputSchema,
  createNamedInputSchema,
  createPartyInputSchema,
  escalateInputSchema,
  milestonePrerequisitesInputSchema,
  removeDependencyInputSchema,
  transitionInputSchema,
  updateItemInputSchema,
  updatePartyInputSchema,
} from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input; the API still decides every right per call. Only createAction is receipted; every other
 * command is revision-CAS only (contract §2.3) and therefore never resent after an unknown outcome.
 */

function invalid(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

const matterPaths = (matterId: string, itemId?: string) => {
  revalidatePath(`/matters/${matterId}`)
  revalidatePath(`/matters/${matterId}/work`)
  revalidatePath(`/matters/${matterId}/planning`)
  revalidatePath('/my-actions')
  if (itemId) revalidatePath(`/matters/${matterId}/work/${itemId}`)
}

export async function createActionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createActionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await workRepository.createAction(p.data)
    matterPaths(p.data.matterId)
    return { ok: true, id: res.data.item.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

/** Metadata only. There is no field for status, dependency, timing or attention. */
export async function updateWorkItemAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = updateItemInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, itemId, ifMatch, title, outcome, ownerId, dueAt, workstreamId } = p.data
    const body: Record<string, unknown> = {}
    if (title !== undefined) body.title = title
    if (outcome !== undefined) body.outcome = outcome
    if (ownerId !== undefined) body.ownerId = ownerId || null
    if (dueAt !== undefined) body.dueAt = dueAt || null
    if (workstreamId !== undefined) body.workstreamId = workstreamId || null
    await workRepository.update(matterId, itemId, body, ifMatch)
    matterPaths(matterId, itemId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function transitionExecutionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = transitionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, itemId, ifMatch, ...rest } = p.data
    await workRepository.transition(matterId, itemId, { ...rest }, ifMatch)
    matterPaths(matterId, itemId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function escalateAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = escalateInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await workRepository.escalate(p.data.matterId, p.data.itemId, p.data.reason, p.data.ifMatch)
    matterPaths(p.data.matterId, p.data.itemId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function addDependencyAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = addDependencyInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, targetId, ifMatch, ...body } = p.data
    await workRepository.addDependency(matterId, targetId, body, ifMatch)
    matterPaths(matterId, targetId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function removeDependencyAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = removeDependencyInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await workRepository.removeDependency(
      p.data.matterId,
      p.data.targetId,
      p.data.edgeId,
      p.data.reason,
      p.data.ifMatch,
    )
    matterPaths(p.data.matterId, p.data.targetId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function createWorkstreamAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createNamedInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await workRepository.createWorkstream(p.data.matterId, p.data.name)
    matterPaths(p.data.matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function createPartyAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createPartyInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, ...body } = p.data
    await workRepository.createParty(matterId, body)
    matterPaths(matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function updatePartyAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = updatePartyInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, partyId, ifMatch, ...body } = p.data
    await workRepository.updateParty(matterId, partyId, body, ifMatch)
    matterPaths(matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function createMilestoneAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createMilestoneInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, name, dueAt, critical } = p.data
    await workRepository.createMilestone(matterId, {
      name,
      dueAt: dueAt ?? '',
      critical: critical ?? false,
    })
    matterPaths(matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function setMilestonePrerequisitesAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = milestonePrerequisitesInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const { matterId, milestoneId, ifMatch, ...body } = p.data
    await workRepository.setMilestonePrerequisites(matterId, milestoneId, body, ifMatch)
    matterPaths(matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}
