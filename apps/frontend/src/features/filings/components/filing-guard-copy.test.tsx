import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FilingGuardCopy } from './filing-forms'
import type { McRejection } from '@/lib/mc/errors'

const rejection = (code: string, message: string): McRejection => ({
  code,
  message,
  alternatives: [],
  gates: [],
  path: [],
})

// OV-F1-04a (fix-wave #2 G6): the D-9 guard refusal speaks in the OpenDesign guard copy — one
// message, no codes, both gaps named when both are violated.
describe('FilingGuardCopy', () => {
  it('renders the combined copy when package and signature are both missing', () => {
    render(
      <FilingGuardCopy
        rejection={rejection(
          'guard-failed',
          'package criteria are not satisfied: Package complete (MISSING); signature criteria are not declared: add a SIGNATURE-purpose criterion',
        )}
      />,
    )
    expect(
      screen.getByText(
        'Cannot submit — this filing requires supporting evidence and a valid signature. Please attach the required documents and correct signature type.',
      ),
    ).toBeInTheDocument()
  })

  it('renders the signature copy for a standalone missing signature criterion', () => {
    render(
      <FilingGuardCopy
        rejection={rejection(
          'signature-criteria-required',
          "declare a SIGNATURE criterion for the filing's signatures; a package criterion does not prove them",
        )}
      />,
    )
    expect(
      screen.getByText(
        'Cannot submit — this filing requires a valid signature. The attached evidence is not a signature. Please attach the correct signature type.',
      ),
    ).toBeInTheDocument()
  })

  it('renders the evidence copy when only the package is unmet', () => {
    render(
      <FilingGuardCopy
        rejection={rejection(
          'guard-failed',
          'package criteria are not satisfied: Package complete (MISSING)',
        )}
      />,
    )
    expect(
      screen.getByText(
        'Cannot submit — this filing requires supporting evidence. Please attach at least one document before submitting.',
      ),
    ).toBeInTheDocument()
  })

  it('renders nothing for refusals the guard copy does not cover', () => {
    const { container } = render(
      <FilingGuardCopy
        rejection={rejection('transition-not-allowed', 'a filing cannot move from X to Y')}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
