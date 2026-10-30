import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setUiLocale } from '@/hooks/use-locale'
import { Select } from '@/components/atoms/select'

import { LocalizedInstant } from './localized-instant'
import { LocalizedText } from './localized-text'
import { LocaleToggle } from './locale-toggle'
import { ThemeToggle } from './theme-toggle'

const iso = '2026-10-28T09:15:00Z'
const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
let deviceZone = 'UTC'
beforeEach(() => {
  deviceZone = 'UTC'
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...resolvedOptions.call(this), timeZone: deviceZone }
  })
})
afterEach(() => {
  act(() => {
    setUiLocale('en')
  })
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('localized display without mutation of legal intent', () => {
  it('switches labels and display zone without resetting mounted drafts or changing the original instant', () => {
    render(
      <>
        <LocaleToggle />
        <ThemeToggle />
        <label>
          <LocalizedText en="Title" vi="Tiêu đề" />
          <input defaultValue="Legal content: Completed but Unverified" />
        </label>
        <LocalizedInstant iso={iso} data-testid="instant" />
      </>,
    )
    const input = screen.getByRole('textbox')
    expect(screen.getByRole('button', { name: 'Toggle color theme' })).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'Unsaved legal clause / điều khoản gốc' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Interface language' }), {
      target: { value: 'vi' },
    })
    expect(screen.getByRole('textbox', { name: 'Tiêu đề' })).toBe(input)
    expect(screen.getByRole('button', { name: 'Đổi giao diện sáng/tối' })).toHaveAttribute(
      'title',
      'Đổi giao diện sáng/tối',
    )
    expect(input).toHaveValue('Unsaved legal clause / điều khoản gốc')
    act(() => {
      deviceZone = 'Asia/Ho_Chi_Minh'
      window.dispatchEvent(new Event('focus'))
    })
    expect(screen.getByTestId('instant')).toHaveAttribute('dateTime', iso)
    expect(screen.getByTestId('instant')).toHaveTextContent('16:15')
    expect(screen.getByTestId('instant')).toHaveTextContent(/GMT\+7|UTC\+7/)
    act(() => {
      deviceZone = 'UTC'
      window.dispatchEvent(new Event('focus'))
    })
    expect(screen.getByTestId('instant')).toHaveTextContent('09:15')
    expect(screen.getByTestId('instant')).toHaveAttribute('dateTime', iso)
    expect(input).toHaveValue('Unsaved legal clause / điều khoản gốc')
  })
  it('does not translate user content merely because it matches an interface label', () => {
    render(
      <>
        <LocalizedText en="Completed" vi="Đã hoàn tất" />
        <p>Completed</p>
      </>,
    )
    act(() => setUiLocale('vi'))
    expect(screen.getByText('Đã hoàn tất')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
  it('changes option labels without changing their submitted state IDs or selection', () => {
    render(
      <Select
        aria-label="Execution state"
        defaultValue="COMPLETED"
        options={[
          { value: 'COMPLETED', label: <LocalizedText en="Completed" vi="Đã hoàn tất" /> },
          { value: 'WAITING', label: <LocalizedText en="Waiting" vi="Đang chờ" /> },
        ]}
      />,
    )
    act(() => setUiLocale('vi'))
    expect(screen.getByRole('option', { name: 'Đã hoàn tất' })).toHaveAttribute(
      'value',
      'COMPLETED',
    )
    expect(screen.getByRole('combobox', { name: 'Execution state' })).toHaveValue('COMPLETED')
  })
})
