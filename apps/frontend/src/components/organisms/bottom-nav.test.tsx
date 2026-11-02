import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ path: '/matters/m1/work/a1', locale: 'en' }))
vi.mock('next/navigation', () => ({ usePathname: () => state.path }))
vi.mock('@/hooks/use-locale', () => ({ useLocale: () => state.locale }))

import { BottomNav } from './bottom-nav'

const items = [
  { href: '/my-actions', label: 'My Work' },
  { href: '/my-reviews', label: 'Reviews due' },
  { href: '/matters', label: 'Matters', alsoActiveFor: ['/requirements'] },
  { href: '/workspaces', label: 'Workspaces' },
]

beforeEach(() => {
  state.path = '/matters/m1/work/a1'
  state.locale = 'en'
})

describe('BottomNav', () => {
  it('keeps the existing destinations as real links and identifies the current parent section', () => {
    render(<BottomNav items={items} />)
    const nav = within(screen.getByRole('navigation', { name: 'Primary navigation' }))
    expect(nav.getAllByRole('link')).toHaveLength(4)
    for (const item of items)
      expect(nav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href)
    expect(nav.getByRole('link', { name: 'Matters' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', { name: 'My Work' })).not.toHaveAttribute('aria-current')
  })

  it('inherits the requirement alias and does not match a different route with the same prefix', () => {
    state.path = '/requirements/r1'
    const view = render(<BottomNav items={items} />)
    expect(screen.getByRole('link', { name: 'Matters' })).toHaveAttribute('aria-current', 'page')
    state.path = '/matters-archive'
    view.rerender(<BottomNav items={items} />)
    expect(screen.getByRole('link', { name: 'Matters' })).not.toHaveAttribute('aria-current')
  })

  it('localizes the navigation landmark', () => {
    state.locale = 'vi'
    render(<BottomNav items={items} />)
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument()
  })
})
