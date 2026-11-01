# Findings state update — MC-ZCODE-P1-FIX-WAVE-20261031-r1

Writer: actual ZCode (fix-wave executor). Date: 2026-10-31 → 2026-11-01 (session local 23:47+07 → 01:45+07). Base commit 0de3e5d → baseline commit **4b6a65f** (DEC-20261031-01) → coordinator docs commit 5e932bd during the wave. All fixes are uncommitted working-tree deltas against 5e932bd, one durable patch per fix-unit in this namespace.

> Register states below are **FIXED_PENDING_VERIFY** — never CLOSED_VERIFIED; independent verification is OpenCode's (verify-wave CO-13/14) on the re-pinned bytes.

| ID | Old state | New state | Evidence |
|---|---|---|---|
| Z-F-01 | OPEN | **FIXED_PENDING_VERIFY** | f1-zf01-zf02.patch: package gate counts PACKAGE-purpose criteria only (filing.go), submission refuses an undeclared package for proof-required filings; red tests `TestPackagePreparationRejectsAnOutcomeOnlyCriteriaSet`, `TestSubmissionNeverReadsAMissingPackageAsReady` (r2 filing F repro) green after fix; migration 0011 reversible; make check exit 0 (PG+race, 14 pk). |
| Z-F-02 | OPEN | **FIXED_PENDING_VERIFY** | same patch: `PurposeSignature` added (Valid/EffectivePurpose); proof-required submission requires ≥1 non-retired SIGNATURE criterion and every mandatory one satisfied; OWNER waivers preserved (SignatureNotRequired decision, all-signature-criteria-retired-with-reason — FL-06 contract updated); D-9 amendment marked RATIFIED 2026-10-31 in docs/requirements/state-semantics.md + api.md. |
| Z-F-03 | OPEN | **FIXED_PENDING_VERIFY** | f2-zf03.patch: `WorkItemView.OutcomeVerification` populated in ListWorkItems (work grid rows) and BuildControlRoom (blockers/nextActions/waiting), exposed via `derived.outcomeVerification`; FE per-axis badges (work grid beside the aggregate, control-room rows); domain test `TestControlRoomRowsCarryTheOutcomeAxis` + HTTP grid-row assertions + FE tests (52/52 at fix time, 830/842 final). |
| UX-L-01 | OPEN | **FIXED_PENDING_VERIFY** | workspaces/page.tsx title → `Workspaces / Không gian làm việc` (+ metadata); probe: /workspaces PASS lang=vi vi_strings h1. generateMetadata with route id on 4 param detail pages. |
| UX-L-02 | OPEN | **FIXED_PENDING_VERIFY** | f4-locale-cookie.patch per D-2: `ui-locale` cookie server-readable (`lib/locale-server.ts`), root shell renders `<html lang>` per request; LocaleProvider seeds from the server value (no hydration flip), localStorage mirror + cookie write in `setUiLocale`; design note f4-locale-cookie-design.md; **probe 22/22 PASS** (commands/probe-22-routes.log): lang=vi + vi strings + h1 at t=0 on the isolated prod build (node `next build` 29/29; `instant=false` carried by root-shell.tsx, worker variant via resolveAlias). |
| UX-L-04 | OPEN | **FIXED_PENDING_VERIFY** | f5-uxl04-05.patch: ReadFailure EN literals localized (not-found title + unavailable description, subject vi vocabulary), error.tsx body, proof-panel challenge label (useLocale hoisted), document-forms upload copy set, filing-forms authority placeholder, planning-view Waiting-on title+description, rejection-details "Not satisfied:", document detail promote title/description; SearchPicker already localized in source (audit screenshot predated remediation) — not changed. |
| UX-L-05 | OPEN | **FIXED_PENDING_VERIFY** | same patch: ReadFailure `heading` prop (h1 above the state); MatterScope failure + sign-in paths render the hub breadcrumb + id (no stale labels — contract test updated); workspace + requirement detail failures keep the h1 too; probe: h1 present on all 22 routes. |
| UX-L-06 | OPEN | **FIXED_PENDING_VERIFY** | f6-storybook.patch: `next/navigation` mocked for Storybook via .storybook/navigation-mock.ts + viteFinal alias; GlassSurface stories added (Dialog, RefractingRim; both themes via the theme toolbar); **build-storybook exit 0, 60 stories built incl. Templates/DashboardTemplate + Molecules/GlassSurface**; `pnpm build-storybook` already in .github/workflows/frontend.yml (deploy-readiness) — verified present. |
| UX-L-03 | CLOSED_BY_DECISION (D-1(b)) | unchanged | CO-17 scope, not this wave. |
| UX-L-07..11 | OPEN (backlog) | unchanged | metadata/aria-live/border-3:1/dev-streaming/dev-tools bubble — after the wave per plan. |
| PI-01..04 | FIXED_PENDING_VERIFY | unchanged | verify-wave reruns on the pinned bytes (this wave touched none of those files except next.config.ts — see drift note). |

## Drift note for the verify wave

`apps/frontend/next.config.ts` gained the worker-branch `turbopack.resolveAlias` and `apps/frontend/src/app/layout.tsx` became a thin re-export of `root-shell.tsx` / `root-shell.worker.tsx` — PI-02/PI-03 file set adjacent; OpenCode's PORT/PREFLIGHT reruns must use the new tree (4b6a65f + wave patches), not the deploy-readiness pins.

## NOT_RUN / residual

- Browser-rendered UX probes (screenshots, tab-title, aria-live announcements) and tools/contrast.js: **NOT_RUN** — no browser in this session; the curl probe proves server HTML (lang/text/h1 at t=0) but not post-hydration visuals. Tokens untouched by the wave, so the audit's 52 contrast pairs remain the standing measurement.
- Storybook runtime render proof (post-mock) = build success + module inclusion; visual confirmation queued for the verify wave.
- /requirements/r1 + /workspaces/ws1 got h1 headings this wave; deeper fail-context polish on non-matter pages stays with UX-L-07..11.
- Commit of the wave deltas: **BLOCKED** by the Mimosa git-gate (project-wide pre-commit scan; flagged files are pre-existing baseline code outside the wave diff, no disposition interface — see commands/02-f1-blocked-commit.log); deltas live as durable patches + working tree per the wave prompt's contingency.
