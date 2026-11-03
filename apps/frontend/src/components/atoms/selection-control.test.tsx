import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SelectionControl } from './selection-control'

describe('selection controls', () => {
  it('keeps label/Space activation and native form values', async () => {
    const user = userEvent.setup()
    render(
      <form aria-label="Evidence">
        <label>
          <SelectionControl name="claims" value="a" />
          Accept proof
        </label>
      </form>,
    )
    const input = screen.getByRole('checkbox', { name: 'Accept proof' })
    await user.click(screen.getByText('Accept proof'))
    expect(input).toBeChecked()
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('claims')).toEqual([
      'a',
    ])
    input.focus()
    await user.keyboard(' ')
    expect(input).not.toBeChecked()
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).has('claims')).toBe(false)
  })

  it('keeps disabled controls and native radio exclusivity', async () => {
    const user = userEvent.setup()
    render(
      <>
        <label>
          <SelectionControl disabled />
          Unavailable
        </label>
        <label>
          <SelectionControl type="radio" name="person" value="a" />
          Alex
        </label>
        <label>
          <SelectionControl type="radio" name="person" value="b" />
          Bao
        </label>
      </>,
    )
    await user.click(screen.getByText('Unavailable'))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    await user.click(screen.getByText('Alex'))
    await user.click(screen.getByText('Bao'))
    expect(screen.getByRole('radio', { name: 'Alex' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Bao' })).toBeChecked()
  })

  it('preserves controlled state and indeterminate through the input ref', () => {
    render(
      <SelectionControl
        aria-label="All"
        checked={false}
        onChange={() => {}}
        ref={(node) => {
          if (node) node.indeterminate = true
        }}
      />,
    )
    const input = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement
    expect(input.indeterminate).toBe(true)
    fireEvent.click(input)
    expect(input).not.toBeChecked()
  })
})
