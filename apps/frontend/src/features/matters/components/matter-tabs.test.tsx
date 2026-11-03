import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

const nav = vi.hoisted(() => ({ pathname: '/matters/m1' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))

import { MatterTabs } from './matter-tabs'

beforeEach(() => {
  nav.pathname = '/matters/m1'
})

it.each([
  ['/matters/m1', 'Overview'],
  ['/matters/m1/work', 'Work'],
  ['/matters/m1/work/item-9', 'Work'],
  ['/matters/m1/history', 'History'],
  ['/matters/m1/documents/d1', 'Documents'],
  ['/matters/m1/agenda', 'Agenda'],
  ['/matters/m1/reviews', 'Reviews'],
  ['/matters/m1/control-room', 'Control Room'],
  ['/matters/m1/data', 'Data'],
])('marks the section for %s as current', (pathname, label) => {
  nav.pathname = pathname
  render(<MatterTabs matterId="m1" />)
  const current = screen
    .getAllByRole('link')
    .filter((l) => l.getAttribute('aria-current') === 'page')
  expect(current.map((l) => l.textContent)).toEqual([label])
})

it('links every section with a real internal href', () => {
  render(<MatterTabs matterId="m1" />)
  expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/matters/m1/work')
  expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute('href', '/matters/m1/agenda')
  expect(screen.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
    'href',
    '/matters/m1/reviews',
  )
  expect(screen.getAllByRole('link')).toHaveLength(10)
})

it('keeps every section in one row, with records, data and history after a divider (no menu)', () => {
  render(<MatterTabs matterId="m1" />)
  const nav = screen.getByRole('navigation', { name: 'Matter sections' })
  expect(nav.querySelector('details')).toBeNull()
  const order = [...nav.querySelectorAll('a, [data-slot="tab-divider"]')].map((n) =>
    n.tagName === 'A' ? n.textContent : '|',
  )
  expect(order).toEqual([
    'Overview',
    'Work',
    'Documents',
    'Reviews',
    'Filings',
    'Planning',
    'Agenda',
    '|',
    'Control Room',
    'Data',
    'History',
  ])
})
