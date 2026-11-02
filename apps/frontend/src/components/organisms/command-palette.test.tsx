import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommandPalette } from './command-palette'

// The palette renders plain destination links; the mock keeps jsdom free of the app router while
// preserving the click contract the palette relies on (onClick fires, navigation does not).
vi.mock('next/link', () => ({
  default: function MockLink({
    href,
    onClick,
    children,
  }: {
    href: string
    onClick?: (event: { preventDefault: () => void }) => void
    children: React.ReactNode
  }) {
    return (
      <a
        href={href}
        onClick={(event) => {
          event.preventDefault()
          onClick?.(event)
        }}
      >
        {children}
      </a>
    )
  },
}))

const destinations = [
  { href: '/my-actions', en: 'My Work', vi: 'Việc của tôi' },
  { href: '/matters', en: 'Matters', vi: 'Hồ sơ' },
]

function openPalette(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole('button', { name: /search/i }))
}

const dialogElement = () => document.querySelector('dialog') as HTMLDialogElement

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CommandPalette', () => {
  it('names the search trigger even when its visible text is hidden on a small screen', () => {
    render(<CommandPalette destinations={destinations} />)
    expect(screen.getByRole('button', { name: 'Search pages' })).toHaveAttribute(
      'aria-label',
      'Search pages',
    )
  })

  it('lists every destination once opened and closes from the dialog close button', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await openPalette(user)
    expect(screen.getByRole('link', { name: 'My Work' })).toHaveAttribute('href', '/my-actions')
    expect(screen.getByRole('link', { name: 'Matters' })).toHaveAttribute('href', '/matters')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialogElement().open).toBe(false)
  })

  it('filters destinations by either language', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await openPalette(user)
    await user.type(screen.getByLabelText('Filter pages'), 'hồ')
    expect(screen.queryByRole('link', { name: 'My Work' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Matters' })).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Filter pages'))
    await user.type(screen.getByLabelText('Filter pages'), 'work')
    expect(screen.getByRole('link', { name: 'My Work' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Matters' })).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await openPalette(user)
    await user.type(screen.getByLabelText('Filter pages'), 'zzz')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('No page matches this search.')).toBeInTheDocument()
  })

  it('Enter opens the first match and closes the palette', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await openPalette(user)
    await user.type(screen.getByLabelText('Filter pages'), 'hồ')
    await user.keyboard('{Enter}')
    expect(dialogElement().open).toBe(false)
  })

  it('Control-K opens the palette and does not steal the key from the open dialog', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await user.keyboard('{Control>}k{/Control}')
    expect(dialogElement().open).toBe(true)
    // Inside the palette the shortcut still toggles: the input belongs to this palette.
    await user.type(screen.getByLabelText('Filter pages'), 'm')
    await user.keyboard('{Control>}k{/Control}')
    expect(dialogElement().open).toBe(false)
  })

  it('ArrowDown moves focus into the result list', async () => {
    const user = userEvent.setup()
    render(<CommandPalette destinations={destinations} />)
    await openPalette(user)
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('link', { name: 'My Work' })).toHaveFocus()
  })
})
