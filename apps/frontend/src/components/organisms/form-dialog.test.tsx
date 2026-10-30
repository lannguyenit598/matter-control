import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useContext } from 'react'

import { TaskSuccess } from './intent-form'
import { FormDialog, TaskDialog } from './form-dialog'

function mount() {
  render(
    <FormDialog trigger="Open form" title="Add">
      {({ open, close }) => (
        <>
          <input aria-label="Name" />
          <output aria-label="state">{open ? 'open' : 'closed'}</output>
          <button type="button" onClick={close}>
            Done
          </button>
        </>
      )}
    </FormDialog>,
  )
}

describe('FormDialog', () => {
  it('opens from its one trigger and tells the form it is open', () => {
    mount()
    expect(screen.getByLabelText('state')).toHaveTextContent('closed')
    fireEvent.click(screen.getByRole('button', { name: 'Open form' }))
    expect(screen.getByRole('dialog', { name: 'Add' })).toHaveAttribute('open')
    expect(screen.getByLabelText('state')).toHaveTextContent('open')
  })

  it('keeps typed values when closed and reopened (close is not a reset)', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Open form' }))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Draft' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
    fireEvent.click(screen.getByRole('button', { name: 'Open form' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Draft')
  })

  it('closes on Escape through the dialog cancel event', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Open form' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })
})

function Confirm() {
  const done = useContext(TaskSuccess)
  return (
    <button type="button" onClick={() => done?.()}>
      Confirm saved
    </button>
  )
}

describe('TaskDialog', () => {
  const mountTask = () =>
    render(
      <TaskDialog trigger="Add thing" title="Add thing" successNotice="Thing added.">
        <input aria-label="Name" />
        <Confirm />
      </TaskDialog>,
    )

  it('keeps plain children mounted but out of sight until the button is used', () => {
    mountTask()
    expect(screen.getByLabelText('Name')).not.toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add thing' }))
    expect(screen.getByLabelText('Name')).toBeVisible()
    expect(screen.queryByText('Thing added.')).toBeNull()
  })

  it('closes and says what happened only when the form reports a confirmed success', () => {
    mountTask()
    fireEvent.click(screen.getByRole('button', { name: 'Add thing' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByText('Thing added.')).toBeNull() // closing alone is never a success
    fireEvent.click(screen.getByRole('button', { name: 'Add thing' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm saved' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(screen.getByText('Thing added.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add thing' }))
    expect(screen.queryByText('Thing added.')).toBeNull() // a new task starts without the old notice
  })
})
