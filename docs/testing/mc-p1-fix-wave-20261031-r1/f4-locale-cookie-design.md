# F4 design note — server-readable locale cookie (D-2, RATIFIED 2026-10-31) — UX-L-02

One page, as scoped by the fix wave. Finding: `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` UX-L-02.

## Root cause

Interface locale lived only in `localStorage`, read by a client hook whose server snapshot was
hardcoded `'en'`, and `<html lang="en">` was hardcoded in the root layout. Every server render —
RSC payloads and the SSR pass of client components — therefore baked EN copy; in vi mode the text
flipped after hydration (or never for server components), and `document.lang` said `en` while the
text said vi (WCAG 3.1.2). The server was structurally unable to render vi.

## Design (D-2)

1. **Cookie `ui-locale` is the server-readable source of truth.** `lib/locale-server.ts` reads it
   with `cookies()` (async, RSC-safe): `uiLocale(): Promise<UiLocale>`. The root layout awaits it
   and renders `<html lang={locale}>`, so the very first byte carries the right language.
2. **`LocaleProvider` (client) seeds React from the server value.** The RSC payload serializes the
   provider's `initial` prop, so the hydrated client tree renders the same locale the server did —
   **no hydration flip**. `localStorage` stays a mirror: `setUiLocale` writes
   document.lang + localStorage + cookie (`path=/; max-age=31536000; samesite=lax`) and notifies
   the provider (in-tab) and `storage` listeners (cross-tab). On mount the provider re-reads the
   mirror once, so a client-side preference made before hydration wins.
3. **`useLocale()` dual mode.** Under a provider it returns the context value (hydration-stable).
   Without one — `app/global-error.tsx` renders outside every layout, and unit tests mount bare
   trees — it falls back to the previous client store (`useSyncExternalStore` over localStorage),
   preserving today's behaviour exactly where the server render does not exist.
4. **Mounted forms preserved:** switching language updates context state in place; no navigation,
   no reload, drafts untouched (same contract as before, verified by the existing toggle tests).

## Cache Components impact (the 1-page trade-off)

The root layout now reads a cookie, so the HTML shell is dynamic per request. With
`cacheComponents: true` (node build) no page loses staticness it had: every page already calls
`connection()` for request-time reads, so none was prerendering around the shell anyway. The cost
is a per-request root render; the benefit is t=0 correct language and `lang`. The worker build
(`cacheComponents: false`) is unaffected. Verified on the prod build probe (22-route timeline,
F7 gate), not by this note alone.

## Acceptance (probe recipe: uiux namespace 00-worklog.md, rerun on prod build)

- H1 vi ngay t=0 (server HTML, before JS) trên prod build.
- 0 màn kẹt EN sau khi đổi ngôn ngữ + điều hướng.
- `document.documentElement.lang` khớp nội dung hiển thị trên mọi route.
