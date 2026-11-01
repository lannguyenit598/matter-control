'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'

import type { UiLocale } from '@/lib/locale'

const KEY = 'ui-locale'
const CHANGE = 'ui-locale-change'

/**
 * D-2 (UX-L-02): the interface locale is server-readable through the `ui-locale` cookie, so the
 * server renders the right language at t=0 and `document.lang` matches the copy. The provider
 * (components/molecules/locale-provider.tsx) seeds React from that server value, which makes the
 * hydrated tree agree with the server render — no flip. Without a provider (global-error renders
 * outside every layout; bare unit-test trees) the hook falls back to the client store below.
 */
export const UiLocaleContext = createContext<UiLocale | null>(null)

function readStore(): UiLocale {
  try {
    return localStorage.getItem(KEY) === 'vi' ? 'vi' : 'en'
  } catch {
    // skip: blocked storage falls back to the document's current interface language
    return document.documentElement.lang === 'vi' ? 'vi' : 'en'
  }
}

function subscribeStore(update: () => void) {
  const sync = () => {
    document.documentElement.lang = readStore()
    update()
  }
  sync()
  window.addEventListener(CHANGE, sync)
  window.addEventListener('storage', sync)
  return () => {
    window.removeEventListener(CHANGE, sync)
    window.removeEventListener('storage', sync)
  }
}

const EN: UiLocale = 'en'

/** Preference changes preserve mounted forms and drafts; there is no navigation or reload. */
export function useLocale(): UiLocale {
  const provided = useContext(UiLocaleContext)
  const stored = useSyncExternalStore(subscribeStore, readStore, () => EN)
  return provided ?? stored
}

export function setUiLocale(locale: UiLocale) {
  document.documentElement.lang = locale
  try {
    localStorage.setItem(KEY, locale)
  } catch {
    // skip: interface language remains usable in this tab when storage is blocked
  }
  // D-2: the cookie makes the preference server-readable, so the next server render (navigation
  // or RSC refresh) renders this locale at t=0 instead of the old stuck-EN server output.
  document.cookie = `ui-locale=${locale}; path=/; max-age=31536000; samesite=lax`
  window.dispatchEvent(new Event(CHANGE))
}

/** A shared read for the provider's mount sync: mirror first, then the cookie it is a mirror of. */
export function readStoredLocale(): UiLocale {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'vi' || stored === 'en') return stored
  } catch {
    // skip: fall through to the cookie
  }
  const match = document.cookie.match(/(?:^|;\s*)ui-locale=(vi|en)(?:;|$)/)
  return match?.[1] === 'vi' ? 'vi' : 'en'
}
