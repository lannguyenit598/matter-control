// @vitest-environment node
// WP-7 (deploy-readiness finish): the pilot pending-import ceiling. Pure unit tests — no
// database. The durable-path integration (at-ceiling write succeeds, over-ceiling write is
// refused before any storage touch) is covered by durable-attempts.test.ts with an explicit
// ceiling for its 25 MiB byte-equality case.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_MAX_PENDING_BYTES, maxPendingBytes } from '@/lib/oidc/durable-state'
import {
  assertPendingImportFits,
  estimatePendingSealedBytes,
  type PendingAttempt,
} from './pending-attempts'

const importAttempt = (size: number): PendingAttempt => ({
  kind: 'import',
  matterId: 'synthetic-matter',
  plan: { runKey: 'run', rowKeys: { R1: 'original-row-key' } },
  upload: { sourceName: 'synthetic.csv', format: 'csv', content: new Uint8Array(size).fill(7) },
})

afterEach(() => vi.unstubAllEnvs())

describe('pending import ceiling (WP-7)', () => {
  it('defaults to the pilot ceiling (5 MiB)', () => {
    vi.stubEnv('BFF_MAX_PENDING_BYTES', '')
    expect(maxPendingBytes()).toBe(DEFAULT_MAX_PENDING_BYTES)
    expect(DEFAULT_MAX_PENDING_BYTES).toBe(5 * 1024 * 1024)
  })

  it('an import at the exact ceiling passes; one byte of seal headroom less refuses it', () => {
    const attempt = importAttempt(1024)
    const estimated = estimatePendingSealedBytes(attempt)
    vi.stubEnv('BFF_MAX_PENDING_BYTES', String(estimated))
    expect(() => assertPendingImportFits(attempt)).not.toThrow()
    vi.stubEnv('BFF_MAX_PENDING_BYTES', String(estimated - 1))
    try {
      assertPendingImportFits(attempt)
      expect.unreachable('an over-ceiling import must be refused')
    } catch (error) {
      expect((error as { code?: string }).code).toBe('payload-too-large')
      expect((error as { status?: number }).status).toBe(413)
      expect((error as { cause?: { message?: string } }).cause?.message).toContain('pilot ceiling')
      expect((error as { cause?: { message?: string } }).cause?.message).toContain(
        'BFF_MAX_PENDING_BYTES',
      )
    }
  })

  it('a document-sized pending import is refused by the default ceiling', () => {
    vi.stubEnv('BFF_MAX_PENDING_BYTES', '')
    expect(() => assertPendingImportFits(importAttempt(25 * 1024 * 1024 - 1024))).toThrow()
  })

  it('an invalid ceiling configuration fails closed with 503', () => {
    for (const bad of ['0', '-1', 'abc', '3.5', String(36 * 1024 * 1024 + 1)]) {
      vi.stubEnv('BFF_MAX_PENDING_BYTES', bad)
      try {
        maxPendingBytes()
        expect.unreachable(`invalid ceiling ${bad} must fail closed`)
      } catch (error) {
        expect((error as { status?: number }).status).toBe(503)
      }
    }
  })

  it('bulk attempts are not subject to the import ceiling', () => {
    const bulk: PendingAttempt = {
      kind: 'bulk',
      matterId: 'synthetic-matter',
      input: { attemptKey: 'attempt-1', rows: [{ rowKey: 'R1', expectedRevision: 1, title: 't' }] },
    } as PendingAttempt
    vi.stubEnv('BFF_MAX_PENDING_BYTES', '1')
    expect(() => assertPendingImportFits(bulk)).not.toThrow()
  })

  it('the estimate dominates the sealed size (never under-reports)', () => {
    // The sealed JSON of the same attempt, serialized the way sealState would: base64 content
    // plus the metadata JSON. The estimate must be >= that byte count for these shapes.
    const attempt = importAttempt(3000)
    const sealedShape = JSON.stringify({
      matterId: attempt.kind === 'import' ? attempt.matterId : '',
      plan: attempt.kind === 'import' ? attempt.plan : null,
      upload: {
        sourceName: attempt.kind === 'import' ? attempt.upload.sourceName : '',
        format: attempt.kind === 'import' ? attempt.upload.format : '',
        content: { __mcBytes: Buffer.from(new Uint8Array(3000).fill(7)).toString('base64') },
      },
      running: false,
    })
    expect(estimatePendingSealedBytes(attempt)).toBeGreaterThanOrEqual(
      Buffer.byteLength(sealedShape),
    )
  })
})
