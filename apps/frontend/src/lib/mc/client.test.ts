// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const state = vi.hoisted(() => ({ token: 'USER-TOKEN' as string | undefined }))

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
vi.mock('@/lib/auth', () => ({
  requireSession: async () => {
    if (state.token === 'NONE') {
      throw Object.assign(new Error('Sign-in required'), {
        name: 'AuthError',
        reason: 'unauthenticated',
      })
    }
    return { userId: 'u', permissions: ['*'], accessToken: state.token }
  },
}))

import { McError } from './errors'
import { mcRequest, pathId, problemFrom } from './client'

const schema = z.object({ id: z.string() })
const problem = (status: number, type: string, extra: object = {}) =>
  new Response(JSON.stringify({ type, status, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  state.token = 'USER-TOKEN'
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('mcRequest', () => {
  it('sends the USER token, If-Match and Idempotency-Key and returns ETag/replay metadata', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"id":"w1"}', {
        status: 201,
        headers: {
          ETag: '"abc"',
          'MC-As-Of': '2026-10-27T00:00:00Z',
          'Idempotent-Replayed': 'true',
        },
      }),
    )
    const out = await mcRequest('/workspaces', {
      method: 'POST',
      body: { name: 'A' },
      ifMatch: '"old"',
      idempotencyKey: 'k1',
      schema,
    })
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const h = new Headers(init.headers)
    expect(String(url)).toBe('http://api.test/api/v1/workspaces')
    expect(h.get('authorization')).toBe('Bearer USER-TOKEN')
    expect(h.get('if-match')).toBe('"old"')
    expect(h.get('idempotency-key')).toBe('k1')
    expect(h.get('content-type')).toBe('application/json')
    expect(out).toMatchObject({
      data: { id: 'w1' },
      etag: '"abc"',
      status: 201,
      replayed: true,
      asOf: '2026-10-27T00:00:00Z',
    })
  })

  it('never calls the API without a session (fail closed)', async () => {
    state.token = 'NONE'
    await expect(mcRequest('/workspaces', { schema })).rejects.toMatchObject({ name: 'AuthError' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to send when the session carries no user token (no shared-token fallback)', async () => {
    state.token = undefined
    await expect(mcRequest('/workspaces', { schema })).rejects.toMatchObject({
      code: 'unauthenticated',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [problem(401, 'urn:mc:unauthenticated'), 'unauthenticated'],
    [problem(403, 'urn:mc:forbidden'), 'forbidden'],
    [problem(404, 'urn:mc:not-found'), 'not-found'],
    [problem(412, 'urn:mc:precondition-failed'), 'precondition-failed'],
    [problem(503, 'urn:mc:outcome-unknown'), 'outcome-unknown'],
    [problem(503, 'urn:mc:unavailable', { retryable: true }), 'unavailable'],
    [new Response('<html>bad gateway</html>', { status: 502 }), 'unavailable'],
  ])('maps problem responses to a code', async (response, code) => {
    fetchMock.mockResolvedValue(response)
    await expect(mcRequest('/x', { schema })).rejects.toMatchObject({ code })
  })

  it('a lost answer to a COMMAND is outcome-unknown, but to a READ it is plain unavailable', async () => {
    fetchMock.mockRejectedValue(new TypeError('socket hang up'))
    await expect(mcRequest('/x', { method: 'POST', body: {}, schema })).rejects.toMatchObject({
      code: 'outcome-unknown',
      retryable: false,
    })
    await expect(mcRequest('/x', { schema })).rejects.toMatchObject({
      code: 'unavailable',
      retryable: true,
    })
  })

  it('rejects a response that does not match the schema instead of trusting it', async () => {
    fetchMock.mockResolvedValue(new Response('{"nope":1}', { status: 200 }))
    await expect(mcRequest('/x', { schema })).rejects.toMatchObject({ code: 'internal' })
  })
})

/** A response whose headers arrive but whose body stream fails mid-read. */
function truncated(status: number, headers: Record<string, string> = {}) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(new TypeError('terminated'))
    },
  })
  return new Response(body, { status, headers })
}

describe('lost or unusable command answers (CW1-F02)', () => {
  it('a 201 whose body stream is lost is UNKNOWN for a receipted command, and carries the key flag', async () => {
    fetchMock.mockResolvedValue(truncated(201))
    await expect(
      mcRequest('/workspaces', { method: 'POST', body: {}, idempotencyKey: 'k', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: true })
  })

  it('the same loss for a CAS-only command (no key) is UNKNOWN and NOT receipted', async () => {
    fetchMock.mockResolvedValue(truncated(200))
    await expect(
      mcRequest('/workspaces/w/members', { method: 'POST', body: {}, ifMatch: '"e"', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: false })
  })

  it('a lost body on a READ is plain unavailability, never unknown', async () => {
    fetchMock.mockResolvedValue(truncated(200))
    await expect(mcRequest('/workspaces', { schema })).rejects.toMatchObject({
      code: 'unavailable',
      retryable: true,
    })
  })

  it('a successful command with malformed or schema-violating payload is UNKNOWN, not "internal"', async () => {
    for (const body of ['not json', '{"nope":1}', '']) {
      fetchMock.mockResolvedValue(new Response(body, { status: 201 }))
      await expect(
        mcRequest('/workspaces', { method: 'POST', body: {}, idempotencyKey: 'k', schema }),
      ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: true })
    }
  })

  it('a malformed payload on a READ is a contract error, not an outage', async () => {
    fetchMock.mockResolvedValue(new Response('{"nope":1}', { status: 200 }))
    await expect(mcRequest('/x', { schema })).rejects.toMatchObject({ code: 'internal' })
  })

  it('a definite refusal keeps its meaning even when its body is lost', async () => {
    const cases: [number, string][] = [
      [412, 'precondition-failed'],
      [403, 'forbidden'],
      [404, 'not-found'],
      [401, 'unauthenticated'],
      [422, 'validation'],
    ]
    for (const [status, code] of cases) {
      fetchMock.mockResolvedValue(truncated(status))
      await expect(
        mcRequest('/x', { method: 'POST', body: {}, ifMatch: '"e"', schema }),
      ).rejects.toMatchObject({ code })
    }
  })

  it('a 5xx on a command says nothing about commit: unknown, with or without a body', async () => {
    fetchMock.mockResolvedValue(truncated(502))
    await expect(
      mcRequest('/x', { method: 'POST', body: {}, idempotencyKey: 'k', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: true })
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 }))
    await expect(
      mcRequest('/x', { method: 'POST', body: {}, ifMatch: '"e"', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: false })
    fetchMock.mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 }))
    await expect(mcRequest('/x', { schema })).rejects.toMatchObject({ code: 'unavailable' })
  })

  it('an API-declared outcome-unknown inherits the key flag from the request', async () => {
    fetchMock.mockResolvedValue(problem(503, 'urn:mc:outcome-unknown'))
    await expect(
      mcRequest('/x', { method: 'POST', body: {}, idempotencyKey: 'k', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: true })
    fetchMock.mockResolvedValue(problem(503, 'urn:mc:outcome-unknown'))
    await expect(
      mcRequest('/x', { method: 'POST', body: {}, ifMatch: '"e"', schema }),
    ).rejects.toMatchObject({ code: 'outcome-unknown', receipted: false })
  })

  it('programmer errors are not swallowed into an outcome', async () => {
    fetchMock.mockResolvedValue(new Response('{"id":"x"}', { status: 201 }))
    const buggy = z.any().refine(() => {
      throw new ReferenceError('bug in a schema')
    })
    await expect(
      mcRequest('/x', { method: 'POST', body: {}, idempotencyKey: 'k', schema: buggy }),
    ).rejects.toBeInstanceOf(ReferenceError)
  })
})

describe('helpers', () => {
  it('pathId allows only the id alphabet (no traversal)', () => {
    expect(pathId('0192-ab_C')).toBe('0192-ab_C')
    for (const bad of ['..', '../x', 'a/b', '', 'a b', 'x'.repeat(101)])
      expect(() => pathId(bad)).toThrow(McError)
  })
  it('problemFrom carries field errors', () => {
    const e = problemFrom(422, {
      type: 'urn:mc:validation',
      errors: [{ field: 'name', message: 'required' }, { nope: 1 }],
    })
    expect(e.fieldErrors).toEqual([{ field: 'name', message: 'required' }])
  })
})
