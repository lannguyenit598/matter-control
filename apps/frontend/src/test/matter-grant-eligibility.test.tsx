import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const grant = vi.hoisted(() => vi.fn())
vi.mock('@/features/matters/actions', () => ({
  grantMatterMemberAction: grant,
  revokeMatterMemberAction: vi.fn(),
  createMatterAction: vi.fn(),
}))

import { GrantMatterMemberForm } from '@/features/matters/components/grant-matter-member-form'

const ALEX = { userId: 'u1', displayName: 'Alex' }
const BAO = { userId: 'u2', displayName: 'Bao' }
const view = (ifMatch: string, candidates: (typeof ALEX)[]) => (
  <GrantMatterMemberForm matterId="m1" ifMatch={ifMatch} candidates={candidates} />
)
const closeDialog = () =>
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
const radios = () => within(screen.getByRole('dialog')).queryAllByRole('radio')

beforeEach(() => {
  router.refresh.mockClear()
  grant.mockReset()
})

describe('matter grant: eligibility after a reread (UXR-01)', () => {
  it('drops a person who is no longer eligible, keeps the role, and never sends the old id', async () => {
    grant.mockResolvedValue({ ok: false, kind: 'rejected', error: 'x' })
    const { rerender } = render(view('"1"', [ALEX, BAO]))
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('radio', { name: 'Alex' }))
    fireEvent.change(within(dialog).getByRole('combobox', { name: /role/i }), {
      target: { value: 'EDITOR' },
    })
    rerender(view('"2"', [BAO]))
    expect(within(dialog).queryByRole('radio', { name: 'Alex' })).toBeNull()
    expect(await within(dialog).findByRole('radio', { name: 'Bao' })).not.toBeChecked()
    expect(within(dialog).getByRole('combobox', { name: /role/i })).toHaveValue('EDITOR')
    fireEvent.submit(dialog.querySelector('form')!)
    await waitFor(() => expect(grant).toHaveBeenCalledOnce())
    expect(grant.mock.calls[0]![0]).toMatchObject({ ifMatch: '"2"', userId: '', role: 'EDITOR' })
  })

  it('applies a refresh that happened while the dialog was closed', async () => {
    const { rerender } = render(view('"1"', [ALEX]))
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    fireEvent.click(await screen.findByRole('radio', { name: 'Alex' }))
    closeDialog()
    rerender(view('"2"', []))
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    await screen.findByText(/No one to add/)
    expect(radios()).toHaveLength(0)
    expect(screen.queryByText(/Selected:/)).toBeNull()
  })

  it('does not resend, remount or clear a pending command when candidates change', async () => {
    grant.mockImplementation(() => new Promise(() => {}))
    const { rerender } = render(view('"1"', [ALEX, BAO]))
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(await within(dialog).findByRole('radio', { name: 'Alex' }))
    const submit = within(dialog).getByRole('button', { name: 'Add to matter' })
    fireEvent.click(submit)
    fireEvent.click(submit)
    rerender(view('"2"', [BAO]))
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    expect(grant).toHaveBeenCalledOnce()
    expect(grant.mock.calls[0]![0]).toMatchObject({ ifMatch: '"1"', userId: 'u1' })
    // The same IntentForm instance is still waiting on its answer (button busy, not a new form).
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to matter' }),
    ).toHaveAttribute('aria-busy', 'true')
  })

  it('keeps an unresolved UNKNOWN re-read-only state across a candidate change and reopen', async () => {
    grant.mockResolvedValue({
      ok: false,
      kind: 'outcome-unknown',
      error: 'u',
      requiresReread: true,
    })
    const { rerender } = render(view('"1"', [ALEX, BAO]))
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    fireEvent.click(await screen.findByRole('radio', { name: 'Alex' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add to matter' }),
    )
    await screen.findByRole('button', { name: 'Reload current state' })
    rerender(view('"2"', [BAO]))
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Add to matter' }))
    expect(screen.getByRole('button', { name: 'Reload current state' })).toBeVisible()
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    expect(grant).toHaveBeenCalledOnce()
  })
})
