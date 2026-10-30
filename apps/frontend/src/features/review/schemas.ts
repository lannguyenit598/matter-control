import { z } from 'zod'

import { idSchema, pageOf } from '@/lib/mc/schemas'

/** Wire shapes of the manual review matrix (docs/api.md, "Review matrix"). */

export const REVIEW_CELL_STATES = ['PENDING', 'REVIEWED', 'ABSENT', 'UNABLE'] as const
export type ReviewCellState = (typeof REVIEW_CELL_STATES)[number]
export const REVIEW_ANSWER_STATES = ['REVIEWED', 'ABSENT', 'UNABLE'] as const

export const reviewGridSchema = z.object({
  id: z.string(),
  name: z.string(),
  revision: z.number().int(),
  createdBy: z.string(),
  createdAt: z.string(),
  versionCount: z.number().int(),
  questionCount: z.number().int(),
})

const reviewVersionSchema = z.object({
  versionId: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  filename: z.string(),
  no: z.number().int(),
  /** A neutral fact about the document's current pointer, never "superseded". */
  current: z.boolean(),
})

export const reviewQuestionSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  revision: z.number().int(),
  text: z.string(),
  revisedBy: z.string(),
  revisedAt: z.string(),
})

export const reviewAnswerSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  questionId: z.string(),
  questionRevision: z.number().int(),
  state: z.enum(REVIEW_ANSWER_STATES),
  text: z.string(),
  /** Typed by a person; never validated against the document. */
  pageRef: z.string(),
  quoteRef: z.string(),
  author: z.string(),
  answeredAt: z.string(),
  supersedesId: z.string().nullable(),
})

export const reviewCellSchema = z.object({
  versionId: z.string(),
  questionId: z.string(),
  state: z.enum(REVIEW_CELL_STATES),
  /** The question changed after this answer. */
  stale: z.boolean(),
  answer: reviewAnswerSchema.nullable(),
})

export const reviewGridViewSchema = reviewGridSchema.extend({
  versions: z.array(reviewVersionSchema),
  questions: z.array(reviewQuestionSchema),
  questionHistory: z.array(reviewQuestionSchema),
  cells: z.array(reviewCellSchema),
})

export const reviewGridPageSchema = pageOf(reviewGridSchema)
export const reviewAnswerPageSchema = pageOf(reviewAnswerSchema)
export const reviewCreatedSchema = z.object({
  id: z.string(),
  kind: z.string(),
  seq: z.number().int(),
})

export type ReviewGrid = z.infer<typeof reviewGridSchema>
export type ReviewGridView = z.infer<typeof reviewGridViewSchema>
export type ReviewCell = z.infer<typeof reviewCellSchema>
export type ReviewAnswer = z.infer<typeof reviewAnswerSchema>
export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>

// ---- command inputs (untrusted: every Server Action re-validates) ----

const key = z.string().min(1).max(100)
const etag = z.string().min(1).max(200)
const text = (max: number, msg: string) => z.string().trim().min(1, msg).max(max)

export const createReviewGridInputSchema = z.object({
  idempotencyKey: key,
  matterId: idSchema,
  name: text(200, 'Enter a name'),
})

export const reviewVersionInputSchema = z.object({
  matterId: idSchema,
  gridId: idSchema,
  ifMatch: etag,
  versionId: idSchema,
})

export const reviewQuestionInputSchema = z.object({
  matterId: idSchema,
  gridId: idSchema,
  ifMatch: etag,
  text: text(1000, 'Enter the question'),
})

export const reviseQuestionInputSchema = reviewQuestionInputSchema.extend({ questionId: idSchema })

/** One history continuation read: the addressed cell plus the previous page's opaque cursor. */
export const reviewHistoryInputSchema = z.object({
  matterId: idSchema,
  gridId: idSchema,
  versionId: idSchema,
  questionId: idSchema,
  cursor: z.string().min(1).max(2000),
})

export const recordAnswerInputSchema = z
  .object({
    idempotencyKey: key,
    matterId: idSchema,
    gridId: idSchema,
    versionId: idSchema,
    questionId: idSchema,
    /** The id of the cell's current answer, or "" when it has none. */
    expectedAnswerId: z.union([z.literal(''), idSchema]),
    /** The wording revision the person answered; a question reworded since is a conflict. */
    expectedQuestionRevision: z.number().int().min(1),
    state: z.enum(REVIEW_ANSWER_STATES),
    text: z.string().trim().max(4000),
    pageRef: z.string().trim().max(40),
    quoteRef: z.string().trim().max(1000),
  })
  .refine((v) => v.state === 'ABSENT' || v.text.length > 0, {
    path: ['text'],
    message: 'Describe what you found',
  })
