import { describe, expect, it } from 'vitest'
import {
  getFixturesForRun,
  FIXED_MISSING_UUID,
  T4_MALFORMED_LITERAL,
  T4_UPPERCASE_LITERAL,
} from '../src/fixtures.js'

describe('fixtures', () => {
  const runId = 'runTest1234'
  const f = getFixturesForRun(runId)

  it('generates expected synthetic user A, B, X fixtures', () => {
    expect(f.userA.initial.email).toBe(`inta-a-${runId}@example.test`)
    expect(f.userA.initial.name).toBe('INTA_A_INITIAL')

    expect(f.userA.updated.name).toBe('INTA_A_UPDATED')
    expect(f.userA.stale.name).toBe('INTA_A_STALE')
    expect(f.userA.outage.name).toBe('INTA_A_OUTAGE')

    expect(f.userB.initial.email).toBe(`inta-b-${runId}@example.test`)
    expect(f.userB.initial.name).toBe('INTA_B_INITIAL')

    expect(f.userX.initial.email).toBe(`inta-x-${runId}@example.test`)
    expect(f.userX.initial.name).toBe('INTA_X_OUTAGE')

    expect(f.duplicateA.email).toBe(`inta-a-${runId}@example.test`)
    expect(f.duplicateA.name).toBe('INTA_DUPLICATE')

    expect(f.invalidT5.email).toBe(`inta-invalid-${runId}@example.test`)
    expect(f.invalidT5.name).toBe('')
  })

  it('exposes frozen literal UUID constants', () => {
    expect(FIXED_MISSING_UUID).toBe('01a15359-aa28-7a00-a380-000000000001')
    expect(T4_MALFORMED_LITERAL).toBe('not-a-uuid')
    expect(T4_UPPERCASE_LITERAL).toBe('01A15359-AA28-7A00-A380-000000000001')
  })
})
