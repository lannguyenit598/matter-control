'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError, ZodType, z } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import { proofRepository } from './repository'
import {
  applicabilityInputSchema,
  assessInputSchema,
  claimInputSchema,
  createDocumentInputSchema,
  criterionInputSchema,
  promoteInputSchema,
  reasonedInputSchema,
  resolveInputSchema,
  reviseCriterionInputSchema,
  signatureInputSchema,
  submitEvidenceInputSchema,
  verifierInputSchema,
} from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input; the API still decides every right per call. Only document creation and evidence
 * submission are receipted (contract §2.1/§2.4); every other command is CAS/epoch-guarded and is
 * therefore never resent after an unknown outcome.
 */

function invalid(error: ZodError): McActionResult {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

const refresh = (matterId: string, itemId?: string) => {
  revalidatePath(`/matters/${matterId}`)
  revalidatePath(`/matters/${matterId}/documents`, 'layout')
  revalidatePath(`/matters/${matterId}/work`)
  revalidatePath('/my-actions')
  if (itemId) revalidatePath(`/matters/${matterId}/work/${itemId}`)
}

type Guarded<T> = (data: T) => Promise<{ id?: string; replayed?: boolean } | void>

function command<S extends ZodType>(schema: S, run: Guarded<z.infer<S>>) {
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

const criterionBody = (d: {
  title: string
  description: string
  mandatory: string
  versionRule: string
  documentId: string
  fixedVersionId: string
  validDays: number
}) => ({
  title: d.title,
  description: d.description,
  mandatory: d.mandatory === 'yes',
  versionRule: d.versionRule,
  documentId: d.versionRule === 'CURRENT_AUTHORITATIVE' ? d.documentId : '',
  fixedVersionId: d.versionRule === 'FIXED' ? d.fixedVersionId : '',
  validDays: d.validDays,
})

export const createDocumentAction = command(createDocumentInputSchema, async (d) => {
  const res = await proofRepository.createDocument(d.matterId, d.name, d.idempotencyKey)
  refresh(d.matterId)
  return { id: res.data.id, replayed: res.replayed }
})

export const promoteVersionAction = command(promoteInputSchema, async (d) => {
  await proofRepository.promote(
    d.matterId,
    d.documentId,
    {
      targetVersionId: d.targetVersionId,
      expectedCurrentVersionId: d.expectedCurrentVersionId,
      reason: d.reason,
      impactToken: d.impactToken,
    },
    d.ifMatch,
  )
  refresh(d.matterId)
})

export const recordSignatureAction = command(signatureInputSchema, async (d) => {
  await proofRepository.recordSignature(d.matterId, d.versionId, {
    signer: d.signer,
    signedAt: d.signedAt,
  })
  refresh(d.matterId)
})

export const createCriterionAction = command(criterionInputSchema, async (d) => {
  await proofRepository.createCriterion(d.matterId, d.itemId, criterionBody(d))
  refresh(d.matterId, d.itemId)
})

export const reviseCriterionAction = command(reviseCriterionInputSchema, async (d) => {
  await proofRepository.reviseCriterion(
    d.matterId,
    d.itemId,
    d.criterionId,
    { reason: d.reason, retire: d.retire === 'yes', criterion: criterionBody(d) },
    d.ifMatch,
  )
  refresh(d.matterId, d.itemId)
})

export const setApplicabilityAction = command(applicabilityInputSchema, async (d) => {
  await proofRepository.setApplicability(
    d.matterId,
    d.itemId,
    { notRequired: d.notRequired === 'yes', reason: d.reason },
    d.ifMatch,
  )
  refresh(d.matterId, d.itemId)
})

export const submitEvidenceAction = command(submitEvidenceInputSchema, async (d) => {
  const res = await proofRepository.submitEvidence(
    d.matterId,
    {
      versionId: d.versionId,
      reference: d.versionId ? '' : d.reference,
      description: d.description,
      validFrom: d.validFrom,
      validUntil: d.validUntil,
      claims: list(d.claims),
    },
    d.idempotencyKey,
  )
  refresh(d.matterId)
  return { id: res.data.id, replayed: res.replayed }
})

export const addClaimAction = command(claimInputSchema, async (d) => {
  await proofRepository.addClaim(d.matterId, d.evidenceId, d.criterionId)
  refresh(d.matterId)
})

export const withdrawEvidenceAction = command(reasonedInputSchema, async (d) => {
  await proofRepository.reasoned(d.matterId, 'evidence', d.targetId, 'withdrawal', d.reason)
  refresh(d.matterId)
})

export const revokeAssessmentAction = command(reasonedInputSchema, async (d) => {
  await proofRepository.reasoned(d.matterId, 'assessments', d.targetId, 'revocation', d.reason)
  refresh(d.matterId)
})

export const raiseDisputeAction = command(reasonedInputSchema, async (d) => {
  await proofRepository.reasoned(d.matterId, 'assessments', d.targetId, 'disputes', d.reason)
  refresh(d.matterId)
})

export const assessClaimAction = command(assessInputSchema, async (d) => {
  await proofRepository.assess(d.matterId, d.claimId, {
    verdict: d.verdict,
    rationale: d.rationale,
    expectedSubjectEpoch: d.expectedSubjectEpoch,
    assessedVersionId: d.assessedVersionId,
    validDays: d.validDays,
    expectedAssessmentId: d.expectedAssessmentId,
  })
  refresh(d.matterId)
})

export const resolveDisputeAction = command(resolveInputSchema, async (d) => {
  await proofRepository.resolve(d.matterId, d.disputeId, d.resolution)
  refresh(d.matterId)
})

export const setVerifierAction = command(verifierInputSchema, async (d) => {
  await proofRepository.setVerifier(d.matterId, d.userId, d.revoke)
  refresh(d.matterId)
})
