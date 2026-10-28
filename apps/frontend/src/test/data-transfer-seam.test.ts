// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
vi.mock('@/lib/auth', () => ({
  requireSession: async () => ({ userId: 'u', permissions: ['*'], accessToken: 'USER-TOKEN' }),
}))
const recovery = vi.hoisted(() => ({ session: {} }))
vi.mock('@/features/data-transfer/recovery-session', () => ({
  recoverySession: async () => recovery.session,
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import {
  briefAction,
  bulkCommitAction,
  bulkPreviewAction,
  importCommitAction,
  importPreviewAction,
} from '@/features/data-transfer/actions'
import { newIdempotencyKey } from '@/lib/mc/idempotency'

const M = '0192b1c4-0000-7000-8000-000000000001'
const ITEM = '0192b1c4-0000-7000-8000-000000000002'

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  recovery.session = {}
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [URL | string, RequestInit]
  return { url: String(url), init, headers: new Headers(init.headers) }
}

const commitInput = () => ({
  attemptKey: newIdempotencyKey(),
  rows: [
    {
      rowKey: 'row-1',
      itemId: ITEM,
      expectedRevision: 1,
      title: 'Renamed',
      idempotencyKey: newIdempotencyKey(),
    },
  ],
})

describe('bulk edit at the action → repository → client seam', () => {
  it('posts the frozen intent to the slash route, receipted by the keys in its body', async () => {
    fetchMock.mockResolvedValue(
      json([{ rowKey: 'row-1', itemId: ITEM, status: 'SUCCESS', revision: 2 }]),
    )
    const input = commitInput()
    const r = await bulkCommitAction(M, input)
    expect(r).toMatchObject({
      ok: true,
      results: [{ rowKey: 'row-1', status: 'SUCCESS', revision: 2 }],
    })
    const { url, init, headers } = call()
    expect(url).toBe(`http://api.test/api/v1/matters/${M}/bulk/commit`)
    expect(JSON.parse(String(init.body))).toEqual(input) // exactly the keys the browser minted
    expect(headers.has('idempotency-key')).toBe(false)
  })

  it('treats a lost answer as unknown and safe to retry with the same keys', async () => {
    fetchMock.mockRejectedValue(new TypeError('socket hang up'))
    const r = await bulkCommitAction(M, commitInput())
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown', retrySameKey: true })
    expect('requiresReread' in r && r.requiresReread).toBeFalsy()
    expect(fetchMock).toHaveBeenCalledTimes(1) // never resent behind the user's back
  })

  it('refuses keys that are not UUIDv7 before anything is sent', async () => {
    const bad = commitInput()
    bad.rows[0]!.idempotencyKey = crypto.randomUUID() // v4
    expect(await bulkCommitAction(M, bad)).toMatchObject({ ok: false, kind: 'validation' })
    expect(await bulkCommitAction(M, { ...commitInput(), rows: [] })).toMatchObject({
      ok: false,
      kind: 'validation',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts the exact wire shape the backend produces for a preview', async () => {
    fetchMock.mockResolvedValue(
      json({
        previewId: 'abc',
        asOf: '2026-10-27T09:00:00Z',
        rows: [
          {
            rowKey: 'row-1',
            itemId: ITEM,
            found: true,
            title: 'Old',
            outcome: 'x',
            owner: null,
            due: null,
            revision: 1,
            valid: true,
          },
        ],
      }),
    )
    const r = await bulkPreviewAction(M, [
      { rowKey: 'row-1', itemId: ITEM, expectedRevision: 1, title: 'New' },
    ])
    expect(r).toMatchObject({ ok: true, preview: { rows: [{ found: true, valid: true }] } })
    expect(call().url).toBe(`http://api.test/api/v1/matters/${M}/bulk/preview`)
  })

  it('does not take a refusal for an unknown outcome', async () => {
    fetchMock.mockResolvedValue(json({ type: 'urn:mc:forbidden' }, 403))
    expect(await bulkCommitAction(M, commitInput())).toMatchObject({ ok: false, kind: 'forbidden' })
  })
})

describe('import at the same seam', () => {
  const file = () =>
    new File(['rowkey,kind,title\nR1,ACTION,x\n'], 'counsel.csv', { type: 'text/csv' })

  it('uploads the file with its frozen plan and recovers a lost answer by the same keys', async () => {
    const plan = { runKey: newIdempotencyKey(), rowKeys: { R1: newIdempotencyKey() } }
    fetchMock.mockRejectedValue(new TypeError('terminated'))
    const r = await importCommitAction(M, file(), plan)
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown', retrySameKey: true })
    const { url, init } = call()
    expect(url).toBe(`http://api.test/api/v1/matters/${M}/import/commit`)
    const form = init.body as FormData
    expect(form.get('sourceName')).toBe('counsel.csv')
    expect(form.get('format')).toBe('csv')
    expect(JSON.parse(String(form.get('plan')))).toEqual(plan)
    expect(form.get('file')).toBeInstanceOf(Blob)
  })

  it('refuses a plan with a key that is not UUIDv7, and a preview parses the backend shape', async () => {
    expect(
      await importCommitAction(M, file(), {
        runKey: newIdempotencyKey(),
        rowKeys: { R1: 'not-a-key' },
      }),
    ).toMatchObject({ ok: false, kind: 'validation' })
    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockResolvedValue(
      json({
        sourceName: 'counsel.csv',
        asOf: '2026-10-27T09:00:00Z',
        rows: [
          {
            rowKey: 'A1',
            kind: 'ACTION',
            title: 'Prepare',
            owner: null,
            due: null,
            dependencies: ['R1'],
            contentHash: 'ab',
            errors: [],
          },
        ],
        groups: [{ id: 1, rowIdx: [0], valid: true }],
      }),
    )
    expect(await importPreviewAction(M, file())).toMatchObject({
      ok: true,
      preview: { rows: [{ dependencies: ['R1'] }] },
    })
    expect(call().url).toBe(`http://api.test/api/v1/matters/${M}/import/preview`)
  })
})

describe('brief at the same seam', () => {
  const T1 = '2026-10-01T00:00:00Z'
  const T2 = '2026-10-27T00:00:00Z'
  const wire = {
    matterId: M,
    t1: T1,
    t2: T2,
    asOf: '2026-10-27T09:00:00Z',
    changes: [
      {
        seq: 3,
        id: 'e1',
        type: 'work.execution_changed',
        targetKind: 'ACTION',
        targetId: ITEM,
        actorId: null,
        reason: null,
        recordedAt: '2026-10-20T00:00:00Z',
        effectiveAt: '2026-10-20T00:00:00Z',
        lateRecorded: false,
      },
    ],
    outstanding: [
      {
        itemId: ITEM,
        kind: 'ACTION',
        title: 'File',
        owner: null,
        due: null,
        execution: 'IN_PROGRESS',
        dependency: 'READY',
        revision: 2,
        proofExpired: false,
      },
    ],
  }

  it('asks for the window and parses the backend shape', async () => {
    fetchMock.mockResolvedValue(json(wire))
    const r = await briefAction(M, T1, T2)
    expect(r).toMatchObject({
      ok: true,
      brief: { changes: [{ lateRecorded: false }], outstanding: [{ proofExpired: false }] },
    })
    const { url } = call()
    expect(url).toContain(`/matters/${M}/brief?`)
    expect(url).toContain('t1=2026-10-01T00%3A00%3A00Z')
  })

  it('rejects a malformed or reversed window without calling the API', async () => {
    expect(await briefAction(M, 'yesterday', T2)).toMatchObject({
      ok: false,
      kind: 'validation',
      fieldErrors: { t1: expect.any(Array) },
    })
    expect(await briefAction(M, T2, T1)).toMatchObject({
      ok: false,
      kind: 'validation',
      fieldErrors: { t2: expect.any(Array) },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('explains a window the server refuses and an incomplete history, as different things', async () => {
    fetchMock.mockResolvedValueOnce(json({ type: 'urn:mc:invalid-window' }, 400))
    expect(await briefAction(M, T1, T2)).toMatchObject({
      ok: false,
      kind: 'validation',
      fieldErrors: { t2: expect.any(Array) },
    })
    fetchMock.mockResolvedValueOnce(json({ type: 'urn:mc:brief-unreconstructable' }, 500))
    const r = await briefAction(M, T1, T2)
    expect(r).toMatchObject({ ok: false, kind: 'error' })
    expect((r as { error: string }).error).toMatch(/history behind this window is incomplete/)
  })
})
