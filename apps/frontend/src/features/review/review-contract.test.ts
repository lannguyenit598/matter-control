// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
vi.mock('@/lib/auth', () => ({
  requireSession: async () => ({ userId: 'u', permissions: ['*'], accessToken: 'USER-TOKEN' }),
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import {
  addReviewQuestionAction,
  addReviewVersionAction,
  createReviewGridAction,
  recordReviewAnswerAction,
  removeReviewVersionAction,
} from './actions'
import { reviewGridViewSchema } from './schemas'

const M = '0192b1c4-0000-7000-8000-000000000001'
const G = '0192b1c4-0000-7000-8000-000000000002'
const V = '0192b1c4-0000-7000-8000-000000000003'
const Q = '0192b1c4-0000-7000-8000-000000000004'
const KEY = '0192b1c4-0000-7000-8000-0000000000aa'
const ETAG = '"grid-3"'

const base = `http://api.test/api/v1/matters/${M}/review-grids`

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const sent = () => {
  const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit]
  const h = new Headers(init.headers)
  return {
    url: String(url),
    method: init.method,
    ifMatch: h.get('If-Match'),
    key: h.get('Idempotency-Key'),
    body: init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined,
  }
}

const gridView = {
  id: G,
  name: 'DD',
  revision: 4,
  createdBy: 'u',
  createdAt: '2026-10-29T08:00:00Z',
  versionCount: 1,
  questionCount: 1,
  versions: [
    {
      versionId: V,
      documentId: 'd',
      documentName: 'SPA',
      filename: 'spa.pdf',
      no: 1,
      current: false,
    },
  ],
  questions: [
    {
      id: Q,
      position: 0,
      revision: 2,
      text: 'Q?',
      revisedBy: 'u',
      revisedAt: '2026-10-29T08:00:00Z',
    },
  ],
  questionHistory: [],
  cells: [{ versionId: V, questionId: Q, state: 'PENDING', stale: false, answer: null }],
}

describe('review wire contract', () => {
  it('accepts a full grid view and rejects a state the API never sends', () => {
    expect(reviewGridViewSchema.safeParse(gridView).success).toBe(true)
    const bad = { ...gridView, cells: [{ ...gridView.cells[0], state: 'OCR_ERROR' }] }
    expect(reviewGridViewSchema.safeParse(bad).success).toBe(false)
  })

  it('creating a grid is receipted: one key, no If-Match', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: G, kind: 'REVIEW_GRID', seq: 7 }), { status: 201 }),
    )
    const res = await createReviewGridAction({
      idempotencyKey: KEY,
      matterId: M,
      name: '  Change of control  ',
    })
    expect(res).toMatchObject({ ok: true, id: G })
    expect(sent()).toMatchObject({
      url: base,
      method: 'POST',
      key: KEY,
      ifMatch: null,
      body: { name: 'Change of control' },
    })
  })

  it('structure commands carry the grid ETag and no idempotency key', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(gridView), { status: 200 }))
    expect(
      await addReviewVersionAction({ matterId: M, gridId: G, ifMatch: ETAG, versionId: V }),
    ).toEqual({ ok: true })
    expect(sent()).toMatchObject({
      url: `${base}/${G}/versions`,
      ifMatch: ETAG,
      key: null,
      body: { versionId: V },
    })
    fetchMock.mockClear()
    await removeReviewVersionAction({ matterId: M, gridId: G, ifMatch: ETAG, versionId: V })
    expect(sent()).toMatchObject({ url: `${base}/${G}/versions/${V}/removal`, ifMatch: ETAG })
    fetchMock.mockClear()
    await addReviewQuestionAction({ matterId: M, gridId: G, ifMatch: ETAG, text: 'Assignment?' })
    expect(sent()).toMatchObject({ url: `${base}/${G}/questions`, body: { text: 'Assignment?' } })
  })

  it('an answer sends the expected answer id and one key; "" means none', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'a1', kind: 'REVIEW_ANSWER', seq: 9 }), { status: 201 }),
    )
    const input = {
      idempotencyKey: KEY,
      matterId: M,
      gridId: G,
      versionId: V,
      questionId: Q,
      expectedAnswerId: '',
      expectedQuestionRevision: 2,
      state: 'REVIEWED',
      text: ' Clause 12.3 ',
      pageRef: ' 14 ',
      quoteRef: 'as written',
    }
    expect(await recordReviewAnswerAction(input)).toMatchObject({ ok: true, id: 'a1' })
    expect(sent()).toMatchObject({
      url: `${base}/${G}/answers`,
      key: KEY,
      ifMatch: null,
      body: {
        expectedAnswerId: '',
        questionRevision: 2,
        state: 'REVIEWED',
        text: 'Clause 12.3',
        pageRef: '14',
        quoteRef: 'as written',
      },
    })
  })

  it('a stale answer maps to the stale outcome; a lost answer is UNKNOWN and must reuse the key', async () => {
    const input = {
      idempotencyKey: KEY,
      matterId: M,
      gridId: G,
      versionId: V,
      questionId: Q,
      expectedAnswerId: '',
      expectedQuestionRevision: 2,
      state: 'ABSENT',
      text: '',
      pageRef: '',
      quoteRef: '',
    }
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          type: 'urn:mc:precondition-failed',
          title: 'Precondition Failed',
          status: 412,
        }),
        {
          status: 412,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    )
    expect(await recordReviewAnswerAction(input)).toMatchObject({ ok: false, kind: 'stale' })
    fetchMock.mockRejectedValueOnce(new TypeError('socket closed'))
    expect(await recordReviewAnswerAction(input)).toMatchObject({
      ok: false,
      kind: 'outcome-unknown',
      retrySameKey: true,
    })
  })

  it('refuses bad input before any request', async () => {
    const base = {
      idempotencyKey: KEY,
      matterId: M,
      gridId: G,
      versionId: V,
      questionId: Q,
      expectedAnswerId: '',
      expectedQuestionRevision: 2,
    }
    for (const bad of [
      { ...base, state: 'REVIEWED', text: '', pageRef: '', quoteRef: '' }, // REVIEWED needs text
      { ...base, state: 'REVIEWED', text: 'x', pageRef: '9'.repeat(41), quoteRef: '' },
      { ...base, state: 'REVIEWED', text: 'x', pageRef: '', quoteRef: 'q'.repeat(1001) },
      { ...base, state: 'OCR_ERROR', text: 'x', pageRef: '', quoteRef: '' },
      {
        ...base,
        expectedQuestionRevision: 0,
        state: 'ABSENT',
        text: '',
        pageRef: '',
        quoteRef: '',
      }, // the wording seen is required
      { ...base, versionId: '../etc/passwd', state: 'ABSENT', text: '', pageRef: '', quoteRef: '' },
    ]) {
      expect(await recordReviewAnswerAction(bad)).toMatchObject({ ok: false, kind: 'validation' })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
