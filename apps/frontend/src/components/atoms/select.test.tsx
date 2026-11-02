import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { Select } from './select'

const people = [
  { value: 'person-a', label: 'Alex Nguyen' },
  { value: 'person-b', label: 'Bao Tran', disabled: true },
]

it('submits the internal value while showing a recognizable name and restores the default on reset', () => {
  const { container } = render(
    <form>
      <label htmlFor="person">Person</label>
      <Select
        id="person"
        leadingIcon={
          <svg aria-hidden>
            <path d="M0 0h1" />
          </svg>
        }
        name="personId"
        defaultValue=""
        placeholder="Select a person…"
        options={people}
      />
    </form>,
  )
  const control = screen.getByRole('combobox', { name: 'Person' })
  fireEvent.change(control, { target: { value: 'person-a' } })
  expect(new FormData(container.querySelector('form')!).get('personId')).toBe('person-a')
  expect(screen.getByRole('option', { name: 'Alex Nguyen' })).toBeInTheDocument()
  container.querySelector('form')!.reset()
  expect(control).toHaveValue('')
  expect(screen.getByRole('option', { name: 'Bao Tran' })).toBeDisabled()
})

it('preserves controlled change events and empty values used to clear a field or filter', () => {
  const change = vi.fn()
  const { rerender } = render(
    <Select
      aria-label="Owner"
      name="ownerId"
      value="person-a"
      onChange={change}
      placeholder="Unassigned"
      options={people}
    />,
  )
  fireEvent.change(screen.getByRole('combobox', { name: 'Owner' }), { target: { value: '' } })
  expect(change).toHaveBeenCalledOnce()
  rerender(
    <Select
      aria-label="Owner"
      name="ownerId"
      value=""
      onChange={change}
      placeholder="Unassigned"
      options={people}
    />,
  )
  expect(screen.getByRole('combobox', { name: 'Owner' })).toHaveValue('')
})

it('preserves disabled and validation semantics without a second hidden control', () => {
  const { container } = render(
    <form>
      <Select
        name="personId"
        aria-label="Person"
        aria-invalid="true"
        aria-describedby="problem"
        disabled
        defaultValue="person-a"
        options={people}
      />
      <p id="problem">Access ended</p>
    </form>,
  )
  const control = screen.getByRole('combobox', { name: 'Person' })
  expect(control).toBeDisabled()
  expect(control).toHaveAttribute('aria-invalid', 'true')
  expect(control).toHaveAccessibleDescription('Access ended')
  expect(new FormData(container.querySelector('form')!).has('personId')).toBe(false)
  expect(container.querySelectorAll('[name="personId"]')).toHaveLength(1)
})

beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.style.display = 'block'
  })
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.style.display = 'none'
  })
})
afterEach(() => vi.restoreAllMocks())

it('opens a themed list and choosing an option emits a real select change without submitting the form', () => {
  const change = vi.fn()
  const submit = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
  const { container } = render(
    <form onSubmit={submit}>
      <label htmlFor="kind">Kind</label>
      <Select
        id="kind"
        name="kind"
        defaultValue=""
        placeholder="Any"
        onChange={change}
        options={people}
      />
    </form>,
  )
  const control = screen.getByRole('combobox', { name: 'Kind' })
  fireEvent.pointerDown(control, { button: 0 })
  fireEvent.click(control)
  expect(screen.getByRole('listbox', { name: 'Kind' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Bao Tran' })).toBeDisabled()
  fireEvent.click(screen.getByRole('option', { name: 'Alex Nguyen' }))
  expect(change).toHaveBeenCalledOnce()
  expect(change.mock.calls[0]![0].target).toBe(control)
  expect(new FormData(container.querySelector('form')!).get('kind')).toBe('person-a')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(submit).not.toHaveBeenCalled()
})

it('uses keyboard selection, skips disabled choices and Escape preserves the previously committed value', () => {
  render(<Select aria-label="Person" defaultValue="" placeholder="Any" options={people} />)
  const control = screen.getByRole('combobox', { name: 'Person' })
  control.focus()
  fireEvent.keyDown(control, { key: 'ArrowDown' })
  fireEvent.keyDown(control, { key: 'End' })
  fireEvent.keyDown(control, { key: 'Enter' })
  expect(control).toHaveValue('person-a')
  fireEvent.keyDown(control, { key: 'ArrowDown' })
  fireEvent.keyDown(control, { key: 'Home' })
  fireEvent.keyDown(control, { key: 'Escape' })
  expect(control).toHaveValue('person-a')
  expect(control).toHaveFocus()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('never opens an enhanced popup for a disabled field', () => {
  render(<Select aria-label="Person" disabled options={people} />)
  fireEvent.pointerDown(screen.getByRole('combobox'), { button: 0 })
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(HTMLElement.prototype.showPopover).not.toHaveBeenCalled()
})

it('opens from an associated label and supports Vietnamese typeahead without committing until Enter', () => {
  render(
    <>
      <label htmlFor="label-select">Loại</label>
      <Select
        id="label-select"
        defaultValue=""
        placeholder="Bất kỳ"
        options={[
          { value: 'req', label: 'Yêu cầu' },
          { value: 'action', label: 'Hành động' },
        ]}
      />
    </>,
  )
  const control = screen.getByRole('combobox', { name: 'Loại' })
  fireEvent.click(screen.getByText('Loại', { selector: 'label' }))
  expect(screen.getByRole('listbox', { name: 'Loại' })).toBeInTheDocument()
  fireEvent.keyDown(control, { key: 'h' })
  expect(control).toHaveValue('')
  fireEvent.keyDown(control, { key: 'Enter' })
  expect(control).toHaveValue('action')
})

it('names a popup from a wrapping label without reading every option into its accessible name', () => {
  render(
    <label>
      Duration
      <Select
        defaultValue="25"
        options={[
          { value: '15', label: '15 min' },
          { value: '25', label: '25 min' },
        ]}
      />
    </label>,
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Duration' }))
  expect(screen.getByRole('listbox', { name: 'Duration' })).toBeInTheDocument()
  expect(screen.getByRole('combobox')).toHaveAccessibleName('Duration')
  expect(screen.getByRole('listbox').closest('label')).toBeNull()
})
