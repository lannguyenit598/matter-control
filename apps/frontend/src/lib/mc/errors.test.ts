import { describe, expect, it } from 'vitest'

import { toMcFailure } from './action-result'
import { codeFromType, McError, readFailureKind } from './errors'

describe('product problems', () => {
  it('reads the code from the urn type and never trusts anything else', () => {
    expect(codeFromType('urn:mc:not-found')).toBe('not-found')
    expect(codeFromType('urn:mc:made-up')).toBe('unknown')
    expect(codeFromType('about:blank')).toBe('unknown')
    expect(codeFromType(undefined)).toBe('unknown')
  })

  it.each([
    ['unauthenticated', 'sign-in'],
    ['forbidden', 'forbidden'],
    ['not-found', 'not-found'],
    ['unavailable', 'unavailable'],
    ['boundary-due', 'unavailable'],
    ['internal', 'error'],
  ] as const)('read failure %s is presented as %s', (code, kind) => {
    expect(readFailureKind(new McError(code, 400))).toBe(kind)
  })

  it('treats an AuthError like a missing session', () => {
    const e = Object.assign(new Error('x'), { name: 'AuthError', reason: 'unauthenticated' })
    expect(readFailureKind(e)).toBe('sign-in')
    expect(toMcFailure(e)).toMatchObject({ ok: false, kind: 'unauthenticated' })
  })
})

describe('toMcFailure: one distinct recovery per outcome', () => {
  const kindOf = (code: ConstructorParameters<typeof McError>[0]) =>
    toMcFailure(new McError(code, 400))

  it('a RECEIPTED unknown outcome keeps the key and says nothing was rolled back', () => {
    const r = toMcFailure(new McError('outcome-unknown', 503, { receipted: true }))
    expect(r).toMatchObject({ kind: 'outcome-unknown', retrySameKey: true })
    expect('requiresReread' in r && r.requiresReread).toBeFalsy()
    expect(r.error).toMatch(/not assuming it failed/)
  })
  it('a CAS-only unknown outcome is never a safe resend: it demands a re-read (CW1-F01)', () => {
    const r = toMcFailure(new McError('outcome-unknown', 503, { receipted: false }))
    expect(r).toMatchObject({ kind: 'outcome-unknown', requiresReread: true })
    expect('retrySameKey' in r && r.retrySameKey).toBeFalsy()
    expect(r.error).toMatch(/must not be sent again/)
    expect(r.error).not.toMatch(/safe to send again|Retry/i)
    expect(r.error).toMatch(/not assuming it failed or was rolled back/)
    expect(r.error).toMatch(/may not be able to read it back/)
  })
  it('stale (412) asks for a reload, not a blind retry', () => {
    const r = kindOf('precondition-failed')
    expect(r.kind).toBe('stale')
    expect(r.error).toMatch(/Reload/)
    expect('retrySameKey' in r && r.retrySameKey).toBeFalsy()
  })
  it('unavailable keeps the session and is not a sign-in prompt', () => {
    const r = kindOf('unavailable')
    expect(r.kind).toBe('unavailable')
    expect(r.error).toMatch(/session is unaffected/)
  })
  it('an expired session is distinct from forbidden', () => {
    expect(kindOf('unauthenticated').kind).toBe('unauthenticated')
    expect(kindOf('forbidden').kind).toBe('forbidden')
  })
  it('validation carries per-field messages', () => {
    const e = new McError('validation', 422, {
      fieldErrors: [
        { field: 'title', message: 'required' },
        { field: 'title', message: 'too short' },
      ],
    })
    expect(toMcFailure(e)).toMatchObject({
      kind: 'validation',
      fieldErrors: { title: ['required', 'too short'] },
    })
  })
  it('last owner and key conflicts have their own messages', () => {
    expect(kindOf('last-owner').kind).toBe('last-owner')
    expect(kindOf('idempotency-key-reuse').kind).toBe('key-conflict')
  })
  it('a missing precondition is a frontend bug: generic message, never shown as a user error', () => {
    expect(kindOf('precondition-required')).toMatchObject({ kind: 'error' })
  })
  it('unknown errors are generic and leak nothing', () => {
    const r = toMcFailure(new Error('secret stack detail'))
    expect(r.error).not.toMatch(/secret/)
  })
})
