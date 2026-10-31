import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

import type { DiscoveredMatter } from '../schemas'

import { MatterDiscovery } from './matter-discovery'

const matter = (
  id: string,
  title: string,
  workspaceName: string,
  role = 'EDITOR',
): DiscoveredMatter => ({
  id,
  workspaceId: `w-${id}`,
  title,
  revision: 1,
  eventSeq: 1,
  callerRole: role,
  lastRecordedAt: '2026-10-30T00:00:00Z',
  workspaceName,
})

const base = { query: '', total: 2, nextHref: null, firstHref: null }

describe('MatterDiscovery', () => {
  it('lists matters from several workspaces with their workspace and role', () => {
    render(
      <MatterDiscovery
        {...base}
        items={[matter('m1', 'Atlas', 'Acme'), matter('m2', 'Atlas Holdings', 'Beta', 'VIEWER')]}
      />,
    )
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByRole('link')).toHaveAttribute('href', '/matters/m1')
    expect(rows[0]).toHaveTextContent('Workspace: Acme')
    expect(rows[1]).toHaveTextContent('Workspace: Beta')
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('is a plain GET search that never needs a client script or surrounding form', () => {
    render(<MatterDiscovery {...base} query="atlas" items={[matter('m1', 'Atlas', 'Acme')]} />)
    const form = screen.getByRole('search')
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/matters')
    expect(within(form).getByLabelText('Search matters by name')).toHaveValue('atlas')
    expect(screen.getByRole('link', { name: 'Clear' })).toHaveAttribute('href', '/matters')
  })

  it('keeps workspace administration separately reachable and labelled', () => {
    render(<MatterDiscovery {...base} items={[matter('m1', 'Atlas', 'Acme')]} />)
    expect(
      screen.getByRole('link', { name: /Manage workspaces and their members/ }),
    ).toHaveAttribute('href', '/workspaces')
  })

  it('says why nothing matched and how access works, and offers pagination links', () => {
    const { rerender } = render(<MatterDiscovery {...base} query="zzz" items={[]} total={0} />)
    expect(screen.getByText('No matter matches')).toBeInTheDocument()
    expect(screen.getByText(/Only matters you are a member of are searched/)).toBeInTheDocument()
    rerender(
      <MatterDiscovery
        {...base}
        items={[matter('m1', 'Atlas', 'Acme')]}
        nextHref="/matters?q=a&cursor=c"
        firstHref="/matters?q=a"
      />,
    )
    expect(screen.getByRole('link', { name: 'Show more matters' })).toHaveAttribute(
      'href',
      '/matters?q=a&cursor=c',
    )
    expect(screen.getByRole('link', { name: 'Back to the first results' })).toHaveAttribute(
      'href',
      '/matters?q=a',
    )
  })
})
