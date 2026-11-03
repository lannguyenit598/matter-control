'use client'

import { useLocale } from '@/hooks/use-locale'

/** Only supplied UI copy is localized. User-authored legal content passes through untouched. */
export function LocalizedText({ en, vi }: { en: string; vi: string }) {
  return useLocale() === 'vi' ? vi : en
}
