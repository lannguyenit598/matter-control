import { describe, expect, it } from 'vitest'

import { calendarDays, moveCalendarDate } from './calendar'

describe('calendar dates', () => {
  it('uses six complete Monday-first weeks across year boundaries', () => {
    const weeks = calendarDays('2026-01')
    expect(weeks).toHaveLength(6)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0]).toEqual([
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ])
  })

  it('clamps month/year navigation to leap days instead of skipping a month', () => {
    expect(moveCalendarDate('2024-01-31', 0, 1)).toBe('2024-02-29')
    expect(moveCalendarDate('2024-02-29', 0, 12)).toBe('2025-02-28')
    expect(moveCalendarDate('2026-01-01', -1)).toBe('2025-12-31')
    expect(moveCalendarDate('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('does not offer dates outside four-digit years', () => {
    expect(moveCalendarDate('0001-01-01', -1)).toBe('')
    expect(moveCalendarDate('9999-12-31', 1)).toBe('')
  })
})
