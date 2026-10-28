import { describe, expect, it } from 'vitest'

import { safeInternalPath, withFrom } from './paths'

describe('safeInternalPath', () => {
  it.each([
    ['/matters/1/work?execution=WAITING&q=spa', '/matters/1/work?execution=WAITING&q=spa'],
    ['/my-actions', '/my-actions'],
    [
      '/matters/1/work/2?from=%2Fmatters%2F1%2Fwork',
      '/matters/1/work/2?from=%2Fmatters%2F1%2Fwork',
    ],
  ])('keeps %s', (input, out) => expect(safeInternalPath(input, '/x')).toBe(out))

  it.each([
    null,
    '',
    '//evil.test',
    'http://evil.test/',
    '/\t/evil.test',
    '/\n/evil.test',
    '\\evil',
    '/a\\b',
    'javascript:alert(1)',
    '/api/auth/logout',
    '/login',
    'relative',
    '/' + 'a'.repeat(3000),
  ])('falls back for %j', (input) => expect(safeInternalPath(input, '/fallback')).toBe('/fallback'))
})

describe('withFrom', () => {
  it('adds or replaces the origin and keeps other params', () => {
    expect(withFrom('/matters/1/work/2', '/matters/1/work')).toBe(
      '/matters/1/work/2?from=%2Fmatters%2F1%2Fwork',
    )
    expect(withFrom('/m?x=1&from=old', '/new')).toBe('/m?x=1&from=%2Fnew')
  })
})
