import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const repos = vi.hoisted(() => ({
  matter: vi.fn(),
  members: vi.fn(),
  parties: vi.fn(),
  list: vi.fn(),
  session: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/lib/auth', () => ({ getSession: repos.session }))
vi.mock('@/features/matters/repository', () => ({
  matterRepository: { get: repos.matter, members: repos.members },
}))
vi.mock('@/features/work/repository', () => ({
  workRepository: { parties: repos.parties, list: repos.list },
}))

import NewFilingPage from './page'

/** Runs the real page composition (a server component) and renders what it returns. */
async function renderPage() {
  const tree = NewFilingPage({ params: Promise.resolve({ matterId: 'm1' }) } as never)
  const inner = (
    tree as { props: { children: { type: (p: unknown) => Promise<unknown>; props: unknown } } }
  ).props.children
  render((await inner.type(inner.props)) as never)
}

beforeEach(() => {
  Object.values(repos).forEach((r) => r.mockReset())
  repos.session.mockResolvedValue({ userId: 'u1' })
  repos.matter.mockResolvedValue({ matter: { title: 'Atlas', callerRole: 'EDITOR' } })
  repos.members.mockResolvedValue({
    items: [{ userId: 'u1', displayName: 'Alice', status: 'ACTIVE' }],
  })
  repos.parties.mockResolvedValue({ items: [{ id: 'p1', name: 'Registry' }] })
  repos.list.mockResolvedValue({
    page: { items: [{ item: { id: 'r1', title: 'Board approval obtained' } }] },
  })
})

describe('New filing page', () => {
  it('shows the matter, a way back and the creation form with names, never raw ids', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { name: 'New filing' })).toBeVisible()
    expect(screen.getByText('Atlas')).toBeVisible()
    expect(screen.getByRole('link', { name: /All filings/ })).toHaveAttribute(
      'href',
      '/matters/m1/filings',
    )
    expect(screen.getByRole('button', { name: 'Create filing' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Board approval obtained' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Registry' })).toBeInTheDocument()
    expect(screen.queryByText('r1')).toBeNull()
  })

  it('lists what is missing and where to add it instead of a fake default', async () => {
    repos.parties.mockResolvedValue({ items: [] })
    repos.list.mockResolvedValue({ page: { items: [] } })
    await renderPage()
    expect(screen.queryByRole('button', { name: 'Create filing' })).toBeNull()
    expect(screen.getByRole('link', { name: /choose Add work and Requirement/ })).toHaveAttribute(
      'href',
      '/matters/m1/work',
    )
    expect(screen.getByRole('link', { name: /authority under Planning/ })).toHaveAttribute(
      'href',
      '/matters/m1/planning',
    )
  })

  it('offers no form to a viewer', async () => {
    repos.matter.mockResolvedValue({ matter: { title: 'Atlas', callerRole: 'VIEWER' } })
    await renderPage()
    expect(screen.queryByRole('button', { name: 'Create filing' })).toBeNull()
    expect(screen.getByText(/Only owners and editors/)).toBeVisible()
  })

  it('asks to sign in without reading anything', async () => {
    repos.session.mockResolvedValue(null)
    await renderPage()
    expect(repos.matter).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Create filing' })).toBeNull()
  })
})
