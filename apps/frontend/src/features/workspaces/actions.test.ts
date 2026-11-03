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

import { AuthError } from '@/lib/auth'

import { searchWorkspacePeopleAction } from './actions'

const ID = '0192b1c4-0000-7000-8000-000000000001'
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  auth.requireSession.mockResolvedValue({ userId: 'u', permissions: ['*'], accessToken: 'TOKEN' })
})
afterEach(() => vi.unstubAllGlobals())

describe('searchWorkspacePeopleAction', () => {
  it('maps the API people to value/label only and sends the query as a query string', async () => {
    fetchMock.mockResolvedValue(json({ items: [{ userId: 'u1', displayName: 'Alex Nguyen' }] }))
    const r = await searchWorkspacePeopleAction({ workspaceId: ID, query: '  Alex & Bao ' })
    expect(r).toEqual({
      status: 'ok',
      options: [{ value: 'u1', label: 'Alex Nguyen' }],
      truncated: false,
    })
    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.pathname).toBe(`/api/v1/workspaces/${ID}/member-candidates`)
    expect(url.searchParams.get('q')).toBe('Alex & Bao')
  })

  it('flags a full page as possibly truncated', async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, displayName: `P${i}` }))
    fetchMock.mockResolvedValue(json({ items }))
    expect(await searchWorkspacePeopleAction({ workspaceId: ID, query: '' })).toMatchObject({
      status: 'ok',
      truncated: true,
    })
  })

  it.each([
    ['signed out', () => auth.requireSession.mockRejectedValue(new AuthError('unauthenticated'))],
  ])('is denied without reaching the API when %s', async (_n, setup) => {
    setup()
    expect(await searchWorkspacePeopleAction({ workspaceId: ID, query: '' })).toEqual({
      status: 'denied',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [{ workspaceId: '../etc', query: '' }],
    [{ workspaceId: ID, query: 'x'.repeat(101) }],
    // 60 two-byte characters: 60 UTF-16 units but 120 bytes, over the API's 100-byte bound.
    [{ workspaceId: ID, query: 'ễ'.repeat(60) }],
    [{}],
  ])(
    'refuses malformed or over-limit input %j before any request, without a retry',
    async (input) => {
      expect(await searchWorkspacePeopleAction(input)).toEqual({ status: 'invalid' })
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('accepts a multibyte query that fits the 100-byte bound', async () => {
    fetchMock.mockResolvedValue(json({ items: [] }))
    const query = 'ễ'.repeat(30) // 60 bytes
    expect(await searchWorkspacePeopleAction({ workspaceId: ID, query })).toMatchObject({
      status: 'ok',
    })
  })

  it.each([
    [401, 'urn:mc:unauthenticated', 'denied'],
    [403, 'urn:mc:forbidden', 'denied'],
    [404, 'urn:mc:not-found', 'unavailable'],
    [503, 'urn:mc:unavailable', 'unavailable'],
    [500, 'urn:mc:internal', 'error'],
  ])('reports API %i as %s, never as an empty result', async (status, type, expected) => {
    fetchMock.mockResolvedValue(json({ type }, status))
    expect(await searchWorkspacePeopleAction({ workspaceId: ID, query: '' })).toEqual({
      status: expected,
    })
  })

  it('does not leak the token or backend body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('secret stack trace TOKEN', { status: 500 }))
    const r = await searchWorkspacePeopleAction({ workspaceId: ID, query: '' })
    expect(JSON.stringify(r)).not.toMatch(/TOKEN|stack/)
  })
})
