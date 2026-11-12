// @vitest-environment node
import { createHash } from 'node:crypto'
import { NextRequest } from 'next/server'
import { beforeEach, expect, it, vi } from 'vitest'
import { McError } from '@/lib/mc/errors'
import { MAX_EML_BYTES } from '@/features/mail/schemas'
const { session, intake } = vi.hoisted(() => ({ session: vi.fn(), intake: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireSession: session }))
vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => ({ appOrigin: 'http://app.test' }) }))
vi.mock('@/features/mail/repository', () => ({ mailRepository: { intake } }))
import { POST } from './route'
const key = '01900000-0000-7000-8000-000000000001'
function request({
  origin = 'http://app.test',
  name = 'm.eml',
  size = 8,
  k = key,
  file = true,
} = {}) {
  const form = new FormData()
  if (file) form.set('file', new File([new Uint8Array(size)], name))
  form.set('direction', 'INBOUND')
  return new NextRequest('http://app.test/api/matters/m1/mail-intake', {
    method: 'POST',
    headers: { Origin: origin, 'Idempotency-Key': k },
    body: form,
  })
}
const ctx = (matterId = 'm1') => ({ params: Promise.resolve({ matterId }) })
beforeEach(() => {
  session.mockReset()
  intake.mockReset()
  session.mockResolvedValue({})
  intake.mockResolvedValue({
    data: { mailId: 'm1', documentId: 'd1', versionId: 'v1' },
    replayed: false,
  })
})
it('rejects missing/wrong origin and missing session before backend intake', async () => {
  expect((await POST(request({ origin: '' }), ctx())).status).toBe(403)
  expect((await POST(request({ origin: 'http://evil.test' }), ctx())).status).toBe(403)
  session.mockRejectedValue(new McError('unauthenticated', 401))
  expect((await POST(request(), ctx())).status).toBe(401)
  expect(intake).not.toHaveBeenCalled()
})
it('rejects invalid path/key/extension/missing file and oversize before intake', async () => {
  expect((await POST(request(), ctx('../bad'))).status).toBe(404)
  for (const input of [
    { k: 'bad' },
    { name: 'm.pdf' },
    { file: false },
    { size: MAX_EML_BYTES + 1 },
  ]) {
    expect((await POST(request(input), ctx())).status).toBe(422)
  }
  expect(intake).not.toHaveBeenCalled()
})
it.each([2 * 1024 * 1024, MAX_EML_BYTES])(
  'forwards byte-identical file at %i bytes and the same key',
  async (size) => {
    const response = await POST(request({ size }), ctx())
    expect(response.status).toBe(201)
    const [id, file, direction, k] = intake.mock.calls[0]!
    expect([id, direction, k]).toEqual(['m1', 'INBOUND', key])
    expect(file.size).toBe(size)
    expect(
      createHash('sha256')
        .update(new Uint8Array(await file.arrayBuffer()))
        .digest('hex'),
    ).toBe(createHash('sha256').update(new Uint8Array(size)).digest('hex'))
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  },
)
it('retains same-key recovery through the BFF', async () => {
  intake.mockRejectedValue(new McError('outcome-unknown', 503, { receipted: true }))
  const response = await POST(request(), ctx())
  expect(response.status).toBe(503)
  expect(await response.json()).toMatchObject({
    ok: false,
    kind: 'outcome-unknown',
    retrySameKey: true,
  })
})
