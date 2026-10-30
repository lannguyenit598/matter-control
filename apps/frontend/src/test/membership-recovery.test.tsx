import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

const actions = vi.hoisted(() => ({
  grantWorkspace: vi.fn(),
  searchPeople: vi.fn(),
  revokeWorkspace: vi.fn(),
  grantMatter: vi.fn(),
  revokeMatter: vi.fn(),
}))
vi.mock('@/features/workspaces/actions', () => ({
  grantWorkspaceMemberAction: actions.grantWorkspace,
  searchWorkspacePeopleAction: actions.searchPeople,
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
// (proved against the real actions in src/test/operation-recovery.test.ts).
const UNKNOWN = { ok: false, kind: 'outcome-unknown', error: 'unknown', requiresReread: true }
const PEOPLE = [{ userId: 'user-1', displayName: 'Alex Nguyen' }]

beforeEach(() => {
  router.refresh.mockClear()
  for (const fn of Object.values(actions)) fn.mockReset().mockResolvedValue(UNKNOWN)
  actions.searchPeople.mockResolvedValue({
    status: 'ok',
    options: [{ value: 'user-1', label: 'Alex Nguyen' }],
  })
})

const FORMS = [
  [
    'workspace grant',
    () => render(<GrantWorkspaceMemberForm workspaceId="w" ifMatch='"e"' />),
    'grantWorkspace',
    'Add member',
    'MEMBER',
  ],
  [
    'matter grant',
    () => render(<GrantMatterMemberForm matterId="m" ifMatch='"e"' candidates={PEOPLE} />),
    'grantMatter',
    'Add to matter',
    'VIEWER',
  ],
] as const

async function choose(trigger: string) {
  fireEvent.click(screen.getByRole('button', { name: trigger }))
  const dialog = screen.getByRole('dialog')
  fireEvent.click(await within(dialog).findByRole('radio', { name: 'Alex Nguyen' }))
  return dialog
}
const submit = (dialog: HTMLElement, label: string) =>
  within(dialog).getByRole('button', { name: label })
const closeDialog = () =>
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

describe.each(FORMS)('%s form', (_n, mount, action, label, defaultRole) => {
  it('never offers or performs a second mutation after an ambiguous result', async () => {
    mount()
    const dialog = await choose(label)
    expect(screen.queryByText('user-1')).toBeNull()
    fireEvent.click(submit(dialog, label))
    await screen.findByRole('button', { name: 'Reload current state' })
    expect(within(dialog).queryByRole('button', { name: label })).toBeNull()
    fireEvent.submit(dialog.querySelector('form')!)
    expect(actions[action]).toHaveBeenCalledTimes(1)
  })

  it('keeps the unresolved state when the dialog is closed and reopened', async () => {
    mount()
    const dialog = await choose(label)
    fireEvent.click(submit(dialog, label))
    await screen.findByRole('button', { name: 'Reload current state' })
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: label }))
    // Reopened: still blocked on a re-read, with no fresh submit to resend from.
    expect(screen.getByRole('button', { name: 'Reload current state' })).toBeVisible()
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: label })).toBeNull()
    expect(actions[action]).toHaveBeenCalledTimes(1)
  })

  it('searching, typing and changing the role never submit', async () => {
    mount()
    const dialog = await choose(label)
    const box = within(dialog).getByRole('searchbox')
    fireEvent.change(box, { target: { value: 'Alex & Bao' } })
    fireEvent.keyDown(box, { key: 'Enter' })
    fireEvent.change(within(dialog).getByRole('combobox', { name: /role/i }), {
      target: { value: 'OWNER' },
    })
    expect(actions[action]).not.toHaveBeenCalled()
  })

  it('submits exactly the chosen id and role once, even on a double click', async () => {
    actions[action].mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 20)),
    )
    mount()
    const dialog = await choose(label)
    const button = submit(dialog, label)
    fireEvent.click(button)
    fireEvent.click(button)
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    expect(actions[action]).toHaveBeenCalledOnce()
    expect(actions[action].mock.calls[0]![0]).toMatchObject({
      ifMatch: '"e"',
      userId: 'user-1',
      role: defaultRole,
    })
    // Confirmed success closes the dialog and says so; the refreshed list shows the person.
    await waitFor(() =>
      expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open'),
    )
    expect(screen.getByRole('status')).toHaveTextContent(/added/i)
  })

  it('offers a re-read after a stale (412) answer and keeps the form usable', async () => {
    actions[action].mockResolvedValue({ ok: false, kind: 'stale', error: 'stale' })
    mount()
    const dialog = await choose(label)
    fireEvent.click(submit(dialog, label))
    await within(dialog).findByText('Out of date')
    expect(within(dialog).getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    await waitFor(() => expect(submit(dialog, label)).toBeEnabled())
  })

  it('purges the chosen person when access to the scope is lost', async () => {
    actions[action].mockResolvedValue({ ok: false, kind: 'forbidden', error: 'no' })
    mount()
    const dialog = await choose(label)
    fireEvent.click(submit(dialog, label))
    await within(dialog).findByText('Not permitted')
    expect(within(dialog).queryByText(/Selected:/)).toBeNull()
    // The reset must not leave the picker stuck on "Searching…": the list is read again.
    expect(await within(dialog).findByRole('radio', { name: 'Alex Nguyen' })).not.toBeChecked()
    expect(within(dialog).queryByText('Searching…')).toBeNull()
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
