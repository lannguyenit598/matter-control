# MC-PREFLIGHT-01 — Independent Implementation Review (OpenCode)

- **Task**: MC-PREFLIGHT-01 — Filing Package Pre-flight v1 (domain read model + HTTP contract + FE panel)
- **Verification target**: uncommitted working tree; author work per `docs/testing/preflight-impl-20261103-r1/return.md` (ZCode execution)
- **Dispatch**: `docs/implementation/handoffs/MC-OPENCODE-PREFLIGHT-IMPL-REVIEW-20261103-PROMPT.md`
- **Reviewer / identity**: OpenCode — non-author, evidence-only session (harness: OpenCode; model: GLM-5.3-Flash Free). No author-file edits, no commit/push, no Codex task-record writes, no stack/IdP start, no permission/signature bypass. Writes confined to `docs/reviews/preflight-opencode-impl-review-20261103-r1/`.
- **Repo / branch / HEAD**: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` · `codex/unified-project-flow` · `6172f234be5a25393cddffaf841cc0370b587334` — implementation range base `978d8fc`.
- **Binding**: this verdict binds to the pinned bytes in `sha256-manifest.txt` (19 files; captured 2026-11-03T16:51:28Z; re-verified 19/19 OK at 2026-11-03T17:10Z, UTC). Any byte drift → re-pin + re-review.
- **Session dates**: part 1, 2026-11-03 16:44–16:54 UTC; resume (this record's execution log), 2026-11-03 17:10–17:31 UTC (= 2026-11-04 00:10–00:31 local, UTC+7). Command log: `commands.log`.

## §0 Pre-flight — PASS

| Probe | Result |
|---|---|
| Branch = `codex/unified-project-flow` | OK |
| HEAD = `6172f234be5a25393cddffaf841cc0370b587334` | OK (expected value) |
| Dirty scope = 14 modified + 5 new implementation files (+ pre-existing untracked docs/evidence) | OK |
| Byte pin `sha256-manifest.txt` | 19/19 OK at capture and re-verified at resume |
| PG fixture | container `mc-preflight-pg` Up (5433→5432), `pg_isready` accepting |
| Toolchain | rtk 1.1.0 · go1.27.3 darwin/arm64 · golangci-lint 2.14.0 · node v24.22.1 · pnpm 12.11.2 · docker 29.9.2 · Apple M4 host |

## Checklist (V1–V11 ≙ PF-AC-01..12 per dispatch)

### V1 — Baseline re-pin (PF-DEP-02) — PASS
`git diff --stat 978d8fc HEAD -- filing.go evidence.go workview.go filing_service.go` → empty: committed guard bytes are identical to `978d8fc`; `evidence.go` / `workview.go` are additionally byte-identical in the working tree. The `978d8fc`↔working-tree delta on scoped files contains implementation hunks only. Source-continuity claims were not relied upon anywhere.

### V2 — Guard parity — PASS
`git diff HEAD -- internal/core/domain/matter/filing.go` + original `978d8fc` bytes (lines 368–426):
- refusal codes/messages byte-identical; `PackageUndeclared` precedence kept; the early-return `signature-criteria-required` message is intact in the unchanged context; `SigUndeclared` / `SigMissing` mutually exclusive;
- no gate widened; no old guard test assertion touched;
- the only re-evaluation variable (`res :=`) lives inside `ProofGapsOf` (filing.go:279).
No observable difference → no P0.

### V3 — Truth-table quality — PASS
- 8 truth-table subtests use hand-authored expected literals, pinned two-sided against the real `DecideAdvance` (no recompute from the implementation → not tautological).
- Negative control `TestPreflightReadyDoesNotClaimFullSubmittability` is genuine and can be forced red.
- DISPUTED subtest at filing_preflight_test.go:270 pins **both** the display state and guard blocking.
- Perf test uses `b.Loop()` + `b.ReportAllocs()` (AUTO-FIX #3); bench numbers matched at gate time (V7).
- **P3-F1**: dead helper `satisfied` (filing_preflight_test.go:63–66) — declared, but only ever assigned `_ = satisfied` (:66), never invoked; the mask keeps the unused-linter silent. Remove it or invoke it. Non-blocking.

### V4 — Hidden-denial semantics (D-21 / E-6) — PASS
- Service level: uniform `ErrNotFound` for a non-member (`e.out`, contract_preflight.go:111) **and** for a non-filing work-item id (`req`, :116) — `preflightDenial`, contract_preflight.go:101–119. A read-only member (VIEWER) reads the panel without error (:106–108); waiver rationale passes verbatim at store and HTTP layers.
- HTTP-level: unprovisioned identity (`t-ghost`) → 403 is the app-wide pre-existing identity convention (productapi `server.go`:276, unchanged, pinned file) — not a D-21 violation, no existence leak beyond standing behavior.

### V5 — Contract discipline — PASS
DTO carries machine reasons only (no display strings); `CriterionID` never fabricated (`omitempty`); `Link` nil-reserved (FE derives `subjectHref` from page context in `page.tsx`); `WaiverRationale` verbatim; provenance headers (`MC-As-Of`, `MC-Source-Revision`) from a single snapshot; flat envelope per app convention.

### V6 — Read-model semantics — PASS
- Blocking formula: `row.Blocking = purpose != PurposeOutcome && c.Criterion.Mandatory && !c.Satisfied` (filing_preflight.go:158); the OUTCOME branch explicitly resets `Blocking = false` (filing_preflight.go:102, BF-01). No path yields an OUTCOME blocking row.
- Retired criteria excluded from evaluation via the `!c.Retired` filter (evidence.go:353) → E-2 honored.
- `Ready` ⇔ no blocking rows, consistent in both directions (truth table + both contract suites); PG and memory suites both registered and green.

### V7 — Gates — PASS (one rerun; environment flake recorded, L1)
| Gate | Command | Result |
|---|---|---|
| Backend race suite | `MC_TEST_DATABASE_URL=… go test -race -count=1 -v ./...` | EXIT=0 — **805 `--- PASS`** (≥ 804), 0 `--- FAIL`, 6 `--- SKIP` (pre-existing env-gated), 14 packages `ok` — `v7-go-race-full-v.log` |
| Lint | `golangci-lint run ./...` | EXIT=0, `0 issues.` — `v7-golangci-lint.log` |
| FE check | `pnpm check` | EXIT=0 — **922 passed \| 12 skipped (934)** — `v7-fe-pnpm-check.log` |
| FE build | `pnpm build` | EXIT=0 (filings route compiled; CSS verified) — `v7-fe-pnpm-build.log` |
| Storybook | `pnpm build-storybook` | EXIT=0 — `v7-fe-pnpm-build-storybook.log` |
| Bench | `go test ./internal/core/domain/matter/ -run XXX -bench=BenchmarkPreflightOf100Criteria -benchmem` | 3,366 iters · **341,047 ns/op · 267,266 B/op · 644 allocs/op** vs author claim 328 µs/op · 267 KB/op · 644 allocs/op — time Δ ≈ +4% (single-run variance), bytes/allocs exact — `v7-bench-preflight.log` |

The 6 skips (none preflight-related, all pre-existing env-gated): `TestContract_R2_RealBucket`, `TestAccessPathExplainVerification`, `TestMatterSuiteW6_Postgres/a_failure_inside_the_group_rolls_back…retry_then_succeeds`, `TestPerf_LocalWorkloads`, `TestRestoreRehearsal`, `TestFreshSchemaDSNFrom_SkipsWithoutEnv/skip`.

**L1 — infra flake record**: the first full-suite run (part-1 session, ~382 s) failed only in `TestB1LeastPrivilegeProfile` (postgres package): schema-handover `ALTER SCHEMA sx OWNER TO mc_owner` deadline + `lookup localhost: i/o timeout` — a fixture/DNS timeout, no code path involved. Fixture probed healthy (`pg_isready` accepting); package rerun green in 181.972 s (`v7-go-race-postgres-rerun.log`); the authoritative full-suite rerun above is green (postgres package 227.114 s). Recorded as environment, not implementation.

### V8 — Panel rendering & a11y surface — PASS (one nit)
Cause sentences always rendered in text (no color-only signaling); blocking rows are native `Link` (keyboard-reachable); vi/EN parity with DRAFT-R10 markers in `labels.ts`; headers never claim submittability (D-20 honored); Solid Glass tokens; zero new dependencies.
- **P3-F2**: `<section aria-label={label.en}>` (preflight-panel.tsx:91) while the visible heading directly below is localized via `LocalizedText` — the programmatic section name stays EN under the vi locale. Use the localized label in the aria attribute too. Non-blocking.

### V9 — Author honesty / auto-fix verification — PASS
- AUTO-FIX #1: DISPUTED subtest present (filing_preflight_test.go:270) ✓
- AUTO-FIX #2: retired-SIGNATURE waiver line present in the `ProofGapsOf` doc comment (filing.go:272–277) ✓
- AUTO-FIX #3: `b.Loop()` + `b.ReportAllocs()` ✓ (bench matched at gate time)
- Declared NOT-RUN set matches reality: browser E2E, screen-reader smoke, M1–M5 usability script (script itself undrafted), end-to-end p95 (only computation measured), commit (not authorized). No evidence fabrication found in the tree: no E2E/screenshot/trace artifacts added; the untracked file set composition matches the pre-review state apart from reviewer-owned evidence.

### V10 — Reviewer decision on E-7 (size-logging defer) — ACCEPT (P3-F3)

My own call: **ACCEPT the defer; keep it non-blocking for sign-off.**

- The design itself scopes E-7 as “no pagination in v1” with the reopen trigger being the *condition* “>200 criteria/filing” (design §6 scale row: “reopen nếu >200 dòng”); nothing in this vertical approaches that threshold today, so the trigger the design names has not fired.
- No correctness, security, or UX-approval impact: there is no truncation code path at all (every row renders), `Ready` cannot overstate (V6), and PF-AC-05's “without false completeness/Ready” holds.
- The missing piece is one diagnostic log line. Forcing a patch now buys no testable benefit for the current data shape and inflates a scoped-P0 iteration with re-review churn; the author transferred the decision to the reviewer with the gap explicitly declared (return.md:21/44/53).
- Conditions recorded: (a) the gap stays visibly deferred in the task record (already); (b) if >200-criteria workloads become reachable (product change or removal of the 1-filing/screen cap), the size-logging must be implemented and re-reviewed; (c) tracked here as P3-F3.

### V11 — NOT_RUN honesty — PASS
`return.md`:28 sets PF-AC-12 = NOT_RUN (independent review + browser + screen-reader + M1–M5), :25 marks the screen-reader smoke NOT_RUN, and :52 lists the same set; :53 discloses the E-7 defer. Tree state contradicts nothing: no new browser/E2E/overlay artifacts, untracked-file composition unchanged (reviewer evidence only). No inferred completion anywhere.

## Findings

| ID | Sev | Finding | Required action |
|---|---|---|---|
| P3-F1 | P3 | Dead test helper `satisfied` (filing_preflight_test.go:63–66) masked by `_ = satisfied` | Delete or invoke — next author touch of that file |
| P3-F2 | P3 | Unlocalized `aria-label={label.en}` (preflight-panel.tsx:91), just below the localized heading | Localize the aria attribute — next FE touch |
| P3-F3 | P3 | E-7 >200-rows size-logging deferred — **accepted** (V10) | Implement if/when the threshold becomes reachable |
| L1 | note | V7 first-run infra flake (postgres pkg; DNS/fixture deadline) — rerun green, documented | None; keep the rerun evidence in the record |

No P0 / P1 / P2 findings. Every gate in the run set is green after the documented rerun.

## Verdict

**PASS_WITH_LIMITATIONS** — on the pinned bytes, the implementation complies with the binding design (§4/§6, D-15..D-22) and the MC-PREFLIGHT-01 acceptance intent; all gates were executed and green; the finding set is P3-only and none blocks sign-off.

Limitations: **L1** the first race-suite run required one fixture rerun (localized environment flake, documented end-to-end); **L2** E-7 size-logging accepted as deferred (V10/P3-F3); **L3** browser E2E, screen-reader smoke, M1–M5, and end-to-end p95 remain genuinely open (NOT_RUN by the author, and outside this reviewer's no-stack-start constraints) — they must **not** be inferred from this PASS.

**Disposition: READY-for-signoff** — the PO can proceed via Codex. The verdict is bound to `sha256-manifest.txt`; any drift to the pinned bytes voids it and requires re-pinning + re-review.

## What was skipped / remaining risk (reviewer record)

- Executed **by design-exclusion** (reviewer-only constraints): browser E2E, screen-reader smoke, M1–M5 usability run, end-to-end p95 against live stacks, IdP-adjacent flows, commit/push, task-record updates (Codex carries this verdict into `MC-PREFLIGHT-01.md`), any author-file fixes (P3 findings left for the author).
- Evidence-method limits: the FE gates exercised build/typecheck/units, not rendered-browser behavior (unit tests verify each panel state in isolation, not a rendered page); bench is a single run (µ-benchmark variance); static/local evidence never proves production behavior or a $0 infrastructure bill.
- Environment: PG fixture (docker) remained up throughout; no restart needed this session.
- The full race suite ran with `-v` only on the second (authoritative) run; the first failed run's transcript lives in the part-1 session record and is characterized in L1.
- Out of scope by dispatch: signing the design itself, PO approvals, release decisions — this review is advice to the PO and does not auto-approve Step 03 or any release.
