# MC-ZCODE-P1-FIX-WAVE-20261031-r1 — Return

- **Agent/tool identity:** actual ZCode (GLM-5.3-Flash session), fix-wave executor per PO "zcode thực hiện hết" and prompt `docs/implementation/handoffs/MC-ZCODE-P1-FIX-WAVE-20261031-PROMPT.md`. Not Codex, not OpenCode, not a subagent.
- **Status proposed:** `IN_REVIEW` — ready for the OpenCode verify wave (CO-13/14) on the re-pinned bytes. No CLOSED_VERIFIED claimed anywhere.
- **Base/head:** base `0de3e5d` → baseline commit **`4b6a65f`** (whole dirty candidate, DEC-20261031-01; Mimosa gate did not fire) → coordinator docs commit `5e932bd` landed mid-wave (workbook milestone + playbook; docs only). All wave deltas = **uncommitted working tree on `codex/unified-project-flow`**, one durable patch per fix-unit:
  - `f1-zf01-zf02.patch` (482 lines) — Z-F-01/Z-F-02
  - `f2-zf03.patch` (311) — Z-F-03
  - `f4-locale-cookie.patch` (245) — UX-L-02
  - `f5-uxl04-05.patch` (395) — UX-L-04/05 (+ post-patch additions below)
  - `f6-storybook.patch` (171) — UX-L-06
  - (F3 UX-L-01 changes are inside the f5/f4 working-tree set; listed per-file in source-manifest.json §wave)
- **Freeze:** verified 16:41:42Z — no apps/** writer after 16:30Z; concurrent coordinator doc writes only (playbook, verify-wave identity, workboard DEC-01 note), recorded in source-manifest.json.

## Per-fix evidence (red → green → gate)

**F1 — Z-F-01/Z-F-02 (D-9 RATIFIED 2026-10-31).** Red first: `PurposeSignature`/`res.Signature` undefined (log in commands/, 7 undefined refs). Fix: purpose enum PACKAGE/SIGNATURE/OUTCOME (`EffectivePurpose` switch — legacy "" stays PACKAGE); package gate counts PACKAGE criteria only; submission refuses an undeclared package (`package-criteria-required`) and requires declared+satisfied SIGNATURE criteria (`signature-criteria-required` / guard-failed naming each missing criterion); OWNER waivers kept (no-signature decision; all signature criteria retired with reason — FL-06 updated); refusal message joins package+signature parts (AC-145). Migration `0011_criterion_purpose_signature.sql` (CHECK widened, reversible; goose plain ALTERs, no plpgsql). Docs: state-semantics.md filing table + D-9 paragraph, api.md purpose + `signature` summary. Tests: 6 new domain tests (incl. the r2 filing-F repros), contract gw03/w4 updated to the ratified semantics; **backend make check exit 0 on the dedicated wave PG container (mc-p1-fix-wave, deleted after) with MC_TEST_DATABASE_URL + -race, 14 packages ok**; explicit receipts: Z-F domain tests 8/8, SuiteW4 7/7, SuiteGW 8/8 (memory+PG).

**F2 — Z-F-03.** `WorkItemView.OutcomeVerification` populated per filing row in `ListWorkItems` + `BuildControlRoom`; exposed on the wire as `derived.outcomeVerification` (envelope) so grid + control-room rows carry the axis; FE per-axis `OutcomeAxisBadge` beside the aggregate in work-grid and control-room rows (schemas optional). Red→green: domain `TestControlRoomRowsCarryTheOutcomeAxis`, HTTP grid assertions (PENDING/NOT_TRACKED/nil), FE tests. First HTTP assertion run caught my own test bug (noProof filing also carries an axis) — fixed before green.

**F3 — UX-L-01.** workspaces page title/H1 → "Workspaces / Không gian làm việc" (+ metadata `Workspaces`); generateMetadata with the route id on 4 param detail pages ([matterId], work/[itemId], filings/[filingId], documents/[documentId]).

**F4 — UX-L-02 (D-2).** Design note first (f4-locale-cookie-design.md): cookie `ui-locale` read via `cookies()` in the root shell; `<html lang>` per request; `LocaleProvider` seeds client state from the server value (no hydration flip) and tracks the localStorage mirror through `useSyncExternalStore` (an explicit mirror wins after hydration; absent mirror never stomps the seed); `setUiLocale` writes lang+localStorage+cookie+event; provider-less consumers (global-error, bare tests) keep the old store fallback. Tests: new locale-provider suite (3) + 5 pre-existing locale suites green (14/14); matter-scope contract test updated to the no-stale-labels breadcrumb contract. **Prod-build proof: `next build` 29/29, server HTML probe 22/22 PASS (lang=vi + vi strings + h1 at t=0; commands/probe-22-routes.log).**
  - Build-system note (new): `cacheComponents` rejects a per-request root layout at prerender; the Node build carries `instant = false` on the root segment (`root-shell.tsx`) while the Worker build (cacheComponents off, rejects the config) resolves `@/app/root-shell` to `root-shell.worker.tsx` via `turbopack.resolveAlias`. layout.tsx is a thin re-export. Worker `build:worker` exit 0; node `next build` 29/29; storybook exit 0.

**F5 — UX-L-04/05.** ReadFailure: `heading` prop (h1 above the state) + both EN literals localized (not-found title with a vi subject vocabulary; unavailable description); error.tsx body; proof-panel challenge label (`useLocale` hoisted — an inline conditional hook was caught and fixed); document-forms upload copy set; filing-forms authority placeholder; planning-view title+description; rejection-details label; document detail promote title/description. MatterScope failure AND sign-in paths keep a hub breadcrumb + h1 (no stale labels); workspace + requirement detail failures keep the h1 (added after the first probe caught them). New suite read-failure-context.test.tsx (3) + callers test still green.

**F6 — UX-L-06.** `.storybook/navigation-mock.ts` + viteFinal alias for `next/navigation` (fixes the TypeError-useRouter story crashes); GlassSurface stories (Dialog, RefractingRim; both themes via the theme toolbar; CSF `args` typing fixed); `pnpm build-storybook` **exit 0, 60 stories built** (DashboardTemplate + GlassSurface included). CI already runs build-storybook (frontend.yml, deploy-readiness).

**F7 — Gates.** Backend: make check exit 0 (sqlc-check, gofmt, mod tidy, golangci-lint, `go test -race -count=1 ./...`) on the dedicated PG container. Frontend: typecheck ✓ lint ✓ format:check ✓ (after prettier on my own files) agents:check ✓ **vitest 830 passed / 12 skipped / 0 failed**; **durable 14/14** on the wave PG (mc_fixture); **node build 29/29**, **build:worker exit 0**, **build-storybook exit 0**; walkthrough chain SuiteGW 8/8 on clean PG; UX probe 22/22 (above). Probe servers stopped; wave PG container deleted; no shared-.next concurrency — the :3000 server (PID 171, untouched) was protected by building in an isolated temp copy (`/tmp/mc-p1-fix-wave-fe`, self-contained node_modules copy), which is also where the builds ran.

## BLOCKED: wave commit (Mimosa git-gate)

Baseline 4b6a65f committed cleanly; the first fix-unit commit (F1) was then refused by the Mimosa PreToolUse git-gate with a **project-wide L3 scan** ("6 high sql-injection") whose flagged sites (`productapi/handlers.go:21/33/94/178/186`, `evidence_handlers.go:402`) are **pre-existing baseline code outside the wave diff** — my 2026-10-29 exhaustive SQL review (100% sqlc-parameterized) and the corroborated false-positive pattern say these are scanner taint heuristics, but there is **no disposition interface** (R1). Per the prompt and playbook, I did **not** bypass: deltas stay staged-in-tree + durable patches; escalation (PO Terminal commit per playbook B3) is the coordinator's/PO's call. Log: `commands/02-f1-blocked-commit.log`.

## NOT_RUN / skipped

- Browser-rendered UX verification (screenshots, hydration-visible text, aria-live, tab titles post-JS, Storybook story visual render) and `tools/contrast.js` rerun — no browser in this session; the probe proves server HTML only. No color tokens changed.
- `pnpm preflight` on the artifacts (CI covers it; deploy-readiness owns the 15-case packet).
- Live OUTCOME_UNKNOWN drill / provider cases / IdP flows — out of wave scope.
- Push — forbidden by the prompt; local commit also blocked (above).

## Remaining risks

1. The Mimosa gate will refuse any agent commit of this tree until it is dispositioned or the PO commits in Terminal — the wave's value sits in uncommitted bytes + patches until then (drift risk the coordinator flagged; single-writer holds).
2. `instant = false` makes every Node-build route render per request (no static shells) — accepted in the F4 design note as the D-2 cost; latency impact unmeasured (workerd/Cloudflare unaffected).
3. r2's live filing-A flow now REQUIRES a SIGNATURE criterion for proof-required filings (ratified D-9) — any in-flight demo fixture must declare one or set SignatureNotRequired; walkthrough scripts in BA hands need the same update.
4. Worker variant file (`root-shell.worker.tsx`) duplicates the shell — drift between the two files is possible; a future refactor should generate one from the other.
5. Two-phase verify dependency: OpenCode must verify Z-F-01/02 on the NEW semantics (old r2 scripts as-is would now fail at PACKAGE_PREPARATION — that refusal IS the fix working).
