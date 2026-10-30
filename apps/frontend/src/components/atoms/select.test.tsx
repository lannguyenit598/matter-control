import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

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
