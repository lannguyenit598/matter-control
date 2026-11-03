import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({ grant: vi.fn(), search: vi.fn() }))
vi.mock('@/features/workspaces/actions', () => ({
  grantWorkspaceMemberAction: actions.grant,
  searchWorkspacePeopleAction: actions.search,
  revokeWorkspaceMemberAction: vi.fn(),
}))

import { GrantWorkspaceMemberForm } from '@/features/workspaces/components/grant-workspace-member-form'
import { setUiLocale } from '@/hooks/use-locale'
import { GrantMatterMemberForm } from '@/features/matters/components/grant-matter-member-form'
import { MatterMembers } from '@/features/matters/components/matter-members'

vi.mock('@/features/matters/actions', () => ({
  grantMatterMemberAction: vi.fn(),
  revokeMatterMemberAction: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  actions.search.mockResolvedValue({ status: 'ok', options: [] })
})

it('sends the typed query to the bounded server search without navigating or mutating', async () => {
  render(<GrantWorkspaceMemberForm workspaceId="w1" ifMatch='"e"' />)
  fireEvent.click(screen.getByRole('button', { name: 'Add member' }))
  const box = within(screen.getByRole('dialog')).getByRole('searchbox')
  fireEvent.change(box, { target: { value: 'Alex & Bao' } })
  await waitFor(() =>
    expect(actions.search).toHaveBeenLastCalledWith({ workspaceId: 'w1', query: 'Alex & Bao' }),
  )
  expect(router.push).not.toHaveBeenCalled()
  expect(router.replace).not.toHaveBeenCalled()
  expect(actions.grant).not.toHaveBeenCalled()
})

it('shows a failed directory read with a retry, not an empty result', async () => {
  actions.search.mockResolvedValueOnce({ status: 'unavailable' }).mockResolvedValue({
    status: 'ok',
    options: [{ value: 'u1', label: 'Alex Nguyen' }],
  })
  render(<GrantWorkspaceMemberForm workspaceId="w1" ifMatch='"e"' />)
  fireEvent.click(screen.getByRole('button', { name: 'Add member' }))
  const dialog = screen.getByRole('dialog')
  await within(dialog).findByText(/not available right now/)
  expect(within(dialog).queryByText(/No matching people/)).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }))
  expect(await within(dialog).findByRole('radio', { name: 'Alex Nguyen' })).toBeInTheDocument()
})

it('refuses to submit when only text was typed and no person was chosen', async () => {
  actions.grant.mockResolvedValue({
    ok: false,
    kind: 'validation',
    error: 'fix',
    fieldErrors: { userId: ['Select a person'] },
  })
  render(<GrantWorkspaceMemberForm workspaceId="w1" ifMatch='"e"' />)
  fireEvent.click(screen.getByRole('button', { name: 'Add member' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'someone-id-123' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Add member' }))
  await within(dialog).findByText('Select a person')
  expect(actions.grant.mock.calls[0]![0]).toMatchObject({ userId: '' }) // typed text never became an id
})

it('matter flow filters only the eligible people it was given, by name', async () => {
  render(
    <GrantMatterMemberForm
      matterId="m1"
      ifMatch='"e"'
      candidates={[
        { userId: 'u1', displayName: 'Alex Nguyen' },
        { userId: 'u2', displayName: 'Bao Tran' },
      ]}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
  const dialog = screen.getByRole('dialog')
  expect(await within(dialog).findAllByRole('radio')).toHaveLength(2)
  fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'BAO' } })
  await waitFor(() => expect(within(dialog).getAllByRole('radio')).toHaveLength(1))
  expect(within(dialog).getByRole('radio', { name: 'Bao Tran' })).toBeInTheDocument()
  expect(actions.search).not.toHaveBeenCalled() // matter candidates never use the workspace directory
})

it('keeps the chosen person and role when the interface language changes', async () => {
  render(
    <GrantMatterMemberForm
      matterId="m1"
      ifMatch='"e"'
      candidates={[{ userId: 'u1', displayName: 'Alex Nguyen' }]}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
  const dialog = screen.getByRole('dialog')
  fireEvent.click(await within(dialog).findByRole('radio', { name: 'Alex Nguyen' }))
  fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'OWNER' } })
  try {
    act(() => setUiLocale('vi'))
    expect(within(dialog).getByRole('radio', { name: 'Alex Nguyen' })).toBeChecked()
    expect(within(dialog).getByRole('combobox')).toHaveValue('OWNER')
    expect(within(dialog).getByText('Vai trò trong hồ sơ')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('searchbox', { name: 'Tìm thành viên không gian theo tên' }),
    ).toBeInTheDocument()
  } finally {
    act(() => setUiLocale('en'))
  }
})

it('shows no add action and no candidate names to someone who cannot administer members', () => {
  render(
    <MatterMembers
      matterId="m1"
      etag='"e"'
      canAdminister={false}
      members={[
        { userId: 'u9', displayName: 'Dana Pham', role: 'VIEWER', status: 'ACTIVE', revision: 1 },
      ]}
      candidates={[
        {
          userId: 'u1',
          displayName: 'Secret Candidate',
          role: 'MEMBER',
          status: 'ACTIVE',
          revision: 1,
        },
      ]}
    />,
  )
  expect(screen.queryByRole('button', { name: /Add to matter/ })).toBeNull()
  expect(screen.queryByText('Secret Candidate')).toBeNull()
  expect(screen.getByText('Dana Pham')).toBeInTheDocument()
})
