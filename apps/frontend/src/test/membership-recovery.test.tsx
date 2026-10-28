import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  grantWorkspace: vi.fn(),
  revokeWorkspace: vi.fn(),
  grantMatter: vi.fn(),
  revokeMatter: vi.fn(),
}))
vi.mock('@/features/workspaces/actions', () => ({
  grantWorkspaceMemberAction: actions.grantWorkspace,
  revokeWorkspaceMemberAction: actions.revokeWorkspace,
  createWorkspaceAction: vi.fn(),
}))
vi.mock('@/features/matters/actions', () => ({
  grantMatterMemberAction: actions.grantMatter,
  revokeMatterMemberAction: actions.revokeMatter,
  createMatterAction: vi.fn(),
}))

import { GrantMatterMemberForm } from '@/features/matters/components/grant-matter-member-form'
import { RevokeMatterMemberButton } from '@/features/matters/components/revoke-matter-member-button'
import { GrantWorkspaceMemberForm } from '@/features/workspaces/components/grant-workspace-member-form'
import { RevokeWorkspaceMemberButton } from '@/features/workspaces/components/revoke-workspace-member-button'

// What the Server Action layer returns for a CAS-only command with an unknown outcome
// (proved against the real actions in src/lib/mc/operation-recovery.test.ts).
const UNKNOWN = { ok: false, kind: 'outcome-unknown', error: 'unknown', requiresReread: true }

beforeEach(() => {
  router.refresh.mockClear()
  for (const fn of Object.values(actions)) fn.mockReset().mockResolvedValue(UNKNOWN)
})

describe.each([
  [
    'workspace grant',
    () => render(<GrantWorkspaceMemberForm workspaceId="w" ifMatch='"e"' />),
    'grantWorkspace',
  ],
  [
    'matter grant',
    () => render(<GrantMatterMemberForm matterId="m" ifMatch='"e"' />),
    'grantMatter',
  ],
] as const)('%s form', (_n, mount, action) => {
  it('never offers or performs a second mutation after an ambiguous result', async () => {
    const { container } = mount()
    fireEvent.change(screen.getByLabelText(/User id/), { target: { value: 'user-1' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add/ }))
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByRole('button', { name: /^Add|Retry/ })).toBeNull()
    fireEvent.submit(container.querySelector('form')!)
    expect(actions[action]).toHaveBeenCalledTimes(1)
  })
})

describe.each([
  [
    'workspace revoke',
    () =>
      render(<RevokeWorkspaceMemberButton workspaceId="w" userId="u" ifMatch='"e"' self={false} />),
    'revokeWorkspace',
  ],
  [
    'matter revoke',
    () => render(<RevokeMatterMemberButton matterId="m" userId="u" ifMatch='"e"' />),
    'revokeMatter',
  ],
] as const)('%s button', (_n, mount, action) => {
  it('keeps UNKNOWN, offers only a re-read, and sends exactly one mutation', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: /^Remove (member|from matter)$/ }))
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull()
    expect(screen.queryByText(/safe to send again/)).toBeNull()
    expect(actions[action]).toHaveBeenCalledTimes(1)
  })
})
