'use client'

import type { ComponentProps } from 'react'

import { useLocale } from '@/hooks/use-locale'
import { useTimeZone } from '@/hooks/use-time-zone'
import { formatUiInstant } from '@/lib/locale'

/** Render the same legal instant in the selected display zone; preserve its original dateTime. */
export function LocalizedInstant({
  iso,
  ...props
}: Omit<ComponentProps<'time'>, 'children' | 'dateTime'> & { iso: string }) {
  const locale = useLocale(),
    zone = useTimeZone()
  const date = new Date(iso)
  const text =
    locale === 'en' && zone === 'UTC' && !Number.isNaN(date.getTime())
      ? `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
      : formatUiInstant(iso, locale, zone)
  return (
    <time {...props} dateTime={iso}>
      {text}
    </time>
  )
}
