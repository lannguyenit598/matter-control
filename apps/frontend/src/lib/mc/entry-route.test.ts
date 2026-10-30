import type { NextConfig } from 'next'
import { afterEach, expect, it, vi } from 'vitest'

import * as configModule from '../../../next.config'

// Firebase App Hosting's adapter replaces next.config.ts with a CommonJS wrapper during `next build`,
// whose type check covers this file; a namespace import type-checks against both shapes (ADR-007).
type ConfigModule = { default: NextConfig }
const nextConfig = (configModule as unknown as ConfigModule).default

afterEach(() => vi.unstubAllEnvs())

it('redirects the public root to the implemented workspace entry route', async () => {
  const redirects = await nextConfig.redirects?.()
  expect(redirects).toContainEqual({
    source: '/',
    destination: '/workspaces',
    permanent: false,
  })
})

it('keeps Node cache features and selects the tested dynamic SSR profile only for Workers', async () => {
  expect(nextConfig.cacheComponents).toBe(true)
  vi.stubEnv('MC_WORKER_BUILD', '1')
  vi.resetModules()
  const worker = ((await import('../../../next.config')) as unknown as ConfigModule).default
  expect(worker.cacheComponents).toBe(false)
  expect(worker.partialPrefetching).toBe(false)
  expect(worker.output).toBe('standalone')
})
