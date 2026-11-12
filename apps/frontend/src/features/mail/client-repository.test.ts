// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { mailUploadRepository } from './client-repository'
const key = '01900000-0000-7000-8000-000000000001'
afterEach(() => vi.unstubAllGlobals())
it.each([200, 500, 503])('keeps same-key recovery for unusable HTTP %i', async (status) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unusable', { status })))
  expect(await mailUploadRepository.intake('m1', new File(['x'], 'm.eml'), key)).toMatchObject({
    ok: false,
    kind: 'outcome-unknown',
    retrySameKey: true,
  })
})
it('does not accept a malformed success or a success body on a refusal', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 201 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          mailId: 'm1',
          documentId: 'd1',
          versionId: 'v1',
          replayed: false,
        }),
        { status: 503 },
      ),
    )
  vi.stubGlobal('fetch', fetch)
  for (let i = 0; i < 2; i++)
    expect(await mailUploadRepository.intake('m1', new File(['x'], 'm.eml'), key)).toMatchObject({
      kind: 'outcome-unknown',
      retrySameKey: true,
    })
})
it('validates the path and key before any request', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  await mailUploadRepository.intake('../outside', new File(['x'], 'm.eml'), key)
  await mailUploadRepository.intake('m1', new File(['x'], 'm.eml'), 'invalid')
  expect(fetch).not.toHaveBeenCalled()
})
