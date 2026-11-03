'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError, ZodType, z } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { filingRepository } from './repository'
import {
  advanceInputSchema,
  applicabilityInputSchema,
  correctionInputSchema,
  createFilingInputSchema,
  negativeInputSchema,
  ownerStepInputSchema,
} from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input; the API still decides every right per call. Only filing creation is receipted; every
 * stage command is guarded by the filing's ETag and is never resent after an unknown outcome
 * (the append-only observations show what was recorded).
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

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

const refresh = (matterId: string, filingId?: string) => {
  revalidatePath(`/matters/${matterId}/filings`)
  revalidatePath(`/matters/${matterId}/work`)
  revalidatePath('/my-actions')
  if (filingId) {
    revalidatePath(`/matters/${matterId}/filings/${filingId}`)
    revalidatePath(`/matters/${matterId}/work/${filingId}`)
  }
}

export const createFilingAction = command(createFilingInputSchema, async (d) => {
  const res = await filingRepository.create(
    d.matterId,
    {
      title: d.title,
      outcome: d.outcome,
      requirementId: d.requirementId,
      authorityPartyId: d.authorityPartyId,
      ownerId: d.ownerId,
      proofRequired: d.proofRequired === 'yes',
    },
    d.idempotencyKey,
  )
  refresh(d.matterId)
  return { id: res.data.id, replayed: res.replayed }
})

export const advanceFilingAction = command(advanceInputSchema, async (d) => {
  await filingRepository.command(
    d.matterId,
    d.filingId,
    'stage',
    {
      to: d.to,
      reference: d.reference,
      observedAt: d.observedAt,
      evidenceIds: list(d.evidenceIds),
      versionIds: list(d.versionIds),
      externalRefs: d.externalRefs
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      requestRef: d.requestRef,
      cycleOwnerId: d.cycleOwnerId,
      cycleDue: d.cycleDue,
      reason: d.reason,
    },
    d.ifMatch,
  )
  refresh(d.matterId, d.filingId)
})

export const recordNegativeAction = command(negativeInputSchema, async (d) => {
  await filingRepository.command(
    d.matterId,
    d.filingId,
    'negative-outcome',
    {
      outcome: d.outcome,
      reference: d.reference,
      observedAt: d.observedAt,
      evidenceIds: list(d.evidenceIds),
    },
    d.ifMatch,
  )
  refresh(d.matterId, d.filingId)
})

export const filingOwnerStepAction = command(ownerStepInputSchema, async (d) => {
  await filingRepository.command(d.matterId, d.filingId, d.step, { reason: d.reason }, d.ifMatch)
  refresh(d.matterId, d.filingId)
})

export const setSignatureApplicabilityAction = command(applicabilityInputSchema, async (d) => {
  await filingRepository.command(
    d.matterId,
    d.filingId,
    'signature-applicability',
    { signatureNotRequired: d.signatureNotRequired === 'yes', reason: d.reason },
    d.ifMatch,
  )
  refresh(d.matterId, d.filingId)
})

export const correctObservationAction = command(correctionInputSchema, async (d) => {
  await filingRepository.correct(
    d.matterId,
    d.filingId,
    d.observationId,
    { reference: d.reference, observedAt: d.observedAt, reason: d.reason },
    d.ifMatch,
  )
  refresh(d.matterId, d.filingId)
})
