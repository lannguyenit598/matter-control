// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
const auth = vi.hoisted(() => ({ requireSession: vi.fn() }))
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  requireSession: auth.requireSession,
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import { reconcileTermSheetImportAction } from './actions'

const MATTER = '01900000-0000-7000-8000-0000000000aa'
const VERSION = '01900000-0000-7000-8000-0000000000bb'
const KEY = '01900000-0000-7000-8000-0000000000cc'
const input = { matterId: MATTER, idempotencyKey: KEY, documentVersionId: VERSION }
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const receipt = (over: Record<string, unknown> = {}) => ({
  idempotencyKey: KEY,
  kind: 'TERM_SHEET_IMPORTED',
  statusCode: 200,
  committedAt: '2026-11-06T08:00:00Z',
  workspace: null,
  matter: null,
  requirement: null,
  termSheet: { documentVersionId: VERSION, created: 2, replaced: 1, unchanged: 3 },
  ...over,
})

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  auth.requireSession.mockResolvedValue({ userId: 'u', permissions: ['*'], accessToken: 'TOKEN' })
})
afterEach(() => vi.unstubAllGlobals())

describe('reconcileTermSheetImportAction', () => {
  it('confirms a receipt that matches the key, kind and source version', async () => {
    fetchMock.mockResolvedValueOnce(json(receipt()))
    const r = await reconcileTermSheetImportAction(input)
    expect(r).toEqual({ ok: true, created: 2, replaced: 1, unchanged: 3 })
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit]
    expect(new URL(url).pathname).toBe(`/api/v1/matters/${MATTER}/operations/${KEY}/reconciliation`)
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Idempotency-Key')).toBeNull()
  })

  it.each([
    ['another kind', receipt({ kind: 'RECORD_CREATED', termSheet: undefined })],
    [
      'another source version',
      receipt({
        termSheet: {
          documentVersionId: '01900000-0000-7000-8000-0000000000dd',
          created: 1,
          replaced: 0,
          unchanged: 0,
        },
      }),
    ],
    ['another key', receipt({ idempotencyKey: '01900000-0000-7000-8000-0000000000ee' })],
  ])('keeps the attempt unconfirmed for %s', async (_, body) => {
    fetchMock.mockResolvedValueOnce(json(body))
    const r = await reconcileTermSheetImportAction(input)
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown', retrySameKey: true })
  })

  it.each([
    ['no receipt (404)', 404],
    ['a transient failure (503)', 503],
  ])('keeps the attempt unconfirmed for %s', async (_, status) => {
    fetchMock.mockResolvedValueOnce(json({ title: 'x', status }, status))
    const r = await reconcileTermSheetImportAction(input)
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown', retrySameKey: true })
  })

  it('refuses malformed input before calling the API', async () => {
    const r = await reconcileTermSheetImportAction({ ...input, idempotencyKey: 'nope' })
    expect(r).toMatchObject({ ok: false, kind: 'validation' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
