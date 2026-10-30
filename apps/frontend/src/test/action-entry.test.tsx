import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const actions = vi.hoisted(() => ({
  createAction: vi.fn(),
  createRequirement: vi.fn(),
  createMilestone: vi.fn(),
  createParty: vi.fn(),
  createWorkstream: vi.fn(),
  recordSignature: vi.fn(),
}))
vi.mock('@/features/work/actions', () => ({
  createActionAction: actions.createAction,
  createMilestoneAction: actions.createMilestone,
  createPartyAction: actions.createParty,
  createWorkstreamAction: actions.createWorkstream,
  updatePartyAction: vi.fn(),
  setMilestonePrerequisitesAction: vi.fn(),
}))
vi.mock('@/features/requirements/actions', () => ({
  createRequirementAction: actions.createRequirement,
}))
vi.mock('@/features/proof/actions', () => ({
  createDocumentAction: vi.fn(),
  promoteVersionAction: vi.fn(),
  recordSignatureAction: actions.recordSignature,
}))

import { CreateRequirementForm } from '@/features/requirements/components/create-requirement-form'
import { SignatureDialog, UploadVersionDialog } from '@/features/proof/components/document-forms'
import { AddWorkDialog } from '@/features/work/components/add-work-dialog'
import { CreateActionForm } from '@/features/work/components/create-action-form'
import { MilestoneList, PartyList, WorkstreamList } from '@/features/work/components/planning-view'

beforeEach(() => {
  router.refresh.mockClear()
  router.push.mockClear()
  for (const fn of Object.values(actions)) fn.mockReset()
  window.sessionStorage.clear()
})

const closeDialog = () =>
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

function addWork() {
  return render(
    <AddWorkDialog
      actionForm={<CreateActionForm matterId="m1" />}
      requirementForm={<CreateRequirementForm matterId="m1" />}
    />,
  )
}

describe('Add work', () => {
  it('shows no editor until the button is used, and opening sends nothing', () => {
    addWork()
    expect(screen.getByRole('button', { name: 'Add work' })).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull() // closed dialog is not exposed
    expect(screen.getAllByLabelText(/^Title/)[0]).not.toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: /^Action/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(dialog).getByText(/Prepare the board resolutions/)).toBeVisible()
    expect(within(dialog).getByText(/Completing an action does not verify it/)).toBeVisible()
    expect(actions.createAction).not.toHaveBeenCalled()
    expect(actions.createRequirement).not.toHaveBeenCalled()
  })

  it('keeps each kind separate: a typed draft survives switching and close/reopen', () => {
    addWork()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    const dialog = screen.getByRole('dialog')
    const actionTitle = within(dialog).getAllByLabelText(/^Title/)[0]!
    fireEvent.change(actionTitle, { target: { value: 'Prepare resolutions' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^Requirement/ }))
    expect(actionTitle).not.toBeVisible()
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Action/ }))
    expect(within(screen.getByRole('dialog')).getAllByLabelText(/^Title/)[0]).toBe(actionTitle)
    expect(actionTitle).toHaveValue('Prepare resolutions')
    expect(actions.createAction).not.toHaveBeenCalled()
  })

  it('does not hide an unconfirmed request when the other kind is chosen, and never resends', async () => {
    actions.createAction.mockResolvedValue({
      ok: false,
      kind: 'outcome-unknown',
      error: 'unknown',
      retrySameKey: true,
    })
    addWork()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getAllByLabelText(/^Title/)[0]!, { target: { value: 'T' } })
    fireEvent.change(within(dialog).getAllByLabelText(/^Outcome/)[0]!, { target: { value: 'O' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create action' }))
    await within(dialog).findByText('Outcome not confirmed')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Requirement/ }))
    // The Action form is out of sight, but its choice says it still needs attention.
    expect(within(dialog).getByRole('button', { name: /^Action.*Not finished/ })).toBeVisible()
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Action/ }))
    expect(screen.getByText('Outcome not confirmed')).toBeVisible()
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Retry the same request/ }),
    ).toBeVisible()
    expect(actions.createAction).toHaveBeenCalledTimes(1)
  })

  it('sends a double click once and routes to the new action', async () => {
    actions.createAction.mockImplementation(
      () => new Promise((r) => setTimeout(() => r({ ok: true, id: 'a1' }), 20)),
    )
    addWork()
    fireEvent.click(screen.getByRole('button', { name: 'Add work' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getAllByLabelText(/^Title/)[0]!, { target: { value: 'T' } })
    fireEvent.change(within(dialog).getAllByLabelText(/^Outcome/)[0]!, { target: { value: 'O' } })
    const submit = within(dialog).getByRole('button', { name: 'Create action' })
    fireEvent.click(submit)
    fireEvent.click(submit)
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/matters/m1/work/a1'))
    expect(actions.createAction).toHaveBeenCalledOnce()
  })
})

describe('Planning: each section owns its button', () => {
  const owner = () =>
    render(
      <>
        <MilestoneList matterId="m1" milestones={[]} titles={{}} requirements={[]} isOwner />
        <PartyList matterId="m1" parties={[]} canEdit />
        <WorkstreamList matterId="m1" workstreams={[]} canEdit />
      </>,
    )

  it('shows lists first and opens only the chosen section editor', () => {
    owner()
    for (const name of ['Add milestone', 'Add external party', 'Add workstream'])
      expect(screen.getByRole('button', { name })).toBeVisible()
    expect(screen.getByText('No milestones yet.')).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add external party' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Add external party' })).toBeVisible()
    expect(within(dialog).getByLabelText(/^Name/)).toBeVisible()
    expect(actions.createParty).not.toHaveBeenCalled()
  })

  it('keeps a typed draft across close and reopen, then closes on a confirmed save', async () => {
    actions.createWorkstream.mockResolvedValue({ ok: true })
    owner()
    fireEvent.click(screen.getByRole('button', { name: 'Add workstream' }))
    fireEvent.change(screen.getByLabelText(/^Workstream name/), { target: { value: 'Tax' } })
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Add workstream' }))
    expect(screen.getByLabelText(/^Workstream name/)).toHaveValue('Tax')
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add workstream' }))
    await screen.findByText('Workstream added.')
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    expect(actions.createWorkstream).toHaveBeenCalledOnce()
  })

  it('offers no add button to people who may not use it', () => {
    render(
      <>
        <MilestoneList
          matterId="m1"
          milestones={[]}
          titles={{}}
          requirements={[]}
          isOwner={false}
        />
        <PartyList matterId="m1" parties={[]} canEdit={false} />
        <WorkstreamList matterId="m1" workstreams={[]} canEdit={false} />
      </>,
    )
    expect(screen.queryByRole('button', { name: /^Add / })).toBeNull()
    expect(screen.getByText(/limited to matter owners/)).toBeVisible()
  })
})

describe('a task dialog after the outcome', () => {
  const open = () => {
    render(<SignatureDialog matterId="m1" versionId="v1" versionLabel="Version 2 · spa.pdf" />)
    fireEvent.click(screen.getByRole('button', { name: 'Record signature' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^Signer/), { target: { value: 'Alex' } })
    fireEvent.change(within(dialog).getByLabelText(/^Observed signed at/), {
      target: { value: '2026-10-28T09:00' },
    })
    return dialog
  }

  it('names the exact version, stays open on an unknown outcome and never resends', async () => {
    actions.recordSignature.mockResolvedValue({
      ok: false,
      kind: 'outcome-unknown',
      error: 'unknown',
      requiresReread: true,
    })
    const dialog = open()
    expect(within(dialog).getByText('Version 2 · spa.pdf')).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record signature' }))
    await within(dialog).findByRole('button', { name: 'Reload current state' })
    expect(screen.queryByText('Signature recorded.')).toBeNull()
    expect(dialog).toHaveAttribute('open')
    fireEvent.submit(dialog.querySelector('form')!)
    expect(actions.recordSignature).toHaveBeenCalledOnce()
  })

  it('closes and says what was recorded only after a confirmed success', async () => {
    actions.recordSignature.mockResolvedValue({ ok: true })
    const dialog = open()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Record signature' }))
    await screen.findByText('Signature recorded.')
    expect(dialog).not.toHaveAttribute('open')
    expect(router.refresh).toHaveBeenCalled()
  })
})

describe('Upload new version', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  const file = new File(['%PDF'], 'spa.pdf', { type: 'application/pdf' })
  const choose = (dialog: HTMLElement) => {
    const input = dialog.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)
  }
  const open = () => {
    render(<UploadVersionDialog matterId="m1" documentId="d1" documentName="Share purchase" />)
    expect(screen.getByRole('button', { name: 'Upload new version' })).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Upload new version' }))
    return screen.getByRole('dialog')
  }

  it('names the document and keeps the chosen File in memory across close and reopen', async () => {
    const dialog = open()
    expect(within(dialog).getByText('Share purchase')).toBeVisible()
    choose(dialog)
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Upload version' })).toBeEnabled(),
    )
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Upload new version' }))
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Upload version' }),
    ).toBeEnabled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps an unconfirmed upload open for the same-key retry and never uploads twice by itself', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'))
    const dialog = open()
    choose(dialog)
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Upload version' })).toBeEnabled(),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload version' }))
    await within(dialog).findByText('Outcome not confirmed')
    closeDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Upload new version' }))
    expect(screen.getByText('Outcome not confirmed')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Retry upload' })).toBeEnabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('closes and says it was stored only after the server confirmed it', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, replayed: false }), { status: 200 }),
    )
    const dialog = open()
    choose(dialog)
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Upload version' })).toBeEnabled(),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Upload version' }))
    // once beside the trigger (visible), once in the form inside the now-closed dialog
    const notices = await screen.findAllByText('Version stored.')
    expect(notices.some((n) => n.closest('dialog') === null)).toBe(true)
    expect(dialog).not.toHaveAttribute('open')
    expect(router.refresh).toHaveBeenCalled()
  })
})
