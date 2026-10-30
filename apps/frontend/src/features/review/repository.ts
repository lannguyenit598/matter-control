import 'server-only'

import type { z } from 'zod'

import { mcRequest, pathId } from '@/lib/mc/client'

import {
  reviewAnswerPageSchema,
  reviewCreatedSchema,
  reviewGridPageSchema,
  reviewGridViewSchema,
  type createReviewGridInputSchema,
  type recordAnswerInputSchema,
  type reviewQuestionInputSchema,
  type reviewVersionInputSchema,
  type reviseQuestionInputSchema,
} from './schemas'

const grids = (matterId: string) => `/matters/${pathId(matterId)}/review-grids`
const grid = (matterId: string, gridId: string) => `${grids(matterId)}/${pathId(gridId)}`

/** Review-matrix reads and commands. Every call carries the user's own token. */
export const reviewRepository = {
  list: async (matterId: string) => {
    const res = await mcRequest(grids(matterId), { schema: reviewGridPageSchema })
    return { items: res.data.items, asOf: res.asOf }
  },

  /** The ETag is the grid revision tag: send it back as If-Match on a structure change. */
  get: async (matterId: string, gridId: string) => {
    const res = await mcRequest(grid(matterId, gridId), { schema: reviewGridViewSchema })
    return { view: res.data, etag: res.etag, asOf: res.asOf }
  },

  /** One newest-first history page of one cell. nextCursor is null on the last page and the
   * envelope truthfully omits any total (a keyset page does not count the trail). */
  history: async (
    matterId: string,
    gridId: string,
    versionId: string,
    questionId: string,
    cursor?: string,
  ) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    const res = await mcRequest(
      `${grid(matterId, gridId)}/cells/${pathId(versionId)}/${pathId(questionId)}/history${query}`,
      { schema: reviewAnswerPageSchema },
    )
    return { items: res.data.items, nextCursor: res.data.page.nextCursor }
  },

  // ---- commands ----

  createGrid: (input: z.infer<typeof createReviewGridInputSchema>) =>
    mcRequest(grids(input.matterId), {
      method: 'POST',
      body: { name: input.name },
      idempotencyKey: input.idempotencyKey,
      schema: reviewCreatedSchema,
    }),

  addVersion: (input: z.infer<typeof reviewVersionInputSchema>) =>
    mcRequest(`${grid(input.matterId, input.gridId)}/versions`, {
      method: 'POST',
      body: { versionId: input.versionId },
      ifMatch: input.ifMatch,
      schema: reviewGridViewSchema,
    }),

  removeVersion: (input: z.infer<typeof reviewVersionInputSchema>) =>
    mcRequest(`${grid(input.matterId, input.gridId)}/versions/${pathId(input.versionId)}/removal`, {
      method: 'POST',
      ifMatch: input.ifMatch,
      schema: reviewGridViewSchema,
    }),

  addQuestion: (input: z.infer<typeof reviewQuestionInputSchema>) =>
    mcRequest(`${grid(input.matterId, input.gridId)}/questions`, {
      method: 'POST',
      body: { text: input.text },
      ifMatch: input.ifMatch,
      schema: reviewGridViewSchema,
    }),

  reviseQuestion: (input: z.infer<typeof reviseQuestionInputSchema>) =>
    mcRequest(
      `${grid(input.matterId, input.gridId)}/questions/${pathId(input.questionId)}/revision`,
      {
        method: 'POST',
        body: { text: input.text },
        ifMatch: input.ifMatch,
        schema: reviewGridViewSchema,
      },
    ),

  recordAnswer: (input: z.infer<typeof recordAnswerInputSchema>) =>
    mcRequest(`${grid(input.matterId, input.gridId)}/answers`, {
      method: 'POST',
      body: {
        versionId: input.versionId,
        questionId: input.questionId,
        expectedAnswerId: input.expectedAnswerId,
        questionRevision: input.expectedQuestionRevision,
        state: input.state,
        text: input.text,
        pageRef: input.pageRef,
        quoteRef: input.quoteRef,
      },
      idempotencyKey: input.idempotencyKey,
      schema: reviewCreatedSchema,
    }),
}
