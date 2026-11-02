// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({
  identity: {
    principalKey: 'a'.repeat(64),
    epoch: 'b'.repeat(24),
    validUntil: '2099-01-01T00:00:00.000Z',
  },
  read: vi.fn(),
}))
vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => ({ appOrigin: 'http://app.test' }) }))
vi.mock('@/lib/auth-provider', () => ({ publicUiSession: async () => state.identity }))
vi.mock('@/features/search/repository', () => ({ searchRepository: { read: state.read } }))
import { POST } from './route'

const request = (body: string, origin = 'http://app.test') =>
  new Request('http://app.test/api/search', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body,
  })
beforeEach(() => {
  state.read.mockReset()
  state.read.mockResolvedValue({ groups: {} })
})
it('checks exact Origin, bounded UTF8 JSON and current epoch before any backend call', async () => {
  const body = JSON.stringify({ q: 'Atlas', epoch: state.identity.epoch })
  expect((await POST(request(body, 'http://evil.test'))).status).toBe(403)
  expect((await POST(request(JSON.stringify({ q: 'Atlas', epoch: 'c'.repeat(24) })))).status).toBe(
    409,
  )
  expect((await POST(request('{broken'))).status).toBe(400)
  expect((await POST(request('x'.repeat(17000)))).status).toBe(413)
  expect(state.read).not.toHaveBeenCalled()
})
it('keeps queries out of URLs, propagates only a generated operation id, and forbids caching', async () => {
  const response = await POST(
    request(JSON.stringify({ q: 'Canary confidential', epoch: state.identity.epoch })),
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  const operationId = response.headers.get('X-Request-Id')!
  expect(operationId).toMatch(/^[a-f0-9-]{36}$/)
  expect(state.read).toHaveBeenCalledWith(
    expect.objectContaining({ q: 'Canary confidential' }),
    expect.any(AbortSignal),
    operationId,
  )
  expect(operationId).not.toContain('Canary')
})
