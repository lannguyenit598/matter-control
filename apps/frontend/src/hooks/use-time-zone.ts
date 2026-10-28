'use client'

import { useSyncExternalStore } from 'react'

export const UI_TIME_ZONES = ['UTC', 'Asia/Ho_Chi_Minh'] as const
export type UiTimeZone = (typeof UI_TIME_ZONES)[number]
const KEY = 'ui-time-zone'
const CHANGE = 'ui-time-zone-change'
let fallback: UiTimeZone = 'UTC'

function read(): UiTimeZone {
  try {
    return localStorage.getItem(KEY) === 'Asia/Ho_Chi_Minh' ? 'Asia/Ho_Chi_Minh' : 'UTC'
  } catch {
    return fallback
  }
}
function subscribe(update: () => void) {
  window.addEventListener(CHANGE, update)
  window.addEventListener('storage', update)
  return () => {
    window.removeEventListener(CHANGE, update)
    window.removeEventListener('storage', update)
  }
}
export function setUiTimeZone(zone: UiTimeZone) {
  fallback = zone
  try {
    localStorage.setItem(KEY, zone)
  } catch {
    /* Preference still works in this tab. */
  }
  window.dispatchEvent(new Event(CHANGE))
}
/** Display preference only: never changes form values, wire timestamps, scope or command keys. */
export function useTimeZone(): UiTimeZone {
  return useSyncExternalStore(subscribe, read, () => 'UTC')
}
