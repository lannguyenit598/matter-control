'use client'

import { useSyncExternalStore } from 'react'

function read(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!zone) return 'UTC'
    new Intl.DateTimeFormat('en', { timeZone: zone }).format(0)
    return zone
  } catch {
    // UTC is the display fallback when the client cannot report a valid zone.
    return 'UTC'
  }
}

function subscribe(update: () => void) {
  window.addEventListener('focus', update)
  return () => window.removeEventListener('focus', update)
}

/** Device display zone only: never changes saved instants, form offsets or command keys. */
export function useTimeZone(): string {
  return useSyncExternalStore(subscribe, read, () => 'UTC')
}
