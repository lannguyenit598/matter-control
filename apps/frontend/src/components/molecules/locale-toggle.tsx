'use client'

import { Languages } from 'lucide-react'

import { Select } from '@/components/atoms/select'
import { setUiLocale, useLocale } from '@/hooks/use-locale'

export function LocaleToggle() {
  const locale = useLocale()
  return (
    <Select
      leadingIcon={<Languages />}
      aria-label={locale === 'vi' ? 'Ngôn ngữ giao diện' : 'Interface language'}
      value={locale}
      onChange={(event) => setUiLocale(event.target.value === 'vi' ? 'vi' : 'en')}
      options={[
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Tiếng Việt' },
      ]}
    />
  )
}
