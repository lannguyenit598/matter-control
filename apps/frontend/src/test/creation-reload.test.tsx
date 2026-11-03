import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { DraftScopeProvider } from '@/components/organisms/draft-scope'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
const actions = vi.hoisted(() => ({ workspace: vi.fn(), matter: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/features/workspaces/actions', () => ({ createWorkspaceAction: actions.workspace }))
vi.mock('@/features/matters/actions', () => ({ createMatterAction: actions.matter }))
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form'
import { CreateMatterForm } from '@/features/matters/components/create-matter-form'

beforeEach(() => {
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

const CASES = [
  {
    kind: 'workspace',
    form: () => <CreateWorkspaceForm />,
    field: /^Workspace name/,
    action: actions.workspace,
    open: 'New workspace',
    button: 'Create workspace',
    created: '/workspaces/created',
  },
  {
    kind: 'matter',
    form: () => <CreateMatterForm workspaceId="w1" workspaceName="Acme Legal" ifMatch='"etag"' />,
    field: /^Matter name/,
    action: actions.matter,
    open: 'Create matter',
    button: 'Create matter',
    created: '/matters/created?created=1',
  },
]

const mountIn = (form: () => React.ReactNode) =>
  render(<DraftScopeProvider namespace="creation-session">{form()}</DraftScopeProvider>)
const openDialog = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }))
  return screen.getByRole('dialog')
}
const cancelDialog = () =>
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

it.each(CASES)(
  'retains the $kind create identity and submitted values across a reload',
  async ({ form, field, action, open, button }) => {
    action
      .mockResolvedValueOnce({
        ok: false,
        kind: 'outcome-unknown',
        error: 'Not confirmed',
        retrySameKey: true,
      })
      .mockResolvedValue({ ok: true, id: 'created' })
    const first = mountIn(form)
    const dialog = openDialog(open)
    fireEvent.input(within(dialog).getByLabelText(field), { target: { value: 'Original name' } })
    fireEvent.click(within(dialog).getByRole('button', { name: button }))
    await screen.findByRole('button', { name: /Retry the same request/ })
    fireEvent.input(within(dialog).getByLabelText(field), {
      target: { value: 'Edited afterwards' },
    })
    first.unmount()
    mountIn(form)
    openDialog(open)
    fireEvent.click(screen.getByRole('button', { name: /Retry the same request/ }))
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2))
    expect(action.mock.calls[1]![0]).toEqual(action.mock.calls[0]![0])
  },
)

it.each(CASES)(
  'does not create a second $kind when the dialog is closed and reopened while pending',
  async ({ form, field, action, open, button }) => {
    let finish!: (r: unknown) => void
    action.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    mountIn(form)
    const dialog = openDialog(open)
    fireEvent.input(within(dialog).getByLabelText(field), { target: { value: 'Atlas' } })
    fireEvent.click(within(dialog).getByRole('button', { name: button }))
    await waitFor(() => expect(action).toHaveBeenCalledOnce())
    cancelDialog() // closing is not cancelling the sent command
    openDialog(open)
    const again = within(screen.getByRole('dialog')).getByRole('button', { name: button })
    expect(again).toBeDisabled()
    fireEvent.click(again)
    expect(action).toHaveBeenCalledOnce()
    finish({ ok: true, id: 'created' })
    await waitFor(() => expect(router.push).toHaveBeenCalled())
  },
)

it.each(CASES)(
  'confirmed $kind success closes the dialog and opens the created record',
  async ({ form, field, action, open, button, created }) => {
    action.mockResolvedValue({ ok: true, id: 'created' })
    mountIn(form)
    const dialog = openDialog(open)
    fireEvent.input(within(dialog).getByLabelText(field), { target: { value: 'Atlas' } })
    fireEvent.click(within(dialog).getByRole('button', { name: button }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(created))
    await waitFor(() =>
      expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open'),
    )
  },
)

it('names the workspace and says what can be added afterwards in the create-matter dialog', () => {
  mountIn(CASES[1]!.form)
  const dialog = openDialog('Create matter')
  expect(within(dialog).getByText('Acme Legal')).toBeInTheDocument()
  expect(
    within(dialog).getByText(/People, documents and work can be added afterwards/),
  ).toBeVisible()
})

it('keeps a typed create-matter draft when the dialog is cancelled and reopened', () => {
  mountIn(CASES[1]!.form)
  const dialog = openDialog('Create matter')
  fireEvent.input(within(dialog).getByLabelText(/^Matter name/), { target: { value: 'Kept' } })
  cancelDialog()
  openDialog('Create matter')
  expect(screen.getByLabelText(/^Matter name/)).toHaveValue('Kept')
})
