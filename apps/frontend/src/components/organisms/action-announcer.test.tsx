import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { UiLocaleContext } from '@/hooks/use-locale'
import type { McActionResult } from '@/lib/mc/action-result'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { ActionAnnouncer, announceAction } from './action-announcer'
import { ConfirmActionButton } from './confirm-action-button'
import { FormDialog } from './form-dialog'
import { InlineEdit } from './inline-edit'
import { IntentForm } from './intent-form'

function SaveForm({ result, close }: { result: McActionResult; close?: () => void }) {
  return (
    <IntentForm submitLabel="Save" receipted run={async () => result} onSuccess={close}>
      {() => <input name="title" aria-label="Title" defaultValue="Synthetic draft" />}
    </IntentForm>
  )
}

describe('shell action announcements', () => {
  it('keeps confirmed success after the submitting surface unmounts, without stealing focus', async () => {
    function Page() {
      const [open, setOpen] = useState(true)
      return (
        <ActionAnnouncer>
          <button type="button">Keep reading</button>
          {open && <SaveForm result={{ ok: true }} close={() => setOpen(false)} />}
        </ActionAnnouncer>
      )
    }
    render(<Page />)
    const reading = screen.getByRole('button', { name: 'Keep reading' })
    reading.focus()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved.'))
    expect(screen.queryByLabelText('Title')).toBeNull()
    expect(reading).toHaveFocus()
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
  })

  it('updates the persistent region even when two successive messages are identical', () => {
    render(<ActionAnnouncer />)
    act(() => announceAction({ en: 'Saved.', vi: 'Đã lưu.' }))
    const first = screen.getByText('Saved.')
    act(() => announceAction({ en: 'Saved.', vi: 'Đã lưu.' }))
    expect(screen.getByText('Saved.')).not.toBe(first)
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('announces unknown results honestly once, without echoing raw result data into the shell', async () => {
    render(
      <UiLocaleContext.Provider value="vi">
        <ActionAnnouncer>
          <SaveForm
            result={{
              ok: false,
              kind: 'outcome-unknown',
              error: 'technical detail',
              retrySameKey: true,
            }}
          />
        </ActionAnnouncer>
      </UiLocaleContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Chưa xác nhận được kết quả'),
    )
    expect(screen.getByRole('status')).not.toHaveTextContent('technical detail')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: /Thử lại đúng yêu cầu/ })).toBeInTheDocument()
  })

  it('keeps local live feedback when a form is used without the app shell', async () => {
    render(<SaveForm result={{ ok: false, kind: 'validation', error: 'Check the title' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Check the title'))
  })

  it('does not announce the dialog success notice a second time', async () => {
    render(
      <ActionAnnouncer>
        <FormDialog trigger="Add" title="New record" successNotice="Record added">
          {() => <SaveForm result={{ ok: true }} />}
        </FormDialog>
      </ActionAnnouncer>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByText('Record added')).toBeVisible())
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Saved.')
  })

  it('announces confirmed actions and inline saves through the same shell channel', async () => {
    const confirm = vi.fn().mockResolvedValue({ ok: true })
    const edit = vi.fn().mockResolvedValue({ ok: true })
    render(
      <ActionAnnouncer>
        <ConfirmActionButton
          label="Remove"
          confirmLabel="Confirm removal"
          warning="Remove this synthetic link?"
          run={confirm}
        />
        <InlineEdit label="title" value="Before" canEdit run={edit} />
      </ActionAnnouncer>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved.'))
    expect(confirm).toHaveBeenCalledOnce()
    const first = screen.getByRole('status').firstChild
    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'title' }), { target: { value: 'After' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(edit).toHaveBeenCalledWith('After'))
    await waitFor(() => expect(screen.getByRole('status').firstChild).not.toBe(first))
  })
})
