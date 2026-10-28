export const FIXED_MISSING_UUID = '01a15359-aa28-7a00-a380-000000000001'
export const T4_MALFORMED_LITERAL = 'not-a-uuid'
export const T4_UPPERCASE_LITERAL = '01A15359-AA28-7A00-A380-000000000001'

export function getFixturesForRun(runId: string) {
  return {
    userA: {
      initial: {
        email: `inta-a-${runId}@example.test`,
        name: 'INTA_A_INITIAL',
      },
      updated: {
        name: 'INTA_A_UPDATED',
      },
      stale: {
        name: 'INTA_A_STALE',
      },
      outage: {
        name: 'INTA_A_OUTAGE',
      },
    },
    userB: {
      initial: {
        email: `inta-b-${runId}@example.test`,
        name: 'INTA_B_INITIAL',
      },
    },
    userX: {
      initial: {
        email: `inta-x-${runId}@example.test`,
        name: 'INTA_X_OUTAGE',
      },
    },
    duplicateA: {
      email: `inta-a-${runId}@example.test`,
      name: 'INTA_DUPLICATE',
    },
    invalidT5: {
      email: `inta-invalid-${runId}@example.test`,
      name: '',
    },
    wireT7: {
      email: `inta-wire-${runId}@example.test`,
      name: 'INTA_WIRE_MISSING_TYPE',
    },
  }
}
