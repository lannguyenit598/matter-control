import { describe, expect, it } from 'vitest'

import { instantToLocal, offsetLabel, readLocalField, resolveLocal } from './local-time'

describe('resolveLocal', () => {
  it('converts wall-clock time with the zone offset, never a default UTC', () => {
    expect(resolveLocal('2026-10-30T10:00', 'Asia/Ho_Chi_Minh')).toEqual({
      kind: 'ok',
      iso: '2026-10-30T03:00:00Z',
    })
    expect(resolveLocal('2026-10-30T10:00', 'UTC')).toEqual({
      kind: 'ok',
      iso: '2026-10-30T10:00:00Z',
    })
  })

  it('uses the offset of the selected date, including non-hour zones and DST', () => {
    expect(resolveLocal('2026-10-30T10:00', 'Asia/Kolkata')).toEqual({
      kind: 'ok',
      iso: '2026-10-30T04:30:00Z',
    })
    // New York: EDT (-04:00) in summer, EST (-05:00) in winter.
    expect(resolveLocal('2026-07-01T09:00', 'America/New_York')).toEqual({
      kind: 'ok',
      iso: '2026-07-01T13:00:00Z',
    })
    expect(resolveLocal('2026-12-01T09:00', 'America/New_York')).toEqual({
      kind: 'ok',
      iso: '2026-12-01T14:00:00Z',
    })
    // Lord Howe: a 30-minute DST step.
    expect(resolveLocal('2026-01-10T12:00', 'Australia/Lord_Howe')).toEqual({
      kind: 'ok',
      iso: '2026-01-10T01:00:00Z',
    })
    expect(resolveLocal('2026-07-10T12:00', 'Australia/Lord_Howe')).toEqual({
      kind: 'ok',
      iso: '2026-07-10T01:30:00Z',
    })
  })

  it('rejects a local time that does not exist (spring-forward gap)', () => {
    expect(resolveLocal('2026-03-08T02:30', 'America/New_York')).toEqual({ kind: 'nonexistent' })
    expect(resolveLocal('2026-10-04T02:15', 'Australia/Lord_Howe')).toEqual({ kind: 'nonexistent' })
  })

  it('reports both instants for a repeated local time (fall-back overlap)', () => {
    expect(resolveLocal('2026-11-01T01:30', 'America/New_York')).toEqual({
      kind: 'ambiguous',
      earlier: '2026-11-01T05:30:00Z',
      later: '2026-11-01T06:30:00Z',
    })
    expect(resolveLocal('2026-04-05T01:45', 'Australia/Lord_Howe')).toMatchObject({
      kind: 'ambiguous',
    })
  })

  it('treats empty and malformed input explicitly', () => {
    expect(resolveLocal('', 'UTC')).toEqual({ kind: 'empty' })
    expect(resolveLocal('2026-02-30T10:00', 'UTC')).toEqual({ kind: 'invalid' })
    expect(resolveLocal('tomorrow', 'UTC')).toEqual({ kind: 'invalid' })
  })
})

describe('instantToLocal / offsetLabel', () => {
  it('renders an instant as wall-clock time in the zone', () => {
    expect(instantToLocal('2026-10-30T03:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('2026-10-30T10:00')
    expect(instantToLocal('2026-10-30T04:30:00Z', 'Asia/Kolkata')).toBe('2026-10-30T10:00')
    expect(instantToLocal('bad', 'UTC')).toBe('')
  })
  it('labels the offset', () => {
    expect(offsetLabel('2026-10-30T03:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('UTC+07:00')
    expect(offsetLabel('2026-10-30T04:30:00Z', 'Asia/Kolkata')).toBe('UTC+05:30')
    expect(offsetLabel('2026-12-01T14:00:00Z', 'America/New_York')).toBe('UTC-05:00')
    expect(offsetLabel('2026-10-30T10:00:00Z', 'UTC')).toBe('UTC+00:00')
  })
})

describe('readLocalField', () => {
  const zone = 'Asia/Ho_Chi_Minh'
  it('returns an empty value when the field is cleared', () => {
    expect(readLocalField({ dueLocal: '' }, 'due', zone, null)).toEqual({ ok: true, iso: '' })
  })
  it('preserves the exact original instant when the shown value is untouched', () => {
    // The stored instant has seconds the minute-precision control cannot show.
    const original = '2026-10-30T03:00:27Z'
    expect(
      readLocalField({ dueLocal: instantToLocal(original, zone) }, 'due', zone, original),
    ).toEqual({
      ok: true,
      iso: original,
    })
  })
  it('converts an edited value in the device zone', () => {
    expect(
      readLocalField({ dueLocal: '2026-11-02T09:00' }, 'due', zone, '2026-10-30T03:00:00Z'),
    ).toEqual({
      ok: true,
      iso: '2026-11-02T02:00:00Z',
    })
  })
  it('refuses a nonexistent time and an unchosen ambiguous time', () => {
    const ny = 'America/New_York'
    const gap = readLocalField({ dueLocal: '2026-03-08T02:30' }, 'due', ny, null)
    expect(gap).toMatchObject({ ok: false })
    const unchosen = readLocalField({ dueLocal: '2026-11-01T01:30' }, 'due', ny, null)
    expect(unchosen).toMatchObject({ ok: false })
    expect(
      readLocalField({ dueLocal: '2026-11-01T01:30', dueChoice: 'earlier' }, 'due', ny, null),
    ).toEqual({
      ok: true,
      iso: '2026-11-01T05:30:00Z',
    })
    expect(
      readLocalField({ dueLocal: '2026-11-01T01:30', dueChoice: 'later' }, 'due', ny, null),
    ).toEqual({
      ok: true,
      iso: '2026-11-01T06:30:00Z',
    })
  })
})
