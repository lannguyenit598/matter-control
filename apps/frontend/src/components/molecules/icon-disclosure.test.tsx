import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IconDisclosure } from './icon-disclosure'

describe('IconDisclosure', () => {
  it('is an icon button named and titled by its words, closed by default', () => {
    render(
      <IconDisclosure icon={<svg data-testid="icon" />} label={{ en: 'Edit TMA', vi: 'Sửa TMA' }}>
        <input aria-label="Name" />
      </IconDisclosure>,
    )
    const summary = screen.getByLabelText('Edit TMA')
    expect(summary).toHaveAttribute('title', 'Edit TMA')
    expect(summary.tagName).toBe('SUMMARY')
    expect(summary).not.toHaveTextContent('Edit') // icon only: no sentence to underline
    expect(summary.closest('details')).not.toHaveAttribute('open')
  })

  it('keeps its form mounted while closed so a draft survives, and opens on click', () => {
    render(
      <IconDisclosure icon={<svg />} label="Withdraw">
        <input aria-label="Reason" defaultValue="draft" />
      </IconDisclosure>,
    )
    expect(screen.getByLabelText('Reason', { selector: 'input' })).toHaveValue('draft')
    const details = screen.getByLabelText('Withdraw').closest('details')!
    fireEvent.click(screen.getByLabelText('Withdraw'))
    details.open = true
    expect(details).toHaveAttribute('open')
  })

  it('can start open (the verifier’s review form)', () => {
    render(
      <IconDisclosure open icon={<svg />} label="Review">
        <p>form</p>
      </IconDisclosure>,
    )
    expect(screen.getByLabelText('Review').closest('details')).toHaveAttribute('open')
  })
})
