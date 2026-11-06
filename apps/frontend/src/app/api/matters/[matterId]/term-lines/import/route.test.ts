// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { McError } from '@/lib/mc/errors'
import { newIdempotencyKey } from '@/lib/mc/idempotency'

import { POST } from './route'

const origin = 'http://localhost:3000'
const api = vi.hoisted(() => ({ upload: vi.fn() }))
vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => ({ appOrigin: origin }) }))
vi.mock('@/lib/auth', () => ({ requireSession: vi.fn() }))
vi.mock('@/features/term-sheet/repository', () => ({ termSheetRepository: { import: api.upload } }))

const ctx = { params: Promise.resolve({ matterId: 'm1' }) }
const key = newIdempotencyKey()
function request(from = origin) {
  const form = new FormData()
  form.set(
    'file',
    new File(['row_key,field,value_text,value_date\nn1,NOTE,Synthetic,'], 'sheet.csv'),
  )
  form.set('expectedRevision', '3')
  return new NextRequest(origin + '/api/matters/m1/term-lines/import', {
    method: 'POST',
    headers: { origin: from, 'idempotency-key': key },
    body: form,
  })
}

beforeEach(() => {
  api.upload.mockReset()
})

describe('term sheet BFF upload', () => {
  it('refuses a foreign Origin before forwarding', async () => {
    expect((await POST(request('https://example.invalid'), ctx)).status).toBe(403)
    expect(api.upload).not.toHaveBeenCalled()
  })

  it('forwards the browser boundary and key with the stream', async () => {
    api.upload.mockResolvedValue({ rejected: [], replayed: true })
    const incoming = request()
    const response = await POST(incoming, ctx)
    expect(await response.json()).toEqual({ ok: true, replayed: true })
    const [matter, stream, contentType, forwardedKey] = api.upload.mock.calls[0]!
    expect(matter).toBe('m1')
    expect(forwardedKey).toBe(key)
    expect(contentType).toBe(incoming.headers.get('content-type'))
    expect(contentType).toContain('boundary=')
    const forwarded = await new Response(stream, {
      headers: { 'content-type': contentType },
    }).formData()
    expect(forwarded.get('expectedRevision')).toBe('3')
    expect((forwarded.get('file') as File).name).toBe('sheet.csv')
  })

  it('returns validation and row details when nothing was applied', async () => {
    api.upload.mockResolvedValue({
      rejected: [{ rowKey: 'row-2', code: 'validation', detail: 'Unknown field' }],
    })
    const response = await POST(request(), ctx)
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      ok: false,
      fieldErrors: { 'row-2': ['Unknown field'] },
    })
  })

  it('retains same-key recovery when the backend cannot confirm the outcome', async () => {
    api.upload.mockRejectedValue(new McError('outcome-unknown', 503, { receipted: true }))
    const response = await POST(request(), ctx)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ ok: false, retrySameKey: true })
  })
})
