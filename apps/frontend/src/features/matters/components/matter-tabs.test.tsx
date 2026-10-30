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
