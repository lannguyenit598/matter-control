import '@testing-library/jest-dom/vitest'

import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// connection() exists only inside a Next request scope, which a unit test does not have. Mocking this
// tiny wrapper (not next/server) keeps the heavy Next server module out of every test that reads a session.
vi.mock('@/lib/request-time', () => ({ awaitRequest: async () => {} }))

// Whole-suite runs share CPU with many jsdom workers; the default 1s async budget is too tight.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => cleanup())

// jsdom does not implement modal <dialog>. Minimal stand-in so components can open/close;
// real focus trapping and Escape handling are covered by the Playwright tests.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
