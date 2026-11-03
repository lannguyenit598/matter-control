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
    ['/a/b/../c?x=1', '/a/c?x=1'], // normal dot segments are canonicalized as before
    ['/a/./b', '/a/b'],
    ['/a%2F%2Fb', '/a%2F%2Fb'], // an encoded slash stays inside one path
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
    '/x/../login', // dot segments are resolved before the deny-list is applied
    '/matters/../api/auth/logout',
    // canonicalization can turn these into a protocol-relative "//host": the OUTPUT is checked too
    '/..//evil.test',
    '/x/..//evil.test',
    '/a/../..//evil.test',
    '/..///evil.test',
    '/%2e%2e//evil.test',
    '/.//evil.test',
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
