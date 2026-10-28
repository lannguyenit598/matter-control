'use client'

import { useSyncExternalStore } from 'react'

import type { UiLocale } from '@/lib/locale'

const KEY = 'ui-locale'
const CHANGE = 'ui-locale-change'

function read(): UiLocale {
  try {
    return localStorage.getItem(KEY) === 'vi' ? 'vi' : 'en'
  } catch {
    // skip: blocked storage falls back to the document's current interface language
    return document.documentElement.lang === 'vi' ? 'vi' : 'en'
  }
}

function subscribe(update: () => void) {
  const sync = () => {
    document.documentElement.lang = read()
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

export function setUiLocale(locale: UiLocale) {
  document.documentElement.lang = locale
  try {
    localStorage.setItem(KEY, locale)
  } catch {
    // skip: interface language remains usable in this tab when storage is blocked
  }
  window.dispatchEvent(new Event(CHANGE))
}

/** Preference changes preserve mounted forms and drafts; there is no navigation or reload. */
export function useLocale(): UiLocale {
  return useSyncExternalStore(subscribe, read, () => 'en')
}
