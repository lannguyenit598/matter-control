// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { McError } from '@/lib/mc/errors'
import { newIdempotencyKey } from '@/lib/mc/idempotency'

const origin = 'http://localhost:3000'
vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => ({ appOrigin: origin }) }))
vi.mock('@/lib/auth', () => ({ requireSession: vi.fn(async () => ({ userId: 'u' })) }))

const mc = vi.hoisted(() => ({ request: vi.fn(), download: vi.fn() }))
vi.mock('@/lib/mc/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mc/client')>()),
  mcRequest: mc.request,
  mcDownload: mc.download,
}))

import { GET as content } from './[matterId]/documents/[documentId]/versions/[versionId]/content/route'
import { POST as upload } from './[matterId]/documents/[documentId]/versions/route'

const ctx = { params: Promise.resolve({ matterId: 'm1', documentId: 'd1' }) }
const key = newIdempotencyKey()

const post = (headers: Record<string, string>, body: BodyInit | null = 'hello') =>
  new NextRequest(`${origin}/api/matters/m1/documents/d1/versions`, {
    method: 'POST',
    headers,
    body,
  })

const good = {
  origin,
  'idempotency-key': key,
  'x-filename': encodeURIComponent('Share Purchase.pdf'),
  'content-type': 'application/pdf',
}

beforeEach(() => {
  mc.request.mockReset()
  mc.download.mockReset()
})

describe('upload route', () => {
  it('refuses a cross-origin request before anything reaches the API', async () => {
    const res = await upload(post({ ...good, origin: 'http://evil.example' }), ctx)
    expect(res.status).toBe(403)
    expect(mc.request).not.toHaveBeenCalled()
  })

  it('refuses a request without Origin (a non-browser caller cannot ride a session cookie)', async () => {
    const noOrigin: Record<string, string> = { ...good }
    delete noOrigin.origin
    const res = await upload(post(noOrigin), ctx)
    expect(res.status).toBe(403)
    expect(mc.request).not.toHaveBeenCalled()
  })

  it.each([
    ['no key', { ...good, 'idempotency-key': '' }],
    ['a key that is not a UUIDv7', { ...good, 'idempotency-key': 'not-a-key' }],
    ['no file name', { ...good, 'x-filename': '' }],
  ])('refuses %s', async (_n, headers) => {
    const res = await upload(post(headers), ctx)
    expect(res.status).toBe(422)
    expect(mc.request).not.toHaveBeenCalled()
  })

  it('streams the body to the API with the same key and the decoded file name', async () => {
    mc.request.mockResolvedValue({ data: { id: 'v9' }, replayed: true })
    const res = await upload(post(good), ctx)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true, id: 'v9', replayed: true })
    const [path, req] = mc.request.mock.calls[0]!
    expect(path).toBe('/matters/m1/documents/d1/versions')
    expect(req).toMatchObject({
      method: 'POST',
      idempotencyKey: key,
      raw: { contentType: 'application/pdf', headers: { 'X-Filename': 'Share Purchase.pdf' } },
    })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('maps an unknown outcome of a receipted upload to a same-key retry, never a plain failure', async () => {
    mc.request.mockRejectedValue(new McError('outcome-unknown', 503, { receipted: true }))
    const res = await upload(post(good), ctx)
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({
      ok: false,
      kind: 'outcome-unknown',
      retrySameKey: true,
    })
  })

  it('maps a too-large refusal to a clean validation failure (nothing was stored)', async () => {
    mc.request.mockRejectedValue(new McError('payload-too-large', 413))
    const res = await upload(post(good), ctx)
    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ ok: false, kind: 'validation' })
  })
})

describe('content route', () => {
  const cctx = {
    params: Promise.resolve({ matterId: 'm1', documentId: 'd1', versionId: 'v1' }),
  }
  const get = () => new NextRequest(`${origin}/api/matters/m1/documents/d1/versions/v1/content`)

  it('streams the bytes as opaque attachment bytes and passes only the download headers', async () => {
    mc.download.mockResolvedValue(
      new Response('PDFBYTES', {
        headers: {
          'content-type': 'text/html', // must never be passed on
          'content-disposition': 'attachment; filename=spa.pdf',
          'x-content-type-options': 'nosniff',
          'set-cookie': 'leak=1',
          'mc-media-type': 'application/pdf',
        },
      }),
    )
    const res = await content(get(), cctx)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('PDFBYTES')
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect(res.headers.get('content-disposition')).toContain('attachment')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it.each([
    ['forbidden', 403],
    ['not-found', 404],
    ['unauthenticated', 401],
    ['unavailable', 503],
  ] as const)('reports %s as %i, never as an empty file', async (code, status) => {
    mc.download.mockRejectedValue(new McError(code, status))
    const res = await content(get(), cctx)
    expect(res.status).toBe(status)
  })
})
