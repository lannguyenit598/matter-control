import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OutcomeVerificationBadge } from './outcome-verification'

describe('OutcomeVerificationBadge (BF-01)', () => {
  it('says the outcome is not verified when no outcome criterion exists, even if the package reads verified', () => {
    render(<OutcomeVerificationBadge state="NOT_DECLARED" />)
    expect(
      screen.getByText(/Outcome not verified: no outcome criterion is declared/),
    ).toBeInTheDocument()
  })
  it('says it is pending until an independent verifier accepts, and verified only when accepted', () => {
    const { rerender } = render(<OutcomeVerificationBadge state="PENDING" />)
    expect(screen.getByText(/waiting for an independent verifier/)).toBeInTheDocument()
    rerender(<OutcomeVerificationBadge state="ACCEPTED" />)
    expect(screen.getByText('Outcome verified')).toBeInTheDocument()
  })
  it('shows nothing for a filing without outcome verification or an unknown answer', () => {
    const { container, rerender } = render(<OutcomeVerificationBadge state="NOT_TRACKED" />)
    expect(container).toBeEmptyDOMElement()
    rerender(<OutcomeVerificationBadge state={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
