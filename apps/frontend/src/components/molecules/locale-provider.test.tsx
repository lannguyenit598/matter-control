import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setUiLocale } from '@/hooks/use-locale'
import { LocalizedText } from './localized-text'

import { LocaleProvider } from './locale-provider'

function Probe() {
  return <LocalizedText en="Hello" vi="Xin chào" />
}

afterEach(() => {
  act(() => setUiLocale('en'))
})

// D-2 (UX-L-02): the interface language is server-readable and hydration-stable.
describe('LocaleProvider', () => {
  it('renders the server locale at t=0 and document.lang matches the copy', () => {
    render(
      <LocaleProvider initial="vi">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    expect(document.documentElement.lang).toBe('vi')
  })

  it('switches live, keeps document.lang in lockstep and writes the server-readable cookie', () => {
    render(
      <LocaleProvider initial="en">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
    act(() => setUiLocale('vi'))
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('vi')
    expect(document.cookie).toContain('ui-locale=vi')
    act(() => setUiLocale('en'))
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(document.cookie).toContain('ui-locale=en')
  })

  it('the mirror wins after hydration when it differs from the server seed', () => {
    act(() => setUiLocale('vi'))
    render(
      <LocaleProvider initial="en">
        <Probe />
      </LocaleProvider>,
    )
    expect(screen.getByText('Xin chào')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('vi')
  })
})
