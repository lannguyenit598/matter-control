import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ session: vi.fn(), get: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getSession: api.session }))
vi.mock('../repository', () => ({ matterRepository: { get: api.get } }))

import { McError } from '@/lib/mc/errors'

import { MatterScope } from './matter-scope'

beforeEach(() => {
  api.session.mockReset()
  api.get.mockReset()
})

describe('authorized scope header', () => {
  it('uses actual workspace, matter, role and read instant for every child screen', async () => {
    api.session.mockResolvedValue({ userId: 'synthetic' })
    api.get.mockResolvedValue({
      matter: { workspaceId: 'workspace-1', title: 'Synthetic Matter', callerRole: 'VIEWER' },
      asOf: '2026-10-28T00:00:00Z',
    })
    render(await MatterScope({ matterId: 'matter-1', children: <p>Child screen</p> }))
    expect(screen.getByRole('link', { name: /Workspace/ })).toHaveAttribute(
      'href',
      '/workspaces/workspace-1',
    )
    expect(screen.getByRole('link', { name: 'Synthetic Matter' })).toHaveAttribute(
      'href',
      '/matters/matter-1',
    )
    expect(screen.getByText('VIEWER')).toBeInTheDocument()
    expect(screen.getByText('2026-10-28 00:00 UTC')).toHaveAttribute(
      'dateTime',
      '2026-10-28T00:00:00Z',
    )
    expect(screen.getByText('Child screen')).toBeInTheDocument()
  })
  it('does not present a stale scope or child content after read access ends', async () => {
    api.session.mockResolvedValue({ userId: 'synthetic' })
    api.get.mockRejectedValue(new McError('not-found', 404))
    render(await MatterScope({ matterId: 'matter-1', children: <p>Protected child</p> }))
    expect(screen.queryByText('Protected child')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Current matter scope' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('This matter is not available')).toBeInTheDocument()
  })
  it('requires a session before reading scope', async () => {
    api.session.mockResolvedValue(null)
    render(await MatterScope({ matterId: 'matter-1', children: <p>Protected child</p> }))
    expect(api.get).not.toHaveBeenCalled()
    expect(screen.getByText('Sign-in required')).toBeInTheDocument()
    expect(screen.queryByText('Protected child')).not.toBeInTheDocument()
  })
})
