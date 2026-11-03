import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LocaleProvider } from '@/components/molecules/locale-provider'

import { ReadFailure } from './read-failure'

// UX-L-04: every ReadFailure string is localized; UX-L-05: the failure keeps the page's h1.
describe('ReadFailure context variant', () => {
  it('renders the heading as the page h1 above the failure state', () => {
    render(<ReadFailure kind="unavailable" retryHref="/x" heading={<span>Merger filing</span>} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Merger filing')
  })

  it('localizes the not-found title with the subject, including in Vietnamese', () => {
    render(
      <LocaleProvider initial="vi">
        <ReadFailure kind="not-found" subject="matter" />
      </LocaleProvider>,
    )
    expect(screen.getByText('hồ sơ này không khả dụng')).toBeInTheDocument()
  })

  it('localizes the unavailable description (was EN-only, UX-L-04)', () => {
    render(
      <LocaleProvider initial="vi">
        <ReadFailure kind="unavailable" />
      </LocaleProvider>,
    )
    expect(
      screen.getByText(/Chưa kết nối được dịch vụ\. Phiên của bạn không bị ảnh hưởng/),
    ).toBeInTheDocument()
  })
})
