'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'

import { requireSession } from '@/lib/auth'
import { toMcFailure, type McActionResult } from '@/lib/mc/action-result'

import type { ReviewAnswer } from './schemas'

import { reviewRepository } from './repository'
import {
  createReviewGridInputSchema,
  recordAnswerInputSchema,
  reviewHistoryInputSchema,
  reviewQuestionInputSchema,
  reviewVersionInputSchema,
  reviseQuestionInputSchema,
} from './schemas'

/*
 * Server Actions are public POST endpoints: each checks the session first, then re-validates its
 * input; the API still decides every right per call. Creating a grid and recording an answer are
 * receipted (the same key is resent after an unknown outcome); structure changes are guarded by the
 * grid ETag and are re-read, never resent.
 */

function invalid(error: ZodError): Extract<McActionResult, { ok: false }> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues)
    (fieldErrors[String(issue.path[0] ?? 'form')] ??= []).push(issue.message)
  return { ok: false, kind: 'validation', error: 'Please fix the highlighted fields.', fieldErrors }
}

const reviewPaths = (matterId: string) => revalidatePath(`/matters/${matterId}/reviews`)

export async function createReviewGridAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = createReviewGridInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await reviewRepository.createGrid(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function addReviewVersionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = reviewVersionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await reviewRepository.addVersion(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function removeReviewVersionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = reviewVersionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await reviewRepository.removeVersion(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function addReviewQuestionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = reviewQuestionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await reviewRepository.addQuestion(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function reviseReviewQuestionAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = reviseQuestionInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    await reviewRepository.reviseQuestion(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true }
  } catch (error) {
    return toMcFailure(error)
  }
}

export async function recordReviewAnswerAction(input: unknown): Promise<McActionResult> {
  try {
    await requireSession()
    const p = recordAnswerInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const res = await reviewRepository.recordAnswer(p.data)
    reviewPaths(p.data.matterId)
    return { ok: true, id: res.data.id, replayed: res.replayed }
  } catch (error) {
    return toMcFailure(error)
  }
}

/** One authorized history continuation read; a definitive denial clears the surface client-side. */
export async function reviewHistoryAction(
  input: unknown,
): Promise<
  | { ok: true; items: ReviewAnswer[]; nextCursor: string | null }
  | Extract<McActionResult, { ok: false }>
> {
  try {
    await requireSession()
    const p = reviewHistoryInputSchema.safeParse(input)
    if (!p.success) return invalid(p.error)
    const page = await reviewRepository.history(
      p.data.matterId,
      p.data.gridId,
      p.data.versionId,
      p.data.questionId,
      p.data.cursor,
    )
    return { ok: true, items: page.items, nextCursor: page.nextCursor }
  } catch (error) {
    // toMcFailure only ever produces a failure kind.
    return toMcFailure(error) as Extract<McActionResult, { ok: false }>
  }
}
