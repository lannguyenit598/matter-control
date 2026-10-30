'use client'

import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { useLocale } from '@/hooks/use-locale'
import { toggleTheme } from '@/lib/theme'

/** Icons swap via CSS (dark: variant), so server and client render identical markup. */
export function ThemeToggle() {
  const locale = useLocale()
  const label = locale === 'vi' ? 'Đổi giao diện sáng/tối' : 'Toggle color theme'
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={toggleTheme}>
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
    </Button>
  )
}
