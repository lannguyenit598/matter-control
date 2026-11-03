import { expect, it } from 'vitest'

import { findRuntimeSecret, isRuntimeSecretKey } from '../../../scripts/worker-build-env.mjs'

it('keeps runtime secrets out of Worker builds and reports names without values', () => {
  expect(
    findRuntimeSecret("# BFF_STATE_KEYS='example'\nOIDC_CLIENT_ID=public\nAPI_TOKEN=\n"),
  ).toBeNull()
  expect(findRuntimeSecret('BFF_STATE_KEYS=\'{"v1":"synthetic-secret"}\'')).toBe('BFF_STATE_KEYS')
  expect(
    findRuntimeSecret('export MC_DATABASE_URL=postgresql://synthetic:synthetic@localhost/db'),
  ).toBe('MC_DATABASE_URL')
  expect(findRuntimeSecret('SERVICE_API_KEY=synthetic-secret')).toBe('SERVICE_API_KEY')
  expect(isRuntimeSecretKey('GOOGLE_APPLICATION_CREDENTIALS')).toBe(true)
  expect(isRuntimeSecretKey('OIDC_CLIENT_ID')).toBe(false)
})
