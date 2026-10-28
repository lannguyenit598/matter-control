import { describe, expect, it, vi, afterEach } from 'vitest'
import { executeCase, getInstalledNextVersion, getHarnessRevision } from '../src/executor.js'
import { RequestIdGenerator } from '../src/request-id.js'

describe('executor', () => {
  const runId = 'runTest1234'
  const goBaseUrl = 'http://127.0.0.1:18086'
  const refId = '0192e23b-6e9f-7b71-91ea-42b7e199db1c'

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('executes T1 via app-client mode with native snake_case timestamps (R01)', async () => {
    const fakeUserA = {
      id: refId,
      email: `inta-a-${runId}@example.test`,
      name: 'INTA_A_INITIAL',
      version: 1,
      created_at: '2026-10-25T03:00:00Z',
      updated_at: '2026-10-25T03:00:00Z',
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify(fakeUserA),
    })
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'T1',
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
    })

    expect(result.substeps).toHaveLength(1)
    const step = result.substeps[0]
    expect(step.caseId).toBe('T1')
    expect(step.mode).toBe('app-client')
    expect(step.method).toBe('POST')
    expect(step.routeTemplate).toBe('/api/v1/users')
    expect(step.outcome).toBe('value')
    expect(step.classification).toBe('success')
    expect(step.value).toEqual(fakeUserA)
    expect(step.apiError).toBeNull()
    expect(step.wire?.note).toBe('not-observable-via-client')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const callUrl = fetchMock.mock.calls[0][0].toString()
    expect(callUrl).toBe('http://127.0.0.1:18086/api/v1/users')
  })

  it('executes T4 with two distinct substeps and unique request IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ title: 'Not Found', status: 404 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'T4',
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
    })

    expect(result.substeps).toHaveLength(2)
    expect(result.substeps[0].requestId).not.toBe(result.substeps[1].requestId)
    expect(result.substeps[0].outcome).toBe('apiError')
    expect(result.substeps[0].apiError?.code).toBe('NOT_FOUND')
    expect(result.substeps[1].outcome).toBe('apiError')
    expect(result.substeps[1].apiError?.code).toBe('NOT_FOUND')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('executes T5 with POST 422 and mandatory User A readback (R06)', async () => {
    const fetchMock = vi
      .fn()
      // First call: POST empty name -> 422
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => JSON.stringify({ title: 'Validation Error', status: 422 }),
      })
      // Second call: GET A unchanged -> 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            id: refId,
            email: `inta-a-${runId}@example.test`,
            name: 'INTA_A_INITIAL',
            version: 1,
            created_at: '2026-10-25T03:00:00Z',
            updated_at: '2026-10-25T03:00:00Z',
          }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'T5',
      refId,
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
    })

    expect(result.substeps).toHaveLength(2)
    expect(result.substeps[0].outcome).toBe('apiError')
    expect(result.substeps[0].apiError?.status).toBe(422)
    expect(result.substeps[1].outcome).toBe('value')
    expect(result.substeps[1].method).toBe('GET')
    expect((result.substeps[1].value as any).version).toBe(1)
  })

  it('executes T11a during PG outage recording unavailable classification (R04)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () =>
        JSON.stringify({
          type: '/problems/unavailable',
          title: 'Service Unavailable',
          status: 503,
          detail: 'service temporarily unavailable',
          retryAfter: 1,
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'T11a',
      refId,
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
    })

    expect(result.substeps).toHaveLength(1)
    const step = result.substeps[0]
    expect(step.outcome).toBe('apiError')
    expect(step.classification).toBe('unavailable')
    expect(step.apiError?.status).toBe(503)
    expect(step.apiError?.code).toBe('HTTP_ERROR')
  })

  it('executes T12 when Go is stopped recording network error and unavailable classification (R04)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('fetch failed (ECONNREFUSED)'))
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'T12',
      refId,
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
    })

    expect(result.substeps).toHaveLength(1)
    const step = result.substeps[0]
    expect(step.outcome).toBe('apiError')
    expect(step.classification).toBe('unavailable')
    expect(step.apiError?.status).toBe(0)
    expect(step.apiError?.code).toBe('NETWORK_ERROR')
  })

  it('executes W1 via wire mode capturing status and headers with single-source body (R04)', async () => {
    const userB = {
      id: '0192e23b-6e9f-7b71-91ea-42b7e199db1d',
      email: `inta-b-${runId}@example.test`,
      name: 'INTA_B_INITIAL',
      version: 1,
      created_at: '2026-10-25T03:00:00Z',
      updated_at: '2026-10-25T03:00:00Z',
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({
        'content-type': 'application/json',
        location: `/api/v1/users/${userB.id}`,
        etag: '"1"',
        'x-request-id': 'mc-int-runTest1234-W1-1',
      }),
      text: async () => JSON.stringify(userB),
    })
    vi.stubGlobal('fetch', fetchMock)

    const reqIdGen = new RequestIdGenerator(runId)
    const result = await executeCase({
      runId,
      caseId: 'W1',
      reqIdGen,
      goBaseUrl,
      nextVersion: '16.4.2',
    })

    expect(result.substeps).toHaveLength(1)
    const step = result.substeps[0]
    expect(step.caseId).toBe('W1')
    expect(step.mode).toBe('wire')
    expect(step.outcome).toBe('value')
    expect(step.classification).toBe('success')
    expect(step.value).toEqual(userB)
    expect(step.apiError).toBeNull()
    expect(step.wire?.status).toBe(201)
    expect(step.wire?.headers?.location).toBe(`/api/v1/users/${userB.id}`)
    expect(step.wire?.headers?.etag).toBe('"1"')
  })

  it('measures Next version and git revision without unvalidated env overrides (F03)', () => {
    // Unvalidated env variables should be ignored
    process.env.MC_INTA_NEXT_VERSION = 'fabricated-version'
    process.env.MC_INTA_HARNESS_REVISION = 'fabricated-revision'

    try {
      const nextVer = getInstalledNextVersion()
      const rev = getHarnessRevision()

      expect(nextVer).not.toBe('fabricated-version')
      expect(rev).not.toBe('fabricated-revision')
      expect(nextVer).toMatch(/^\d+\.\d+\.\d+/)
      expect(rev).toMatch(/^[0-9a-f]{40}$/)
    } finally {
      delete process.env.MC_INTA_NEXT_VERSION
      delete process.env.MC_INTA_HARNESS_REVISION
    }
  })

  it('refuses upstream execution when Next version or harness revision is unmeasured (F03)', async () => {
    const reqIdGen = new RequestIdGenerator(runId)

    await expect(
      executeCase({
        runId,
        caseId: 'T1',
        reqIdGen,
        goBaseUrl,
        nextVersion: 'unmeasured:next-package-json-not-found',
      }),
    ).rejects.toThrow(/Upstream execution refused: unmeasured Next.js version/)

    await expect(
      executeCase({
        runId,
        caseId: 'T1',
        reqIdGen,
        goBaseUrl,
        nextVersion: '16.4.2',
        harnessRevision: 'unmeasured:git-rev-parse-failed',
      }),
    ).rejects.toThrow(/Upstream execution refused: unmeasured harness revision/)
  })
})
