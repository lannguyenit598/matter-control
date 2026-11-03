// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
vi.mock('@/lib/auth', () => ({
  requireSession: async () => ({ userId: 'u', permissions: ['*'], accessToken: 'USER-TOKEN' }),
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import { setSignatureApplicabilityAction } from '@/features/filings/actions'
import { assessClaimAction } from '@/features/proof/actions'

const ID = '0192b1c4-0000-7000-8000-000000000001'
const CLAIM = '0192b1c4-0000-7000-8000-000000000002'
const ETAG = '"filing-4"'

const assess = (expectedAssessmentId: string) =>
  assessClaimAction({
    matterId: ID,
    claimId: CLAIM,
    expectedSubjectEpoch: 2,
    verdict: 'ACCEPTED',
    rationale: 'checked',
    assessedVersionId: '',
    validDays: 0,
    expectedAssessmentId,
  })

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const sent = () => {
  const [url, init] = fetchMock.mock.calls[0] as [URL | string, RequestInit]
  return { url: String(url), init, body: JSON.parse(String(init.body)) as Record<string, unknown> }
}

describe('assessing a claim (F02) at the action → repository → client seam', () => {
  it('sends the assessment the reviewer saw, and "" for a first review', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }))
    await assess('')
    expect(sent().url).toBe(`http://api.test/api/v1/matters/${ID}/claims/${CLAIM}/assessments`)
    expect(sent().body).toMatchObject({ expectedAssessmentId: '', expectedSubjectEpoch: 2 })

    fetchMock.mockClear()
    await assess('0192b1c4-0000-7000-8000-0000000000a1')
    expect(sent().body.expectedAssessmentId).toBe('0192b1c4-0000-7000-8000-0000000000a1')
    expect(new Headers(sent().init.headers).has('idempotency-key')).toBe(false)
  })

  it('refuses to send a review that lost its binding', async () => {
    const r = await assessClaimAction({
      matterId: ID,
      claimId: CLAIM,
      expectedSubjectEpoch: 2,
      verdict: 'ACCEPTED',
      rationale: 'checked',
      assessedVersionId: '',
      validDays: 0,
    })
    expect(r).toMatchObject({ ok: false, kind: 'validation' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a stale review (412) and a missing binding (428) apart from an unknown outcome', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"type":"urn:mc:precondition-failed"}', { status: 412 }),
    )
    expect(await assess('0192b1c4-0000-7000-8000-0000000000a1')).toMatchObject({
      ok: false,
      kind: 'stale',
    })
    fetchMock.mockResolvedValue(
      new Response('{"type":"urn:mc:precondition-required"}', { status: 428 }),
    )
    const missing = await assess('')
    expect(missing).toMatchObject({ ok: false })
    expect(missing).not.toMatchObject({ kind: 'outcome-unknown' })
  })

  it('never resends after a lost answer: the reviewer must re-read the checklist', async () => {
    fetchMock.mockRejectedValue(new TypeError('socket hang up'))
    const r = await assess('')
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown', requiresReread: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('the OWNER signature decision (F03) at the same seam', () => {
  const decide = (yes: 'yes' | 'no') =>
    setSignatureApplicabilityAction({
      matterId: ID,
      filingId: ID,
      ifMatch: ETAG,
      signatureNotRequired: yes,
      reason: 'informational filing',
    })

  it('posts the decision with the filing ETag as If-Match and no idempotency key', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await decide('yes')
    const { url, init, body } = sent()
    expect(url).toBe(`http://api.test/api/v1/matters/${ID}/filings/${ID}/signature-applicability`)
    expect(body).toEqual({ signatureNotRequired: true, reason: 'informational filing' })
    const headers = new Headers(init.headers)
    expect(headers.get('if-match')).toBe(ETAG)
    expect(headers.has('idempotency-key')).toBe(false)
  })

  it('sends false to withdraw, keeps 403 distinct from 409, and is never resent when lost', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await decide('no')
    expect(sent().body.signatureNotRequired).toBe(false)

    fetchMock.mockResolvedValue(new Response('{"type":"urn:mc:forbidden"}', { status: 403 }))
    expect(await decide('yes')).toMatchObject({ ok: false, kind: 'forbidden' })

    fetchMock.mockClear()
    fetchMock.mockRejectedValue(new TypeError('terminated'))
    expect(await decide('yes')).toMatchObject({
      ok: false,
      kind: 'outcome-unknown',
      requiresReread: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
