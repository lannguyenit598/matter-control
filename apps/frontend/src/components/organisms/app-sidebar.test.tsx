import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/my-actions' }))

import { LocaleProvider } from '@/components/molecules/locale-provider'
import { LocaleToggle } from '@/components/molecules/locale-toggle'
import { LocalizedText } from '@/components/molecules/localized-text'
import type { UiLocale } from '@/lib/locale'

import { AppSidebar } from './app-sidebar'

beforeEach(() => localStorage.removeItem('ui-locale'))
afterEach(() => {
  localStorage.removeItem('ui-locale')
  document.documentElement.lang = 'en'
  document.cookie = 'ui-locale=; path=/; max-age=0'
})

describe('AppSidebar', () => {
  it.each<UiLocale>(['vi', 'en'])(
    'updates the landmark live from %s without remounting controls',
    (initial) => {
      render(
        <LocaleProvider initial={initial}>
          <AppSidebar
            brand="MatterControl"
            items={[
              {
                href: '/my-actions',
                label: <LocalizedText en="My Work" vi="Việc của tôi" />,
              },
            ]}
            footer={
              <>
                <LocaleToggle />
                <input aria-label="Unsaved draft" defaultValue="Keep this draft" />
              </>
            }
          />
        </LocaleProvider>,
      )
      const nav = screen.getByRole('navigation')
      const draft = screen.getByRole('textbox', { name: 'Unsaved draft' })
      for (const locale of [initial, initial === 'vi' ? 'en' : 'vi', initial]) {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: locale } })
        expect(nav).toHaveAccessibleName(
          locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation',
        )
        expect(
          within(nav).getByRole('link', { name: locale === 'vi' ? 'Việc của tôi' : 'My Work' }),
        ).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('textbox', { name: 'Unsaved draft' })).toBe(draft)
        expect(draft).toHaveValue('Keep this draft')
      }
    },
  )
})
