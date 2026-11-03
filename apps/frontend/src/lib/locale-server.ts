import { cookies } from 'next/headers'

import type { UiLocale } from '@/lib/locale'

export const UI_LOCALE_COOKIE = 'ui-locale'

/**
 * D-2 (UX-L-02): the interface locale is server-readable through the `ui-locale` cookie that
 * LocaleToggle writes. The root layout awaits this, so the server HTML carries the right language
 * and `lang` at t=0 — the old server was structurally stuck on EN.
 */
export async function uiLocale(): Promise<UiLocale> {
  return (await cookies()).get(UI_LOCALE_COOKIE)?.value === 'vi' ? 'vi' : 'en'
}
