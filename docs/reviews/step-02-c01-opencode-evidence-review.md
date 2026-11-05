# MC-002-BE-C01 — OpenCode Independent Evidence Review (packet-only, fd747ae)

**Reviewer:** OpenCode, independent evidence review. I received only the supplied snapshot packet. I ran no tools, no MCP, no runtime, no hash recomputation; hash equality stays Codex's finding, and I attribute nothing to it. Source review is separate (actual Claude's CHANGES_REQUIRED stands and governs); this is exact logs/metadata/acceptance-claim review. OpenCode performed no replay.

## Independent enumeration

From the transferred selection (`owner-terminal-and-fault-events.jsonl`, 315 claimed lines):

- **Visible named terminal passes: 271, 0 fail, 0 named skip.** Per-package recount reconciles **exactly** for 10 of 11 packages: postgres **84** (faults 7, MapError 34 = parent+33 subtests, outbox 14, contract 22, canceled-context/statement-timeout/pending-migrations 3, pool 3 — plus diffs and migrations), app 20, service 15, outbox 18, kafka 10, memory 10, domain 14, config 6, observability 3, system 2 = 182. **httpapi shows 89 named passes vs the parsed summary's 96** — a 7-event shortfall in the bytes I received (271 named + 5 no-test skips + 11 package passes + 16 fault-output lines = 303 of 315 lines visible).
- Package results: **11 pass + 5 no-test-file skips** visible (cmd/userapi, pgtest, sqlcgen, repotest, port). No `Action:"fail"` anywhere visible; named skips none.
- Clock coherence: JSONL timestamps 00:05:42.544–00:05:53.196 +07:00 match `33-json-meta` 17:05:42–53 UTC exactly, both `-race -count=1`, exit 0 — internally coherent.
- Real-fault outputs enumerated: connection refusal (real `*pgconn.ConnectError`, then-classified unavailable), wrong password (real 28P01, PgError-first, ConnectError also present, not-unavailable), missing database (real 3D000, not-unavailable), terminated backend (real 57P01, ConnectError false, unavailable), missing table (real 42P01, not-unavailable, fresh unmigrated schema), pool-acquire (raw `context.deadlineExceededError`). RED is genuine failing-assertion evidence for postgres mapError (57014 previously DeadlineExceeded-wrapped; combined ConnectError+PgError chains previously generic; wrapped-depth failure; a bare `ConnectError` panic path in the pre-change code — positive signal the new guard removes), plus an httpapi **compile**-red from API introduction (correctly characterized, not a compiled failing assertion).

**E-01 (required, in-governance check, not a rerun):** reconcile the 89-vs-96 httpapi count (and ~5 unshown fault-output lines) against the retained `34-gotest.stdout.json` and `owner-event-selection.json` before any NATIVE_PASS. Most likely packet-transmission truncation of 7 httpapi pass events, but the summary number is currently unverifiable from what I received. One file read; no DB, no Docker, no source change.

## Cross-checked acceptance claims

- **A1 (outage, five methods):** five 503 bodies in `42-outage.log` with `/problems/unavailable`, fixed detail, `retryAfter:1`, no driver text in **bodies**; driver cause appears only in the **log** `error` attribute (real ConnectError chains). Server log corroborates 6×503 with request_ids. Consistent.
- **A2-native:** existing vs nonexistent GET bodies otherwise byte-identical except `instance` (equal Content-Length 197, differing request ids naturally). Consistent.
- **A3:** `/healthz` 200 `{"status":"ok"}`, `/readyz` 503 legacy bytes (`about:blank`, no retryAfter) exactly as asserted in `errors_test.go`; recovery: continuous api1 stdout shows **one** process start at 00:06:51 and shutdown at 00:09:04 — no restart through the outage window, `readyz`/`healthz` 200 and GET 200 after. "Outage writes not applied is UNKNOWN; none were accepted" is honest.
- **A9:** curl exit 28 at ~2002ms (`46-cancel.out`) vs server WARN `status:499` latency 2.0026s, request_id present, no error field — matches the 499-not-logged-as-error semantics and unit precedence rows (cancellation, cancelled-ctx + unavailable/deadline chains, cancellation-inside-chain).
- **A7-HTTP contradiction confirmed:** `44-api2.stdout.log` shows **both** PATCHes at ≈3.001s with Echo-rendered `timeout: context deadline exceeded` → 503; **no 57014 in any HTTP entry**. With statement_timeout 4s vs a 3s request deadline, HTTP-level 57014 was structurally unreachable in that harness. The `45-pool-exhaustion.log` header ("row lock → statement timeout 57014") and the owner-report A7-HTTP row are **overstated**. 57014→`ErrUnavailable` is proven only at repository level (real-fault tests + unit rows). The wire outcomes (503, row unchanged — version 1 after both) and reqA/reqB↔server-log request_id/body corroboration stand.
- **A14-native:** retained-log checks are scoped but real: 0 password/DSN-form credentials, both known synthetic body values (alice.c01@example.test, "Alice C01") absent from both captured stdouts; request value leakage is implausible because logged error text is PgError/ConnectError text only. Operational `user=… database=… host:port` metadata is visibly present and was previously dispositioned; the REDACTED-form DSN line in `49`/`48` is benign. Status counts in `log-value-checks.json` (api1 13 events/9 request_ids/6×503; api2 7 events/2×503) match the raw files I can see.
- **Exports:** 19 top-level files = 17 payloads + 2 hash lists, all `matches_tmp_original`; master manifest 32 entries with 15 unexported; selected omitted RED/runtime/start logs copied byte-identically into supplemental evidence — internally coherent. I did not recompute hashes.

## Evidence findings and scoped actions

- **E-02 (required, documentary only):** relabel `45-pool-exhaustion.log` claim and owner-report A7-HTTP row: HTTP-level evidence shows request-deadline `DeadlineExceeded`→Echo 503 at ≈3.001s for both PATCHes; **HTTP 57014 path = NOT_RUN**; 57014 stays proven at PostgreSQL/unit level only. No rerun of that rack now; if any later slice ever claims HTTP-57014, require a fresh bounded replay with capture-complete wrappers.
- **E-03 (required, already authorized):** corrected-head remediation per actual Claude (F1 test, F5 docs wording, F6 rule sentence) followed by `make check` and `go test -race -json` on the new head, with **full argv/UTC/exit wrappers retained** this time. OpenCode reviews the corrected head, not fd747ae. This is the only execution rerun required — no full R01/R02, baseline/restore, or fixture redrive, and none merely for reassurance.
- **E-04 (required, documentary):** record A8 as composition evidence: real fresh-schema 42P01 → generic 500, tested; no HTTP 42P01 sample; the "startup guard makes it impossible" claim is withdrawn — post-startup schema drift could still reach the HTTP path. If later slices claim HTTP 42P01, that needs its own bounded replay.
- **E-05 (nonblocking):** A9/live-cancel through `register` is composition evidence (unit rows + by-construction live ctx + attested runtime). Acceptable for native qualification; the optional HTTP-level recorder test stays optional.
- **E-06 (nonblocking):** A14 scope limit recorded: retained-sample checks + owner-asserted exact-secret scan only; no whole-log-store or general logger guarantee; product A14-policy remains OPEN/deferred.
- **E-07 (nonblocking):** runtime binary is a dirty-tree pre-commit build (`d024e3e-dirty`, behavior-attesting, not a reproducible fd747ae artifact). Native PASS must cite source fd747ae + suite, not the binary. Any future runtime build must be commit-stamped from its actual head.
- **E-08 (required going forward):** future runtime work uses a **fresh verified disposable DB** (created, verified empty+healthy, used, disposed/retained per instructions); the retained `mc002be-c01-pg-20261024T1700Z` fixture and its volume are passive review evidence and must never be started or mutated. Host-state inspection (Exited 0, no listeners, older fixtures' timestamps matching prior evidence) corroborates disposition as observed.
- **E-09 (nonblocking):** intake finding #4 stands as a characteristic limit: start/golden/curl wrappers incomplete for the owner's manual smokes; no absent metadata invented; the greener middle interval (12/13/15) is owner-attested and superseded by the retained run-6 + JSON run.

## Acceptance decision

**Documentary qualification is sufficient for A1, A2-native, A3, A9, A14-native** — with E-02/E-04 corrections and the recorded composition/scope limits. No narrow owner runtime replay is now required for these; E-03's corrected-head checks satisfy the "rechecked head" need without expanding scope. Native wire-shape certainty rests on contract goldens, memory parity, probes, and real-fault tests, not on re-running smokes.

## Verdict

**PASS_WITH_LIMITATIONS (evidence review of fd747ae only).** The retained evidence supports native qualification once: E-01 reconciliation, E-02/E-04 relabels, E-03 corrected-head checks (including Claude's F1/F5/F6) complete on the new head, which OpenCode then reviews. No NATIVE_PASS before the corrected head plus those checks. Source/architecture verdict and F2/Echo-context adjudication remain Claude Code's; I add no production requirement.

**Status unchanged:** IN_REVIEW / C01-NATIVE_NOT_YET_ACCEPTED / C01-PRODUCT_OPEN; R01, R02 CLOSED; MC-002 OPEN; no Step 03, integration, Cloudflare, or cost closure. No approval or QA execution was invented.

**What was skipped:** no tools, runtime, replay, or hash recomputation; no source review (separate track); full 1189-line JSONL not received — insight 7 httpapi events unverified beyond the summary.

**Remaining risk:** E-01 could resolve to a real count discrepancy in the exported JSONL; native acceptance still leans on owner-attested composition for A3/A9 argv gaps; product cases (A4/A5/A6/A11-product/A12/A14-policy/A15) and `retryAfter`/`Retry-After` decisions remain open.
