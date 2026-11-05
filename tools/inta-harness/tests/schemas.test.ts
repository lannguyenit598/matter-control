import { describe, expect, it } from 'vitest'
import {
  harnessCaseInputSchema,
  nativeUserSchema,
  ALLOWED_CASE_IDS,
  REF_ID_REQUIRED_CASE_IDS,
  REF_ID_FORBIDDEN_CASE_IDS,
} from '../src/schemas.js'

describe('harnessCaseInputSchema', () => {
  const validRunId = 'run12345678'
  const validCanonicalRefId = '0192e23b-6e9f-7b71-91ea-42b7e199db1c'

  it('accepts valid runId and forbidden-refId caseId (e.g. T1) without refId', () => {
    const res = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T1',
    })
    expect(res.success).toBe(true)
  })

  it('rejects forbidden-refId case (e.g. T1) when refId is supplied', () => {
    const res = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T1',
      refId: validCanonicalRefId,
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('refId is forbidden for case T1')
    }
  })

  it('accepts required-refId case (e.g. T2) when lowercase canonical UUID refId is supplied', () => {
    const res = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T2',
      refId: validCanonicalRefId,
    })
    expect(res.success).toBe(true)
  })

  it('rejects required-refId case (e.g. T2) when refId is missing', () => {
    const res = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T2',
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('refId is required for case T2')
    }
  })

  it('enforces refId requirements across the entire fixed allowlist table (R06)', () => {
    // 15 cases must require refId
    for (const caseId of REF_ID_REQUIRED_CASE_IDS) {
      const withRefId = harnessCaseInputSchema.safeParse({
        runId: validRunId,
        caseId,
        refId: validCanonicalRefId,
      })
      expect(withRefId.success).toBe(true)

      const withoutRefId = harnessCaseInputSchema.safeParse({
        runId: validRunId,
        caseId,
      })
      expect(withoutRefId.success).toBe(false)
      if (!withoutRefId.success) {
        expect(withoutRefId.error.issues[0].message).toBe(`refId is required for case ${caseId}`)
      }
    }

    // 8 cases must forbid refId
    for (const caseId of REF_ID_FORBIDDEN_CASE_IDS) {
      const withoutRefId = harnessCaseInputSchema.safeParse({
        runId: validRunId,
        caseId,
      })
      expect(withoutRefId.success).toBe(true)

      const withRefId = harnessCaseInputSchema.safeParse({
        runId: validRunId,
        caseId,
        refId: validCanonicalRefId,
      })
      expect(withRefId.success).toBe(false)
      if (!withRefId.success) {
        expect(withRefId.error.issues[0].message).toBe(`refId is forbidden for case ${caseId}`)
      }
    }

    expect(REF_ID_REQUIRED_CASE_IDS.size + REF_ID_FORBIDDEN_CASE_IDS.size).toBe(ALLOWED_CASE_IDS.length)
  })

  it('rejects refId if uppercase or malformed', () => {
    const resUpper = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T2',
      refId: '0192E23B-6E9F-7B71-91EA-42B7E199DB1C',
    })
    expect(resUpper.success).toBe(false)

    const resMalformed = harnessCaseInputSchema.safeParse({
      runId: validRunId,
      caseId: 'T2',
      refId: 'not-a-uuid',
    })
    expect(resMalformed.success).toBe(false)
  })

  it('rejects runId shorter than 8 or longer than 32 chars or with special characters', () => {
    expect(harnessCaseInputSchema.safeParse({ runId: 'short', caseId: 'T1' }).success).toBe(false)
    expect(harnessCaseInputSchema.safeParse({ runId: 'a'.repeat(33), caseId: 'T1' }).success).toBe(false)
    expect(harnessCaseInputSchema.safeParse({ runId: 'invalid-char!', caseId: 'T1' }).success).toBe(false)
  })

  it('rejects unknown caseId', () => {
    expect(harnessCaseInputSchema.safeParse({ runId: validRunId, caseId: 'UNKNOWN_99' }).success).toBe(false)
    expect(harnessCaseInputSchema.safeParse({ runId: validRunId, caseId: 'DELETE_USER' }).success).toBe(false)
  })

  it('rejects input with extra caller-controlled fields (strict allowlist)', () => {
    expect(
      harnessCaseInputSchema.safeParse({
        runId: validRunId,
        caseId: 'T1',
        extraProxyHeader: 'foo',
      }).success,
    ).toBe(false)
  })
})

describe('nativeUserSchema (INTA-FE-R01)', () => {
  it('validates Go native user payload with created_at and updated_at', () => {
    const user = {
      id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
      email: 'inta-a-run12345678@example.test',
      name: 'INTA_A_INITIAL',
      version: 1,
      created_at: '2026-10-25T03:00:00Z',
      updated_at: '2026-10-25T03:00:00Z',
    }
    const res = nativeUserSchema.safeParse(user)
    expect(res.success).toBe(true)
  })

  it('rejects camelCase createdAt / updatedAt fields (INTA-FE-R01)', () => {
    const camelUser = {
      id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
      email: 'inta-a-run12345678@example.test',
      name: 'INTA_A_INITIAL',
      version: 1,
      createdAt: '2026-10-25T03:00:00Z',
      updatedAt: '2026-10-25T03:00:00Z',
    }
    const res = nativeUserSchema.safeParse(camelUser)
    expect(res.success).toBe(false)
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path[0])
      expect(paths).toContain('created_at')
      expect(paths).toContain('updated_at')
    }
  })
})
