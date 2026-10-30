import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LocaleToggle } from '@/components/molecules/locale-toggle'
import { LocalizedInstant } from '@/components/molecules/localized-instant'

const instant = '2026-10-28T09:15:00Z'
const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
let deviceZone = 'America/New_York'

beforeEach(() => {
  localStorage.clear()
  deviceZone = 'America/New_York'
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...resolvedOptions.call(this), timeZone: deviceZone }
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

function view() {
  render(
    <>
      <LocaleToggle />
      <LocalizedInstant iso={instant} data-testid="instant" />
    </>,
  )
}

describe('client display time zone', () => {
  it('defaults to the detected IANA zone, not the server clock or a fixed +07 offset', () => {
    view()
    expect(screen.queryByRole('combobox', { name: 'Display time zone' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Interface language' })).toBeInTheDocument()
    expect(screen.getByTestId('instant')).toHaveTextContent('05:15')
    expect(screen.getByTestId('instant')).toHaveAttribute('dateTime', instant)
    expect(localStorage.getItem('ui-time-zone')).toBeNull()
  })

  it('ignores a legacy manual UTC preference and uses the device zone', () => {
    localStorage.setItem('ui-time-zone', 'UTC')
    view()
    expect(screen.getByTestId('instant')).toHaveTextContent('05:15')
  })

  it('uses the detected zone rules for each instant, including daylight saving', () => {
    render(
      <>
        <LocalizedInstant iso="2026-01-15T09:15:00Z" data-testid="winter" />
        <LocalizedInstant iso="2026-07-15T09:15:00Z" data-testid="summer" />
      </>,
    )
    expect(screen.getByTestId('winter')).toHaveTextContent('04:15')
    expect(screen.getByTestId('summer')).toHaveTextContent('05:15')
  })

  it('re-detects a changed device zone on focus without changing the stored instant', () => {
    view()
    act(() => {
      deviceZone = 'Asia/Tokyo'
      window.dispatchEvent(new Event('focus'))
    })
    expect(screen.getByTestId('instant')).toHaveTextContent('18:15')
    expect(screen.getByTestId('instant')).toHaveAttribute('dateTime', instant)
  })

  it('ignores invalid stored zones and falls back to UTC if detection is invalid too', () => {
    localStorage.setItem('ui-time-zone', 'invalid/time-zone')
    deviceZone = 'invalid/time-zone'
    view()
    expect(screen.getByTestId('instant')).toHaveTextContent('09:15')
  })

  it('detects the device zone without reading or writing preference storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    view()
    expect(screen.getByTestId('instant')).toHaveTextContent('05:15')
  })
})
