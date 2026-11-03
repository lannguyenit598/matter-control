import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }))

import { NavMenu } from './nav-menu'

const items = [
  { href: '/my-actions', label: 'My Work' },
  { href: '/workspaces', label: 'Matters', alsoActiveFor: ['/matters'] },
]

describe('NavMenu', () => {
  beforeEach(() => {
    nav.pathname = '/'
  })

  it('marks a destination current for its own path and for the paths that belong to it', () => {
    nav.pathname = '/matters/m1/work'
    render(<NavMenu items={items} />)
    expect(screen.getByRole('link', { name: 'Matters' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'My Work' })).not.toHaveAttribute('aria-current')
  })

  it('does not treat a longer sibling name as a match', () => {
    nav.pathname = '/mattersX'
    render(<NavMenu items={items} />)
    expect(screen.getByRole('link', { name: 'Matters' })).not.toHaveAttribute('aria-current')
  })
})
