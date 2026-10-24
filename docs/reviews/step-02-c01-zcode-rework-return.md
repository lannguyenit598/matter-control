# MC-002-BE-C01-R1 — ZCode Bounded Rework Return (C01-NATIVE corrections)

- Executed by: ZCode (actual desktop app), model GLM-5.3-Flash (`account:zai-start-plan/GLM-5.3`). 2026-10-25 local / evidence UTC 2026-10-24T17:34–17:36Z. Manual dispatch per MC-002-BE-C01-R1.
- Governance: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `task/MC-002-solution-architecture`, intake base `b43dc53`, actual head at execution `13efdef` (governance-only commit containing this prompt's preparation; no conflicting changes). All prior evidence, R01/R02 closure records, and the fd747ae evidence set are preserved unmodified.
- Source: `/tmp/mattercontrol-step022-backend-c01`, branch `task/MC-002-be-c01`, verified **clean at `fd747ae`** before edits. New local commit after corrections: **`<see §3>`** (recorded below after commit). No push/merge. Baselines `/tmp/mattercontrol-step02-backend`, `/tmp/mattercontrol-step021-backend` untouched; old fixtures (`mc002be-c01-pg-20261024T1700Z`, `mc002be-pg-20261024T1454Z`, `mc002be-recheck-pg-20261024T1539Z`) never started or mutated.
- **Proposed status: IN_REVIEW.** No DONE/NATIVE_PASS, no C01/MC-002 closure, no Step 03. C01-NATIVE remains unaccepted until OpenCode reviews the new head; C01-PRODUCT/auth/idempotency/full UoW/Workers/log-policy/product retry conventions remain OPEN/NOT_RUN.

## 1. Finding-by-finding disposition

| Finding | Disposition |
|---|---|
| **F1** (required, test-only) | **DONE.** Added one subtest `cancelled_connect_keeps_the_cause_for_inbound_499` in `internal/adapter/outbound/postgres/map_error_test.go`: `mapError(combinedChain{errs: []error{&pgconn.ConnectError{}, context.Canceled}})` must satisfy both `errors.Is(_, context.Canceled)` and `errors.Is(_, port.ErrUnavailable)`. **Honest record:** this new invariant test **passed immediately** on unchanged correct code (architect-anticipated; no production change, no artificial red). Focused run with full wrappers: UTC 17:34:32→17:34:34Z, exit 0, parent+subtest PASS (`11-f1-focused.*`). It will fail if a future change drops the cause. |
| **F2** (accepted deviation — record) | **RECORDED, unchanged.** Cancellation precedes domain outcomes in `toProblem`; reachable differences are log-only (499 instead of 404/409/422 on a live-cancelled request whose service returned a domain outcome; client receives nothing either way; successful writes are never mapped). Also recorded: the **Echo-renderer background-context vs Huma live-context split is architect-accepted** — Echo v5.4.0 `ContextTimeout` `defer cancel()`s the derived request context before the outer renderer runs, so `newErrorHandler` passes `context.Background()` and detects cancellation chain-only; the live consultation lives solely in `register` (Huma), where the timeout context is still live. Verified independently by OpenCode source review; not a shortcut. |
| **F3** (non-blocking follow-up) | **NOT adopted (out of R1 scope per dispatch).** The terminate test's early-race worst case is a flake/skip, never a false pass (strict 57P01 assertion). `pg_stat_activity`-active barrier remains a future hardening option. |
| **F4** (non-blocking follow-up) | **NOT adopted.** The pool-acquire test intentionally asserts the raw `pool.Acquire` error; row-3 HTTP classification is covered by the ContextTimeout shape test and mapping rows. HTTP pool-exhaustion runtime stays owner-attested (see E-02 correction). |
| **F5** (required, doc) | **DONE.** `docs/api.md` 499 row now reads "A disconnect wins over every other classification." One sentence replaced; nothing else changed. |
| **F6** (required, doc — authorized scope extension) | **DONE.** `.claude/rules/persistence.md`: replaced exactly the stale sentence with the architect-prescribed text (SQLSTATE-first classification rule). **Rules scan report:** searched `.claude/rules/` + `AGENTS.md` + `CLAUDE.md` for `DeadlineExceeded`/`about:blank`/`503`/`57014`/`ErrUnavailable` statements — **no other stale statements found**; nothing else edited. This is a backend-template agent rule, not normative MatterControl architecture/ADR. |
| **F7** (optional) | **NOT included** — kept the diff at exactly F1+F5+F6 per the bounded dispatch. |
| **F8** (evidence item) | **DONE on retained samples.** All synthetic body values used in the fd747ae runtime run (`alice.c01@example.test`, `bob.c01@example.test`, `Alice C01`, `A-Blocked`, `B-Exhausted`, `Cancelled`, `Changed`) plus the fixture password and `postgres://` DSN scheme: **0 occurrences** in both retained application logs (`40-f8-value-check.log`). Scoped to retained samples only; no general logging/privacy guarantee claimed (product A14-policy OPEN). |
| **M1** | **No change (per disposition).** Recorded: M1 not reachable on current routes — `/readyz` discards the `Ready` cause and returns the bare `echo.ErrServiceUnavailable`, so `ContextTimeout` does not wrap it and `toProblem` reaches the probe guard; `/healthz` returns nil/committed output. Probe-byte preservation is scoped to current probe handlers; a hypothetical cause-returning probe handler would map via rows 2 or 3 — a qualification of scope, not a defect. |
| OpenCode E-01 | Counted context acknowledged (below); no action for R1 — reconciliation is the reviewers'/Codex's record. |
| E-02 | **Corrected narrative (this return).** Both HTTP PATCH entries in `44-api2.stdout.log` are ~3.001s request-deadline `DeadlineExceeded` wrapped by Echo as 503; **no SQLSTATE 57014 appears in any HTTP entry** — the `45-pool-exhaustion.log` label "row lock → statement timeout 57014 → 503" and the fd747ae report's A7-HTTP wording are **overstated and are not current claims**. HTTP-level 57014 = **NOT_RUN**; real 57014 remains proven by the PostgreSQL row-lock barrier test (repository level). Original raw files unchanged (historical statements). |
| E-03 | **DONE.** Corrected-head checks executed with full argv/UTC/exit/stdout/stderr wrappers (§2). No previous-head run is cited as certifying the new head. |
| E-04 | **Corrected narrative.** A8 is **real-42P01 repository evidence plus mapping composition** (real 42P01 observed in a fresh unmigrated schema, excluded from `ErrUnavailable`; generic-wrap → 500 covered by unit/golden tests) — **not an HTTP-500 replay**. The earlier "startup guard makes it impossible" claim is **withdrawn**: the guard does not make post-start schema faults impossible (a table dropped after startup would still reach the HTTP path). No HTTP 42P01 sample exists; any future HTTP-42P01 claim needs its own bounded replay. |
| E-05/E-06 | Composition/scope limits accepted as recorded (A9 live-cancel through `register` = composition evidence; A14 = retained-sample scope). |
| E-07 | **Corrected narrative.** The runtime binary was built from a dirty tree before the commit and stamped `d024e3e-dirty`; it is **behavior-attesting, not reproducible commit-stamped evidence** of any commit. Native claims cite source (`fd747ae`/new head) + suite results, not that binary. Any future runtime build must be commit-stamped from its actual head. |
| E-08 | **Followed.** Corrected-head checks used a NEW verified disposable fixture (below); no old fixture started or mutated. |
| E-09 | Acknowledged: fd747ae manual-smoke wrappers were incomplete; no absent metadata invented; the R1 wrappers below are complete. |

## 2. Corrections diff and corrected-head checks (E-03)

**Changed files (exactly three; 16 insertions, 2 deletions):** `internal/adapter/outbound/postgres/map_error_test.go` (+14, F1 subtest), `docs/api.md` (1 line, F5), `.claude/rules/persistence.md` (1 line, F6). No production/config/dependency/schema/migration/retry/auth/idempotency/UoW/endpoint/Workers/product change. Semble recorded unavailable ("MCP dependencies are not installed"); targeted reads used.

**New fixture (verified before DSN assignment):** `mc002be-c01r1-pg-20261024T1734Z`, label `org.mattercontrol.poc=mc002be-c01-r1`, network `mc002be-c01r1-net` (new), postgres:18-alpine digest `sha256:77f585114c32…`, 512 MiB/1 CPU/128 pids, `127.0.0.1:15458` (verified unused), anonymous volume, fresh random credential (never in argv/logs/tracing/env dumps, not reused). Verified healthy on first poll, `current_database=mc002be_c01_r1`, `current_user=mc002bec01r1`, public tables = 0 before `TEST_DATABASE_URL` assignment. Manifest: `21-fixture-manifest.log`.

**Checks (full wrappers retained):**

| Command (verbatim form) | UTC | Exit | Result |
|---|---|---|---|
| `go test ./internal/adapter/outbound/postgres/ -run TestMapError_UnavailableClassification/cancelled_connect_keeps_the_cause_for_inbound_499 -count=1 -v` | 17:34:32→34Z | **0** | parent+subtest PASS (new invariant; immediate pass expected per F1) |
| `TEST_DATABASE_URL=<private> rtk proxy make check` (fixture DSN supplied privately; no tracing) | 17:35:02→17Z | **0** | sqlc-check, gofmt, tidy-diff, golangci-lint **0 issues**, race suite: 11 packages ok, PostgreSQL tests ran |
| `TEST_DATABASE_URL=<private> rtk proxy go test -race -count=1 -json ./...` | 17:35:24→34Z | **0** | 1193 events, 0 invalid lines, stderr empty |

**Per-test enumeration (from `36-json-parse-summary.txt`):** **279 named terminal pass events (parents+subtests — NOT 279 independent leaf tests), 0 fail, 0 named skips**; 11 packages with tests all pass (httpapi 96, postgres 85 incl. the new F1 subtest, app 20, service 15, outbox 18, kafka 10, memory 10, domain 14, config 6, observability 3, system 2); **5 package-level skips = no-test-files packages** (cmd/userapi, pgtest, sqlcgen, repotest, port), listed separately from test skips; named skipped tests: **none**. This run certifies only the corrected head.

## 3. Commit and artifacts

- Local commit on `task/MC-002-be-c01` after `fd747ae`: **`52b60a4617081c41b949f2242e1784238c170f75`** (`52b60a4`, "test/docs: apply bounded C01 review corrections (F1, F5, F6)"; 3 files, +16/−2; not pushed). Tree clean after commit.
- Raw evidence: `/tmp/mc002be-c01-r1/` (14 hashed payloads + manifest lists; `49-sha256.txt`), exported byte-identically to [docs/testing/step-02-c01-r1/](../testing/step-02-c01-r1/49-sha256.txt) (15 files incl. export hash list `49b-gov-export-hashes.txt`). fd747ae evidence `/tmp/mc002be-c01/` and `docs/testing/step-02-c01/` retained unchanged.
- Redaction: corrected scan (an initial scan attempt was invalid — the credential variable was unset between shell invocations, so grep used an empty pattern; discarded and redone in one invocation) — **0** password occurrences across the R1 evidence set; only benign REDACTED-form DSN line in the fixture manifest.
- Resource disposition: R1 fixture `mc002be-c01r1-pg-20261024T1734Z` stopped (Exited 0) and retained with its anonymous volume for OpenCode; network retained; no pruning/deletion; no owned process left running; no listeners on 15458 (verified at cleanup; 18095/18096 already closed at fd747ae cleanup). Owned processes this round: none beyond the fixture.

## 4. Acceptance summary

| Item | Result |
|---|---|
| F1 subtest added, focused run green, honest immediate-pass recorded | **PASS** |
| F5 docs/api.md 499 wording | **PASS** |
| F6 persistence.md sentence replaced (authorized); rules scan: no other stale statements | **PASS** |
| F2/M1 recorded unchanged (architect-accepted / not reachable) | **PASS** (record) |
| F8 value check on retained logs (all run values + password/DSN, counts only) | **PASS** (scoped) |
| E-03 corrected-head `make check` | **PASS** (exit 0) |
| E-03 corrected-head JSON run | **PASS** (279/0/0 named; skips enumerated) |
| Evidence-narrative corrections E-02/E-04/E-07 + count/export accounting | **DONE in this return** (raw originals preserved) |
| New HTTP smoke | **NOT_RUN — intentionally**: evidence review requires no A1/A2/A3/A9/A14 replay solely for reassurance; no genuinely new fault was introduced by F1/F5/F6 |
| F3/F4/F7 hardening | **NOT adopted** (non-blocking follow-ups per dispatch) |
| C01-PRODUCT items | **OPEN / NOT_RUN** (unchanged) |

**Proposed status: IN_REVIEW** — OpenCode to review the new head/diff/tests; Claude to review any deviation (none introduced beyond the three authorized items). MC-002 stays OPEN; Architecture Approval Gate NOT_PASSED; Step03 NOT_STARTED.
