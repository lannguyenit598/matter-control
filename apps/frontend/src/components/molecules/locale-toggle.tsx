'use client'

import { useTimeZone, setUiTimeZone } from '@/hooks/use-time-zone'

import { Select } from '@/components/atoms/select'
import { setUiLocale, useLocale } from '@/hooks/use-locale'

export function LocaleToggle() {
  const locale = useLocale()
  const zone = useTimeZone()
  return (
    <>
      <Select
        aria-label={locale === 'vi' ? 'Ngôn ngữ giao diện' : 'Interface language'}
        value={locale}
        onChange={(event) => setUiLocale(event.target.value === 'vi' ? 'vi' : 'en')}
        options={[
          { value: 'en', label: 'English' },
          { value: 'vi', label: 'Tiếng Việt' },
        ]}
      />
      <Select
        aria-label={locale === 'vi' ? 'Múi giờ hiển thị' : 'Display time zone'}
        value={zone}
        onChange={(event) =>
          setUiTimeZone(event.target.value === 'Asia/Ho_Chi_Minh' ? 'Asia/Ho_Chi_Minh' : 'UTC')
        }
        options={[
          { value: 'UTC', label: 'UTC' },
          { value: 'Asia/Ho_Chi_Minh', label: 'UTC+07:00' },
        ]}
      />
    </>
  )
}
