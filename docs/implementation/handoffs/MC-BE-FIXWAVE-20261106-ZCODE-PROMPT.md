# MC-BE-FIXWAVE-20261106 — Dispatch prompt (implementation, backend fix-wave, ZCode)

Task ID: MC-BE-FIXWAVE-20261106
Assigned by: Product Owner, direct instruction 2026-11-06 ("zcode thực hiện hết cho phần backend").
Executor: actual ZCode — backend execution owner per PO routing.
Scope source: intake of `MC-BE-ECHO-REVIEW-20261106` (register §12, `docs/implementation/workboard-findings.md`) + its ERRATUM-1.
Status target: implement → gates → task-scoped commits → `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW` (this wave is self-authored; independent review is a separate later dispatch — do not claim DONE).

## 0. Mode

- Implementation wave, 4 work items only (§2). No refactors beyond them, no dependency changes beyond the single patch bump, no schema/migration work (none of the items needs DDL), no frontend changes.
- Commit authority: the PO pre-authorizes task-scoped commits for exactly these items in this dispatch. Commit only your own paths; other sessions hold dirty files (FE prompts, R2/design workstreams) — never stage or clean them.
- This wave does not close any review finding as independently verified; it produces author-complete fixes for later review.

## 1. Pinning — pre-flight (mandatory)

- Repository (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` · Branch: `develop`
- Pinned base: `276a1e68` — if `git rev-parse HEAD` differs, re-pin to actual; verdicts/fixes bind to re-pinned bytes; record the delta and re-verify the §2 anchor lines still hold (files may have moved under you).
- Pre-flight: `git status --porcelain` (record; note foreign dirty files — leave untouched); `go version`; confirm `apps/backend/go.mod` currently pins `github.com/labstack/echo/v5 v5.4.0`.

## 2. Work items (all four; order chosen to front-load risk)

### W1 — GOVULN-01 (P2): Echo security patch bump
- `GO-2026-6838`, `GO-2026-6839`, `GO-2026-6841`, `GO-2026-6844` all affect code call paths at `github.com/labstack/echo/v5 v5.4.0`; all fixed in **v5.4.1** (evidence: `docs/testing/be-echo-review-20261106-r1/evidence/govulncheck-followup.txt`).
- Bump: in `apps/backend`, `go get github.com/labstack/echo/v5@v5.4.1` then `go mod tidy`. Keep the diff minimal — go.mod/go.sum changes must trace to the echo path only; if tidy pulls unrelated transitive upgrades, report them and stop for PO decision instead of committing.
- Verify: `go list -m github.com/labstack/echo/v5` → v5.4.1; re-run govulncheck (`go run golang.org/x/vuln/cmd/govulncheck@latest ./...` or the installed binary) → expect **0 "your code is affected" advisories**; record remaining required-but-not-called entries as INFO.
- Acceptance: before/after `go.mod` diff + full govulncheck output in evidence.

### W2 — BE-R1-01 (P3): term-sheet import must report deletions
- Location: `apps/backend/internal/core/service/termsheet_service.go:326-331` (re-verify at HEAD). Import counts `created/replaced/unchanged` but not the prior lines dropped by replace-per-version semantics — observability gap; correctness unaffected.
- Change: add a `deleted` counter to the import result struct, the `TermSheetImported` event map, and anywhere the result is surfaced (handlers/response). Do **not** change the receipt fingerprint inputs (method+path+revision+versionID+format+sha256(bytes)) and do not break replay: old stored receipts have no `deleted` field — replay must tolerate that (omit or zero, explicitly).
- TDD per house style: add a failing-before subtest first (replace scenario with ≥1 dropped line → expect `deleted` reported), then implement to green.

### W3 — BE-R1-02 (P3): OR-form keyset → row comparison
- Location: `apps/backend/internal/adapter/.../queries_mattercontrol/matter.sql:147-148` (re-verify exact path at HEAD). Replace `(recorded_at > $1 OR (recorded_at = $1 AND seq > $2))` with the row comparison `(recorded_at, seq) > (sqlc.arg(...), sqlc.arg(...))` — keep parameter names/order identical so callers don't change.
- Regenerate sqlc; `make sqlc-check` must pass (no drift). Verify identical pagination semantics via existing keyset tests (they must stay green untouched); add a boundary test only if none covers the `(equal timestamp, greater seq)` case.

### W4 — Hygiene: sibling `.orig` leftover
- Remove `apps/backend/docs/api.md.orig` (BE-R1-03 removed its sibling in `6f8b2b8f`). First grep the repo for references to `api.md.orig` — if any doc/tool references it, stop that item and report instead.

## 3. Hard constraints (binding)

1. **SQL parameter binding**: all SQL stays sqlc-parameterized or `$n`-bound; no concatenation/format-built SQL anywhere in this wave (Mimosa gate criterion). W2/W3 introduce no raw SQL.
2. **Gates before any commit**: `make check` in `apps/backend` — sqlc-check + gofmt + tidy + golangci-lint + `go test -race -count=1 ./...` with `MC_TEST_DATABASE_URL` on **your own throwaway PG fixture** (spin up, tear down after; the old `mc-r2-check-pg` is gone). Exit 0 required, including the 296 existing test functions.
3. Prefix every shell command with `rtk` (host rule). No `sed`/`perl -i` on source paths (Mimosa). No macOS `timeout`; `openssl rand` for randomness; shell vars do not persist between Bash calls.
4. Do not kill/restart processes you did not start; do not touch `.mimosa/`, `.agents/`, `ops/`, or other sessions' files.
5. Semble-first for code exploration (record failure → targeted grep). Synthetic data in tests only; no secrets in code, logs or evidence.

## 4. Commits and evidence

- Commit plan (task-scoped, in this order): ① W1 echo bump (`fix(deps): bump echo/v5 to v5.4.1 — GO-2026-6838/6839/6841/6844`); ② W2+W3+W4 may share one commit (`fix(backend): fix-wave MC-BE-FIXWAVE-20261106 — deleted-count, keyset row-comparison, hygiene`) or separate; your call, record it.
- Evidence dir: `docs/testing/mc-be-fixwave-20261106-r1/` with `return.md` + `evidence/` (go.mod diffs, govulncheck before/after, failing-before→green test logs, make check log) + `commands/`.
- After the last commit: append register section §13 to `docs/implementation/workboard-findings.md` (shared file — re-read immediately before inserting) and commit it with the evidence.

## 5. Return format (orchestration-protocol)

Task ID · actual agent identity · base/head per commit · changed files · acceptance per item (W1–W4) · tests run / NOT_RUN · risks · proposed next status `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW`. End with **what was skipped and remaining risk**. Known out-of-scope items to restate as open: org tenancy (PO product decision), real-bucket B3 test (needs PO bucket/token), gitleaks docs/ history classification (coordinator).

## 6. Non-goals

No org-tenancy work, no new features, no dependency changes beyond the echo patch, no frontend/ops edits, no production/provider claims, no closure of MC-BE-ECHO-REVIEW findings (that needs the separate non-author confirmation pass, prompt already at `MC-BE-ECHO-REVIEW-20261106-CONFIRMATION-PROMPT.md` — not your job in this wave).
