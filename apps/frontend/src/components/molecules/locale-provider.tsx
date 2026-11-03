'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'

import { UiLocaleContext } from '@/hooks/use-locale'
import type { UiLocale } from '@/lib/locale'

function subscribeMirror(update: () => void) {
  window.addEventListener('ui-locale-change', update)
  window.addEventListener('storage', update)
  return () => {
    window.removeEventListener('ui-locale-change', update)
    window.removeEventListener('storage', update)
  }
}

function readMirror(): UiLocale | null {
  try {
    const stored = localStorage.getItem('ui-locale')
    return stored === 'vi' || stored === 'en' ? stored : null
  } catch {
    return null // blocked storage keeps the server-seeded locale
  }
}

/**
 * Seeds the interface locale from the server render (D-2): the root layout reads the `ui-locale`
 * cookie and passes it here, so the hydrated tree agrees with the server render — the language is
 * right at t=0 and `document.lang` matches the copy. The localStorage mirror is tracked through
 * the external store (never an effect setState), so an explicit client-side preference — made
 * before hydration or by another tab — overrides the seed after hydration; an absent mirror never
 * stomps it. Preference changes preserve mounted forms and drafts (no navigation, no reload).
 */
export function LocaleProvider({ initial, children }: { initial: UiLocale; children: ReactNode }) {
  const [seed] = useState(initial)
  const mirror = useSyncExternalStore(subscribeMirror, readMirror, () => null)
  const locale = mirror ?? seed
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return <UiLocaleContext.Provider value={locale}>{children}</UiLocaleContext.Provider>
}
