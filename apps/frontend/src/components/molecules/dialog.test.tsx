import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from './dialog'

function setup() {
  const onOpenChange = vi.fn()
  render(
    <Dialog open onOpenChange={onOpenChange} title="Edit">
      <input aria-label="Name" />
    </Dialog>,
  )
  return { onOpenChange, dialog: screen.getByRole('dialog'), input: screen.getByLabelText('Name') }
}

describe('Dialog', () => {
  it('closes on a backdrop click', () => {
    const { onOpenChange, dialog } = setup()
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  // Selecting text and releasing over the backdrop fires `click` on the <dialog> itself.
  it('stays open when a press starts inside and ends on the backdrop', () => {
    const { onOpenChange, dialog, input } = setup()
    fireEvent.pointerDown(input)
    fireEvent.click(dialog)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  // Chromium makes a repeated Escape non-cancelable and closes the <dialog> itself.
  it('reopens after a browser-forced close when the caller keeps it open', () => {
    const { onOpenChange, dialog, input } = setup()
    act(() => (dialog as HTMLDialogElement).close())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(dialog).toHaveAttribute('open')
    expect(input).toBeInTheDocument()
  })

  // keepMounted lets an unresolved form (e.g. unknown outcome) survive close and reopen.
  it('keeps children mounted while closed only with keepMounted', () => {
    const { rerender } = render(
      <Dialog open={false} onOpenChange={() => {}} title="Edit">
        <input aria-label="Name" />
      </Dialog>,
    )
    expect(screen.queryByLabelText('Name')).toBeNull()
    rerender(
      <Dialog open={false} onOpenChange={() => {}} title="Edit" keepMounted>
        <input aria-label="Name" />
      </Dialog>,
    )
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
