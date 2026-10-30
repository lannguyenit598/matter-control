# Phase C final return — Solid Glass implementation (2026-10-30)

Supersedes the Phase C portion of `final-combined-return.md` (which recorded the pre-handoff BLOCKED state; kept as history). Identity: actual ZCode session (model account:zai-start-plan/GLM-5.3-Flash). Branch `codex/unified-project-flow`, HEAD `20feedbf…` unchanged; nothing committed/pushed/merged/deployed; Codex's dirty increments and all other writers' bytes preserved.

## Implemented (AUTHOR_VERIFICATION only)

- **Material tokens** (`globals.css`): light+dark Solid Glass token blocks (`--panel`, `--popover` depth ladder, `--glass-rim/-edge/-shade/-popover-edge/-state-rim/-field-rim`, `--glass-blur`), pane finishes composed into the existing `--shadow-xs/sm/md/lg` stacks so every existing consumer picks up rim+hairline+shadow without class changes, `@supports not (backdrop-filter…)` opaque fallback, `forced-colors` reset. All pre-existing tokens, Be Vietnam Pro, compact geometry, `.control-target` hit targets and legal-state colors unchanged.
- **Explicit hooks** (one line each): `data-slot="button|input|textarea|select-trigger|badge|card"` on the atoms; `data-slot="dialog-panel"` on the native `<dialog>` (the real DOM owner, per the intake correction).
- **Surface mapping**: sidebar → `--panel`; dialogs + base-select picker → popover ladder + backdrop blur (the only blurred surfaces); cards → near-opaque face + edge finish; fields → field rim; nav selected → state rim; dense regions (queues, tables, history) intentionally near-opaque; app-header intentionally untouched (chrome, not pane).
- Coverage is central: no per-family edits were needed beyond the hooks — every family consumes the tokens/utilities.

## Verification (details: `verification-record.md`)

Typecheck 0 · full `pnpm test` **78 files / 707 tests pass** (one intermediate run hit a pre-existing load flake in the untouched `action-entry` test — retained, classified baseline, passes alone ×2 and full suite passes on rerun) · eslint + prettier clean · **both production engines + CSS guard pass in private output** (1 Turbopack / 2 Webpack assets) · Storybook builds; its static-build RUNTIME fails identically on ALL stories (baseline tooling issue, retained). Rendered fixture evidence (compiled production CSS, light/dark 1440px, 320px no-overflow, computed-style receipts incl. `backdrop-filter: blur(26px) saturate(1.5)`): `fixture-light-1440.png`, `fixture-dark-1440.png` + `verification-record.md`. One genuine fix found by measurement: hand-written `-webkit-` prefixes caused lightningcss to drop the standard `backdrop-filter` — corrected and re-verified.

## Boundaries kept

No backend/SQL/API/auth/tenant/draft/recovery change; no dependency, registry, remote font or upstream file import; A-01/A-02 untouched (backend implementation owner). The sealed Phase A audit was not rewritten.

## Remaining (exact)

1. Authenticated product rendering journeys (OWNER/EDITOR/VIEWER, My Work live geometry, EN/VI in situ) and a screen-reader pass — need the runtime-owner handoff + human-assisted login. **NOT_RUN.**
2. Storybook static-build runtime failure — tooling-owner item (baseline; build passes, all-story runtime render fails `TypeError … reading 'data'`).
3. The `action-entry` dialog-close race — feature-owner item (baseline flake class; failure retained in the verification record).
4. Non-author review of these bytes; Phase A audit findings (A-01..A-06) remain open per their owners.

**Status: IN_REVIEW (author verification).** Skipped: authenticated rendered acceptance, screen-reader pass, storybook runtime repair (out of visual scope), any commit/push/deploy. Risks: fixture-level rendering cannot prove in-product appearance across real content; light-theme glass is intentionally restrained (edge-carried) — design owner may want stronger translucency after seeing it live.
