import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AgendaEntry } from '../agenda'

import { AgendaFilters } from './agenda-filters'
import { AgendaView } from './agenda-view'

const entry = (key: string, dueAt: string, over: Partial<AgendaEntry> = {}): AgendaEntry => ({
  key,
  kind: 'work',
  title: `Title ${key}`,
  dueAt,
  href: `/matters/m1/work/${key}`,
  timing: 'ON_TRACK',
  state: 'NOT_STARTED',
  critical: false,
  ...over,
})

const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
let deviceZone = 'UTC'
beforeEach(() => {
  deviceZone = 'UTC'
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...resolvedOptions.call(this), timeZone: deviceZone }
  })
})
afterEach(() => vi.restoreAllMocks())

describe('AgendaView', () => {
  it('groups by the calendar day of the display zone and keeps the source link with its origin', () => {
    const rows = [entry('a', '2026-10-29T20:30:00Z'), entry('b', '2026-10-29T08:00:00Z')]
    const { unmount } = render(<AgendaView entries={rows} here="/matters/m1/agenda" />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1) // both on 29 Oct UTC
    const link = screen.getByRole('link', { name: 'Title a' })
    const url = new URL(link.getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/matters/m1/work/a')
    expect(url.searchParams.get('from')).toBe('/matters/m1/agenda')
    unmount()

    deviceZone = 'Asia/Ho_Chi_Minh'
    render(<AgendaView entries={rows} here="/matters/m1/agenda" />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2) // 20:30Z is already 30 Oct
    expect(screen.getByText(/Asia\/Ho_Chi_Minh/)).toBeInTheDocument()
  })

  it('says what the page is not: overdue shown, no computed deadline, milestones unlabelled by timing', () => {
    render(
      <AgendaView
        entries={[
          entry('o', '2026-10-01T09:00:00Z', { timing: 'OVERDUE' }),
          entry('m', '2026-10-02T09:00:00Z', {
            kind: 'milestone',
            timing: null,
            state: 'NOT_READY',
            critical: true,
          }),
        ]}
        here="/x"
      />,
    )
    const rows = screen.getAllByRole('listitem')
    expect(within(rows[0]!).getByText('Overdue')).toBeInTheDocument()
    expect(within(rows[1]!).queryByText('Overdue')).toBeNull()
    expect(within(rows[1]!).getByText('Milestone due date')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Not ready')).toBeInTheDocument()
  })

  it('an empty result is an honest empty state, not "no deadlines"', () => {
    render(<AgendaView entries={[]} here="/x" />)
    expect(screen.getByText('No dated work to show')).toBeInTheDocument()
    expect(screen.getByText(/not scheduled and are not listed here/)).toBeInTheDocument()
  })
})

describe('AgendaFilters', () => {
  it('keeps the other filter when one changes and marks the current ones', () => {
    render(
      <AgendaFilters basePath="/matters/m1/agenda" query={{ source: 'work', timing: 'OVERDUE' }} />,
    )
    expect(screen.getByRole('link', { name: 'Milestones' })).toHaveAttribute(
      'href',
      '/matters/m1/agenda?source=milestone&timing=OVERDUE',
    )
    expect(screen.getByRole('link', { name: 'Any timing' })).toHaveAttribute(
      'href',
      '/matters/m1/agenda?source=work',
    )
    expect(screen.getByRole('link', { name: 'Work items' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Overdue' })).toHaveAttribute('aria-current', 'true')
  })
})
