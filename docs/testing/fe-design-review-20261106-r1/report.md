# MC-FE-DESIGN-REVIEW-20261106 — Report r1

**SELF-REVIEW / OWNER-CONFIRMATION** — per ADDENDUM-2 (2026-11-06): the PO routed this review to actual ZCode with an explicit waiver of the §0 non-author rule (first dispatch correctly returned CONFLICT_OF_INTEREST, see `RETURN-CONFLICT-OF-INTEREST.md`). **Every verdict, severity and disposition in this run is an owner confirmation, NOT independent verification.** Per the binding conditions: this report cannot produce a DONE, cannot gate a release/stage, and cannot close any FIXED_PENDING_VERIFY item as independently verified. A non-author reviewer (OpenDesign or OpenCode) must run the confirmation pass on `report.md` + `backlog.md` before any of this gates anything.

- Actual agent identity: actual ZCode (ZCode harness session; underlying model `account:zai-start-plan/GLM-5.3-Flash`).
- Date: executed 2026-11-06 → 2026-11-07.
- Base bytes: pin `41098a4d8690a1f3ce3864ace50fc20ca1221caa` (develop tip at dispatch time), reviewed in an **isolated disposable worktree** `/private/tmp/mc-fe-design-review-20261106/wt-41098a4d` (clean at pin) per ADDENDUM-1. The shared checkout's HEAD moved repeatedly while the review ran — `26680dc1` at re-dispatch, `276a1e68 [develop]` by teardown (R2/develop progression) — **none of it reviewed; verdicts bind to the pinned bytes**. Branch recorded per ADDENDUM-1: shared checkout on `zcode/r2-storage-fix-20261106` at re-dispatch (foreign dirty workstream untouchable).
- Environment: Chrome PRESENT (system Chrome used via Playwright `channel:'chrome'` — no browser downloads, no dependency installs), Node v24.22.1, puppeteer-core NOT installed (known baseline → impeccable render path BLOCKED, browser fallback used), Storybook 10.6.3 served from the worktree at `127.0.0.1:6006` (72/72 stories render), Next 16.4.2 dev server at `127.0.0.1:3100` (worktree).

## 1. Method (per-pass evidence)

| Pass | Lens/tooling | Own captures | Key evidence |
|---|---|---|---|
| 1 | design-taste-frontend (+`inspect.mjs --app`) | 77 shots (72 stories + 5 forced-dark) + 6 app surfaces + 12 curated reads + 2 inspector runs | `lenses/design-taste.md`, `evidence/screens/lens1-design-taste/`, `evidence/taste-inspect/` |
| 2 | impeccable (Operate mode; degraded single-context) | 74 shots + detector + heuristic scoring | `lenses/impeccable.md` (32/40 Good), `evidence/screens/lens2-impeccable/` |
| 3 | hallmark (Floor greps + sloplint lint-tier) | 74 shots + deterministic checks | `lenses/hallmark.md` (0 literal hex, 0 transition-all; 3 FAIL/10 WARN/36 NOTE dispositions) |
| 4 | web-design-guidelines + frontend-design | 7×390px captures + guideline greps | `lenses/guidelines.md` (0 horizontal overflow; 2 P3 gaps) |
| 5 | design-testing-strategy + browser-use:web-gui-tester | interactive T1–T4 + contrast sweep v4 | `lenses/design-qa.md`, `evidence/contrast-results-r1.json`, `evidence/screens/pass5-design-qa/` |

Single-lens sequencing honoured: each pass ran its own capture round and its findings are attributed to exactly one lens.

## 2. Findings registry (all SELF-REVIEW / OWNER-CONFIRMATION)

Full per-finding detail (surface, file:line, evidence, lane, effort) lives in the lens files; consolidated:

- **P0**: none.
- **P1**: none.
- **P2**: UX-R1-01 (fail/empty canvas void 39–40%, taste), UX-R1-07 (form stories unconstrained fixtures, quality), UX-R1-25 (**OPEN-VERIFY** — Escape does not close the Quick-search dialog in 2 GUI attempts while `dialog.tsx:67-70` implements `onCancel`; discrepancy unresolved, requires independent verification).
- **P3**: UX-R1-02 (liquid fixture borders 5.69:1), UX-R1-03 (glass shadows 10% vs ≤8% — defend-or-tune), UX-R1-04 (fixture placeholder copy), UX-R1-08 (inline-edit affordance distance), UX-R1-09 (error vs helper precedence), UX-R1-12 (36 spacing off 4px scale), UX-R1-18 (missing theme-color meta), UX-R1-19 (missing touch-action), UX-R1-24 (field-face vs glass composite <3:1 — rim-carried distinction; P-10/V-03 still open at token level).
- **INFO/positive**: UX-R1-05 (glass-button sheen = edge finish, anchor-superseded), UX-R1-06 (inspector headings discrepancy), UX-R1-10 (state coverage strength), UX-R1-11 (micro-interactions deferred to pass 5), UX-R1-13→**REFUTED** (sloplint sticky collision: `axesCollide:false` measured), UX-R1-14 (−webkit- pair guarded by `check-built-css.mjs`), UX-R1-15 (dark pane surface dismissed), UX-R1-16 (Solid Glass conformance verified in renders), UX-R1-17 (vi/en one-system), UX-R1-20/21/22 (responsive 0-overflow, IA coherence, authored identity), UX-R1-26 (palette interaction quality), UX-R1-23 (production-build responsive gate NOT_RUN).

### Own-work findings (bias control, required subsection)

The reviewer authored the in-scope surfaces; per ADDENDUM-2 these are listed explicitly: **every finding above touches ZCode-authored design-system or feature surfaces** — Solid Glass tokens/shadows/field-face (R1-03/24), glass button sheen (R1-05), ReadFailure/fail states (R1-01), the dashboard template + story fixtures (R1-01/02/04), form/inline-edit primitives (R1-07/08/09), workbench spacing (R1-12), dialog primitive + palette wiring (R1-25). The detector/inspector/sloplint findings the tools caught against the reviewer's own work (R1-02, R1-12, R1-13-refuted-by-measurement, R1-24) are recorded rather than argued away, with measurements preserved for the confirmation pass.

## 3. §5 delta verification — owner confirmations

| Item | Disposition | Evidence |
|---|---|---|
| Workspaces mislabeled "Matters/Hồ sơ" (UX-L-01) | **CONFIRMED_FIXED** (owner) | `h1` = "Không gian làm việc" rendered vi (`app/workspaces-vi.png`; `page.tsx:21`); metadata title still EN (see P-08) |
| Server-locale EN stuck (UX-L-02, D-2 cookie) | **CONFIRMED_FIXED** (owner) | vi at t=0 on all 6 probed routes: `lang=vi`, vi h1 (`app/_results.json`) |
| Populated local path absence | **STILL_OPEN** | Walkthrough env (mcapi + stub-IdP + PG fixture, D-1(b)) not assembled at pin; app renders fail-closed by design; 2 console errors/page = HMR WS artifact (dev-only) |
| UX-L-04 EN-literal sweep | **CONFIRMED_FIXED** rendered-surface level | 0 EN literals observed in vi-mode app captures; full grep-sweep NOT re-run (limitation) |
| UX-L-05 ReadFailure context (P-04) | **CONFIRMED_FIXED** | H1/breadcrumb/tabs preserved + Retry rendered (`app/matters-vi.png`) |
| UX-L-06 Storybook (P-07) | **CONFIRMED_FIXED** | 72/72 stories render at pin; `build-storybook` in CI (`.github/workflows/frontend.yml:52`) |
| Z-F-01/02/03 guard copy | **CONFIRMED_FIXED source-level** | `filing-forms.tsx` + `filing-guard-copy.test.tsx`; approved copy strings (ux-copy-for-guards.md); rendered-on-populated-dialog (V-07 visual) blocked |
| F8 aria-live relay (P-09, CO-15 reprioritised) | **CONFIRMED_PRESENT source-level** | 9 files with aria-live (action announcer, work-grid, term-sheet-panel…); SR announced-correctness (V-12) NOT_RUN |
| V-01..V-14 | V-03 token-measured (→ UX-R1-24, still open); V-07/V-12 source-verified; **V-01/02/04/05/06/08/09/10/11/13/14 NOT_RUN — VERIFICATION_BLOCKED (populated runtime absent)** | `lenses/design-qa.md` |
| P-01..P-15 | P-01 ✓, P-02 ✓, P-04 ✓, P-05 ✓(rendered), P-06 ✓(D-3 live; role-badge vi render unverified — populated), P-07 ✓(+CI), P-09 ✓(SR-verify blocked), P-15 ✓(source); **P-03 not assembled; P-08 STILL_OPEN** (tab title EN observed: "Matters · MatterControl" on vi page; `workspaces/page.tsx:15` metadata EN); P-10 STILL_OPEN (UX-R1-24); P-11/P-12/P-13 blocked (populated/prod-build); P-14 partial (motion 160ms token in use; spacing → UX-B-08) | this report + lens files |
| Contrast (was 50/52 PASS) | **44/48 measured pairs PASS at pin** (22/24 × 2 themes); `border on background` 1.167/1.421 = the same 2 standing pairs; new measured pair `field-face` (1.037/1.188) → UX-R1-24 | `evidence/contrast-results-r1.json` |

## 4. 3-lens synthesis (2026-11-01 precedent — owner-adjudicated union)

| Lens | Keep | Refine | Reject |
|---|---|---|---|
| design-taste | Honest operational-truth voice; single near-black/inverted primary; hairline rules/no zebra; dark discipline (rims, no saturate, inverted primary); fail-closed context retention | Fail-state void closure; fixture borders/shadows to token whisper; fixture copy to product voice | none (no adjudicated-rejected device re-appeared) |
| impeccable | State coverage breadth (8-state picker, aria-busy, motion token); one primitive system (cva) everywhere | Form fixtures constrained; inline-edit affordance proximity; error/helper precedence; keyboard/bulk depth (P-11) once populated | none |
| hallmark | Token discipline (0 literal hex, 0 transition-all); Solid Glass conformance (near-opaque light faces, overlay-only blur, dark w/o saturate); vi/en one system | 4px spacing normalisation; field-face vs glass composite; theme-color/touch-action hygiene | none |

**Union**: refinement-not-replacement holds; the design system is coherent and PO-anchor-conformant at pin; the work concentrates in fixture honesty, spacing rhythm, field-on-glass distinction and two hygiene gaps. **No LANE-B direction changes proposed.**

## 5. Verdict

**PASS_WITH_LIMITATIONS** (owner-confirmed; non-verified).

1. All verdicts are SELF-REVIEW / OWNER-CONFIRMATION under the ADDENDUM-2 waiver — not independent review; a non-author confirmation pass on this report + backlog is required before anything gates.
2. Populated-runtime surfaces (dense grid, review cells, filing guards on real data, bulk, SR announcements) are VERIFICATION_BLOCKED — walkthrough env (D-1(b)) not assembled; never inferred from Storybook.
3. All rendered evidence is dev-server (`next dev` / Storybook dev); the production-build gate (incl. `check-built-css.mjs` re-verification and prod responsive) NOT_RUN.
4. Storybook fixtures are placeholder content in places (UX-B-04) — story captures ≠ product-copy captures for those surfaces.
5. IAB runtime could not click inside native `showModal()` dialogs (documented limitation) — Close-path and Escape discrepancy (UX-R1-25) remain OPEN-VERIFY.
6. a11y deep-dive and code-level Next.js review deliberately NOT duplicated here — MC-FE-NEXTJS-REVIEW-20261106 (cross-referenced).

## 6. Changed files

None outside this evidence directory (new files only, uncommitted): `report.md`, `RETURN-CONFLICT-OF-INTEREST.md`, `lenses/{design-taste,impeccable,hallmark,guidelines,design-qa}.md`, `backlog.md`, `evidence/screens/**` (≈240 PNG/JSON), `evidence/contrast-results-r1.json`, `evidence/taste-inspect/**`, `commands/`. No commits, no push. The disposable worktree and its dev servers are transient (see `commands/commands.log` for teardown record).

## 7. Skipped + remaining risk

- **Skipped**: quick-win patch files (§6 optional) — every candidate touches design-system files inside the waived-authorship scope; deferred to a fix-wave dispatch with non-author review. Production build + prod responsive gate. Full vi grep-sweep of EN literals. SR (VoiceOver) session. Term-sheet screens rendered capture (no story; populated runtime absent — source-level design review only, finding-free this round). Full 390px story matrix (subset only). `impeccable critique` snapshot persistence (dispatch output contract used instead).
- **Remaining risk**: the owner-confirmation nature of every disposition; UX-R1-25 unresolved (real bug vs runtime artifact); P-08/P-10 standing; populated-path UX unverified until the walkthrough env exists; shared-checkout HEAD moved during the review (`26680dc1`) — later commits are outside these verdicts.
