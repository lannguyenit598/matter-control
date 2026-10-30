import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/my-actions' }))

import { AppSidebar } from '@/components/organisms/app-sidebar'

import { DashboardTemplate } from './dashboard-template'

describe('DashboardTemplate', () => {
  it('keeps navigation, account controls and a skip target available in the flat shell', () => {
    render(
      <DashboardTemplate
        sidebar={
          <AppSidebar
            brand="MatterControl"
            items={[{ href: '/my-actions', label: 'My Work' }]}
            footer={<button>Account preferences</button>}
          />
        }
        header={<button>Open mobile navigation</button>}
      >
        <h1>My Work</h1>
      </DashboardTemplate>,
    )
    const main = screen.getByRole('main')
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      `#${main.id}`,
    )
    expect(within(main).getByRole('heading', { name: 'My Work' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Account preferences' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open mobile navigation' })).toBeInTheDocument()
  })
})
