import { describe, expect, it } from 'vitest'
import {
  buildHarnessEnvelope,
  truncateUtf8,
  capRetainedSurface,
  MAX_RETAINED_BODY_BYTES,
} from '../src/envelope.js'

describe('buildHarnessEnvelope (INTA-FE-R04, R05)', () => {
  it('preserves small payload with truncated=false and contract outcome vocabulary', () => {
    const smallData = { id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c', name: 'INTA_A_INITIAL' }
    const env = buildHarnessEnvelope({
      runId: 'run12345678',
      caseId: 'T1',
      requestId: 'mc-int-run12345678-T1-1',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 12,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'value',
      classification: 'success',
      value: smallData,
      apiError: null,
      wire: null,
    })

    expect(env.truncated).toBe(false)
    expect(env.value).toEqual(smallData)
    expect(env.outcome).toBe('value')
    expect(env.classification).toBe('success')
  })

  it('caps ASCII string exceeding 16KiB at encoded byte boundary', () => {
    const bigString = 'A'.repeat(MAX_RETAINED_BODY_BYTES + 1000)
    const env = buildHarnessEnvelope({
      runId: 'run12345678',
      caseId: 'W1',
      requestId: 'mc-int-run12345678-W1-1',
      mode: 'wire',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'value',
      classification: 'success',
      value: bigString,
      apiError: null,
      wire: {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    })

    expect(env.truncated).toBe(true)
    expect(typeof env.value).toBe('string')
    const encodedBytes = new TextEncoder().encode(env.value as string).length
    expect(encodedBytes).toBeLessThanOrEqual(MAX_RETAINED_BODY_BYTES)
    expect(encodedBytes).toBe(MAX_RETAINED_BODY_BYTES)
  })

  it('caps multi-byte CJK string safely at 16KiB without corrupting characters (R05)', () => {
    // Each CJK char '合同审查测试' is 3 UTF-8 bytes
    const cjkUnit = '合同审查测试'
    const repeatCount = Math.ceil((MAX_RETAINED_BODY_BYTES + 500) / (cjkUnit.length * 3))
    const bigCjk = cjkUnit.repeat(repeatCount)

    const initialBytes = new TextEncoder().encode(bigCjk).length
    expect(initialBytes).toBeGreaterThan(MAX_RETAINED_BODY_BYTES)

    const capped = capRetainedSurface(bigCjk)
    expect(capped.truncated).toBe(true)
    const cappedBytes = new TextEncoder().encode(capped.val as string).length
    expect(cappedBytes).toBeLessThanOrEqual(MAX_RETAINED_BODY_BYTES)
    // The truncated string should not end with replacement char \uFFFD
    expect((capped.val as string).endsWith('\uFFFD')).toBe(false)
  })

  it('caps multi-byte Emoji string safely at 16KiB without corrupting surrogate pairs (R05)', () => {
    // Emoji '⚖️📜' is 4-7 bytes per sequence
    const emojiUnit = '⚖️📜🔥'
    const repeatCount = 3000
    const bigEmoji = emojiUnit.repeat(repeatCount)

    const initialBytes = new TextEncoder().encode(bigEmoji).length
    expect(initialBytes).toBeGreaterThan(MAX_RETAINED_BODY_BYTES)

    const capped = capRetainedSurface(bigEmoji)
    expect(capped.truncated).toBe(true)
    const cappedBytes = new TextEncoder().encode(capped.val as string).length
    expect(cappedBytes).toBeLessThanOrEqual(MAX_RETAINED_BODY_BYTES)
  })

  it('caps large object payload and converts value to string (R05, R10e)', () => {
    const largeObj = {
      description: 'D'.repeat(MAX_RETAINED_BODY_BYTES + 2000),
      nested: { key: 'value' },
    }

    const env = buildHarnessEnvelope({
      runId: 'run12345678',
      caseId: 'T1',
      requestId: 'mc-int-run12345678-T1-2',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 10,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'value',
      value: largeObj,
      apiError: null,
      wire: null,
    })

    expect(env.truncated).toBe(true)
    expect(typeof env.value).toBe('string')
    const encodedBytes = new TextEncoder().encode(env.value as string).length
    expect(encodedBytes).toBeLessThanOrEqual(MAX_RETAINED_BODY_BYTES)
  })

  it('caps apiError.details surface and flags truncation independently (R05)', () => {
    const hugeDetails = 'ERR_'.repeat(5000)
    const env = buildHarnessEnvelope({
      runId: 'run12345678',
      caseId: 'T11a',
      requestId: 'mc-int-run12345678-T11a-1',
      mode: 'app-client',
      method: 'GET',
      routeTemplate: '/api/v1/users/{id}',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 5,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'apiError',
      classification: 'unavailable',
      value: null,
      apiError: {
        status: 503,
        code: 'HTTP_ERROR',
        message: 'Service Unavailable',
        details: hugeDetails,
      },
      wire: null,
    })

    expect(env.truncated).toBe(true)
    expect(env.apiError).not.toBeNull()
    const detailsBytes = new TextEncoder().encode(env.apiError!.details as string).length
    expect(detailsBytes).toBeLessThanOrEqual(MAX_RETAINED_BODY_BYTES)
    expect(env.classification).toBe('unavailable')
  })
})
