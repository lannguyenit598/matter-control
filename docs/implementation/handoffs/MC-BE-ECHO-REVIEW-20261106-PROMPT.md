# MC-BE-ECHO-REVIEW-20261106 — Dispatch prompt (review-only, skill-driven)

Task ID: MC-BE-ECHO-REVIEW-20261106
Requested by: Product Owner (via coordinator) — re-review of the Go/Echo backend with the installed architecture + Go/database skill set.
Status target: IN_REVIEW → RETURNED (verdict + findings). Review only — this is not an implementation wave and grants no commit/merge/release approval.

## 0. Identity and mode

- You are the dispatched **independent, non-author reviewer** of the MatterControl backend (`apps/backend`, Go + Echo + sqlc + goose + PostgreSQL). If you authored any code under review, STOP and return `CONFLICT_OF_INTEREST`.
- Mode: **REVIEW_ONLY**. You may run gates, tests, migrations on test fixtures and read-only probes, and write only into your own evidence directory (§6). No code edits, no dependency changes, no commits, no push, no schema changes outside throwaway test databases.
- Record your **actual agent/tool identity** in the report. Never claim an external agent ran without invocation and returned evidence.

## 1. Pinning — pre-flight (mandatory; abort on mismatch and report)

- Repository (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- Branch: `develop`
- Pinned base commit: `41098a4d8690a1f3ce3864ace50fc20ca1221caa` (includes term-sheet backend work `fc367ce1`, `8e32e424`, `dd4cd526`)
- Pre-flight (record output of each):
  1. `git rev-parse HEAD` — if it differs, re-pin to actual HEAD, record in report §0; verdicts bind to re-pinned bytes.
  2. `git status --porcelain` — dirty tree allowed; record and note dirty files inside `apps/backend`.
  3. Confirm backend toolchain presence: `go version`, `sqlc version`, `goose` availability; record exact versions.

## 2. Scope — `apps/backend` only

Out of scope: `apps/frontend`, `tools/`, `ops/` (cross-cutting issues as one-line pointers only).

In-scope targets (verify against the tree; do not assume from this list):

1. **Echo wiring** — `cmd/mcapi`, middleware chain, routing, request-meta plumbing (INET/request-id from ctx), error taxonomy and 4xx mapping.
2. **Transaction spine (BE-01)** — operation receipts, idempotent replay, file-based ETag handoff, ordering rule **preconditions-412-before-guards-409**, AND-predicate guard evaluation.
3. **Term sheet workflows (newest surface)** — backend portions of `fc367ce1` / `8e32e424` / `dd4cd526` (term sheet review and recovery): full review, they have had no independent backend review yet.
4. **Domain services** — workspace/policy services, criterion purpose-typing (Z-F-01/02 backend side: purpose-blind filing guard, proof-required signature gate), NOT_DECLARED semantics.
5. **Preflight** — `ProofGapsOf` shared predicate + `PreflightOf` + `GET …/preflight` (MC-PREFLIGHT-01).
6. **sqlc queries + goose migrations** — parameterization, transaction boundaries, CAS conditions, index coverage vs real access paths, migration hygiene.
7. **Audit fixes at HEAD** — membership row-revision CAS, `security_audit` INET/request_id population, CacheTTL 30s, 5MiB ceiling, retention sweep.
8. **Concurrency** — spine concurrency, bulk operations (`attemptKey` flat rows), race-test coverage.

## 3. Skill passes — invoke by exact name, in sequence

Invoke skills explicitly (auto-trigger needs a fresh session). Priority if capacity is limited: **A → B → C → D → F**; E and G are optional deepening.

| Pass | Skill(s) | What to produce |
|---|---|---|
| A. Architecture | `/go-architecture-review` then `/codebase-design` | Layering (handler/service/domain/store), dependency direction, package boundaries vs `go-project-layout` norms, state axes preserved (Requirement vs Action; Filing/Action/Approval conditional axis) |
| B. Database | `/go-database` then `/sql-queries` then `/postgresql` | See hard criteria below — this is the core pass |
| C. Concurrency | `/go-concurrency-review` | Spine + bulk correctness, goroutine/channel hygiene, lock vs CAS choices, race-test adequacy |
| D. Security | `/go-security-audit` | Authz/tenancy at data layer, injection re-scan, secret handling, G115 (int overflow) / G101 (hardcoded credentials) patterns, least-privilege posture (B1 grants verified locally 55/55 — cross-check code assumptions) |
| E. API/contract (optional) | `/api-designer` + `/go-openapi` | Route conformance to contract rev 3 (server-side session store, opaque-handle cookie, token-exposure negatives), preflight response shape, error taxonomy consistency |
| F. Tests | `/go-test-quality` + `/go-test-table-driven` | Gate quality: `make check` (PG + race), fixture realism, table-driven coverage of guard/receipt edge cases, flake patterns (734/5/6 race history) |
| G. Deepening (optional) | `/go-context` + `/go-error-handling` + `/go-performance-review` | ctx propagation, wrapped-error chain + 4xx mapping, N+1 / count-per-page / OR-form keyset hotspots |

**Pass B hard criteria (binding):**

- **All external input must reach SQL via parameter binding** (sqlc parameters / pgx binds). Any query assembled by concatenation, `fmt.Sprintf`/format or f-string-style composition of external input = automatic **P0** finding, no exception for "trusted" callers. Re-scan must cover the new term-sheet code, not only previously reviewed packages. Record the scan command + result count as evidence.
- Transaction boundaries: one tx per unit-of-work; no `tx.Exec` captured in closures escaping the tx scope; commit/rollback on all paths.
- Optimistic concurrency: row-revision CAS present where required (membership, criteria revisions); no lost-update windows between read and write.
- Index coverage: every hot access path (user_id/workspace_id filters, `review_answers_cell` incl. `answered_at`, keyset pagination) has a matching index or a recorded justification; verify with `EXPLAIN` on a fixture DB, not by reading DDL alone.
- Migration hygiene: goose `StatementBegin/End` around plpgsql blocks; `statement_timestamp()` for paired column defaults; no concat-built SQL inside migrations; each migration reversible or explicitly marked irreversible.
- sqlc pitfalls: null-override semantics checked where nullable columns feed NOT NULL structs.

## 4. Runtime rules — hard constraints on this workstation

1. **Prefix every shell command with `rtk`** (host rule; proxy for commands it does not wrap). Follow `/Users/nguyenvanlan/.codex/RTK.md` if present; if absent/broken, record the failure and proceed.
2. **Semble search first** with the exact repo path; if unavailable/broken, record the failure once, then targeted grep. Do not re-run the same semantic query with grep.
3. **PG fixtures**: use `MC_TEST_DATABASE_URL` + the repo's test fixtures. Kept containers (`mc-preflight-pg:5433`, ports 28719–28721) may be stale — **verify liveness before reuse; never assume**. Spin up throwaway PG for anything else; tear down your own.
4. **Do not kill or restart shared/local processes you did not start** (e.g. anything listening on `:8080`/:8081/:18082 — record what you find, report, and leave ownership to the coordinator). A known orphan mcapi may or may not still exist on `:18082` — check, do not assume.
5. Mimosa hook active: no `sed`/`perl -i` on source paths, no SQL built by shell concat, `tx.Exec`-in-closure style will be flagged — as a reviewer avoid writing any code at all.
6. Known quirks: no macOS `timeout` command; `openssl rand` (not `tr`/`urandom`); shell variables do not persist between separate Bash calls.

## 5. Delta verification — prior findings to recheck at HEAD

For each item, return a disposition: `REMEDIATED` / `STILL_OPEN` / `REGRESSED` / `NOT_FOUND` (with evidence):

1. SQL review 2026-10-29 P2s: `review_answers_cell` missing `answered_at` index; missing `user_id`/`workspace_id` access-path indexes; count-per-page cost.
2. SQL review 2026-10-29 P3s: OR-form keyset pagination; membership update without CAS-in-SQL (note: audit fix A1–A5 wave claims to have added CAS — verify); `security_audit` dead columns `client_ip`/`request_id` (claimed populated by ctx plumbing — verify).
3. BE-01 rework: F01/F02/F03 subtests failing-before→green (verify they are green at HEAD, not only in the historical patch).
4. Z-F-01/02/03 (BA flow r2): purpose-blind filing guard, signature gate accepting any criterion, NOT_DECLARED visibility — backend side of the fix wave (F1 `0011_criterion_purpose_signature.sql` et al.) — verify at HEAD.
5. A-01 cross-matter receipt replay + org tenancy absence (system audit) — current state at HEAD.
6. Preflight gates (race + PG) — rerun `make check` once on the pinned HEAD and record results.

## 6. Findings, verdict, output

- Finding IDs `BE-R1-01..`, severity `P0` (blocks release/gate, incl. any SQL-injection-adjacent binding violation) / `P1` / `P2` / `P3`. Each finding: location (`file:line`), evidence, impact, proposed fix (**proposal only — do not implement**).
- Verdict: `PASS` | `PASS_WITH_LIMITATIONS` | `CHANGES_REQUIRED` | `BLOCKED`, with explicit limitations list.
- Output: `docs/testing/be-echo-review-20261106-r1/` containing `report.md`, `evidence/`, `commands/`.
- Return format per `docs/ai-sdlc/orchestration-protocol.md`: task ID, actual agent identity, base/head, changed files (expected: none outside the evidence dir), acceptance results, tests run / not run, risks, proposed next status. End with **what was skipped and remaining risk**.

## 7. Governance and evidence rules

- Synthetic data only. No legal matter data, secrets, tokens or credentials in Git, prompts, screenshots or logs.
- Distinguish explicitly: **documented support** vs **local executable presence** vs **successful invocation** vs **completed runtime verification**. Source-reading-only findings are labeled `SOURCE_ONLY`; `EXPLAIN`/runtime-backed findings carry their command + fixture id.
- For every executed check record: tool/version, environment, timestamp, exact command, exit/error, input revision, output location.
- `NOT_RUN` stays `NOT_RUN` — never infer production, provider or cloud behavior from local checks. A local gate pass is not a production behavior claim and never a $0-infrastructure-bill claim.

## 8. Non-goals

No fixes, no dependency upgrades, no schema changes on shared environments, no deploy, no provider/account changes, no Step 03 claims, no re-opening product positioning or the approved P0/P1/P2 baseline. Missing independent/browser/IdP/recovery verification stays open, not inferred.
