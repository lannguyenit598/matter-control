import type { Metadata } from 'next'

import { uiLocale } from '@/lib/locale-server'

/**
 * W5 (P-08): tab titles follow the same D-2 cookie-locale mechanism as page content —
 * generateMetadata reads the `ui-locale` cookie server-side, so the title ships in the right
 * language at t=0 with no client flip. Vi strings reuse the page's own shipped label
 * (H1 / matter-tabs VI map), so the tab title never contradicts what is on screen.
 */
export function pageMetadata(en: string, vi: string) {
  return async (): Promise<Metadata> => ({ title: await localizedTitle(en, vi) })
}

export async function localizedTitle(en: string, vi: string): Promise<string> {
  return (await uiLocale()) === 'vi' ? vi : en
}
