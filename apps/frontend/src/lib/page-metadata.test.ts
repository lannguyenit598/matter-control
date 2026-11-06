// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'ui-locale' && cookieJar.value ? { name, value: cookieJar.value } : undefined,
  }),
}))

import { localizedTitle, pageMetadata } from './page-metadata'

afterEach(() => {
  cookieJar.value = undefined
})

describe('pageMetadata (W5 / P-08: tab titles follow the D-2 locale cookie)', () => {
  it('returns the EN title when no ui-locale cookie is set', async () => {
    expect(await localizedTitle('Matters', 'Hồ sơ')).toBe('Matters')
  })

  it('returns the vi title for ui-locale=vi', async () => {
    cookieJar.value = 'vi'
    expect(await localizedTitle('Matters', 'Hồ sơ')).toBe('Hồ sơ')
  })

  it('generateMetadata picks the title by the same cookie', async () => {
    cookieJar.value = 'vi'
    expect((await pageMetadata('Workspaces', 'Không gian làm việc')()).title).toBe(
      'Không gian làm việc',
    )
    cookieJar.value = undefined
    expect((await pageMetadata('Workspaces', 'Không gian làm việc')()).title).toBe('Workspaces')
  })
})
