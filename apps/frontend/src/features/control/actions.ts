'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError, ZodType, z } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { controlRepository } from './repository'
import { createContextInputSchema, updateContextInputSchema } from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input; the API still decides every right per call. Only creation is receipted; updating a record
 * is guarded by its ETag and is never resent after an unknown outcome.
 */

function invalid(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

function command<S extends ZodType>(
  schema: S,
  run: (data: z.infer<S>) => Promise<{ id?: string; replayed?: boolean } | void>,
) {
  return async (input: unknown): Promise<McActionResult> => {
    try {
      await requireSession()
      const p = schema.safeParse(input)
      if (!p.success) return invalid(p.error)
      const out = await run(p.data)
      return { ok: true, ...(out ?? {}) }
    } catch (error) {
      return toMcFailure(error)
    }
  }
}

const refresh = (matterId: string) => {
  revalidatePath(`/matters/${matterId}/control-room`)
  revalidatePath(`/matters/${matterId}`)
}

export const createContextAction = command(createContextInputSchema, async (d) => {
  const res = await controlRepository.create(
    d.matterId,
    {
      kind: d.kind,
      title: d.title,
      body: d.body,
      links: d.links
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    },
    d.idempotencyKey,
  )
  refresh(d.matterId)
  return { id: res.data.id, replayed: res.replayed }
})

export const updateContextAction = command(updateContextInputSchema, async (d) => {
  await controlRepository.update(
    d.matterId,
    d.recordId,
    d.action === 'close' ? { close: true, reason: d.reason } : { reopen: true },
    d.ifMatch,
  )
  refresh(d.matterId)
})
