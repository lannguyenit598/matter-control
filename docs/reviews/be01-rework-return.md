# MC-BE-01-R1 — scoped ZCode rework return (BE01-F01/F02/F03)

**Owner & Role:** Actual ZCode (backend engineering owner; interactive session, no subagent) · **Model/Provider:** account:zai-start-plan/GLM-5.3 via Z.AI, currently configured route, unchanged · **UTC window:** 2026-10-25T17:45–18:40Z (host +07) · **Authority:** the human-delivered MC-BE-01-R1 rework assignment on the already-authorized bounded BE01 local slice; this is owner execution, not independent review.

**Proposed status: IN_REVIEW (rework complete and evidenced; commit step recorded as blocked — see "Commit gate block").** No self-approval; a reviewer distinct from ZCode must validate the diff and evidence. BE02/F-08/F-10/INT-A and overall MC-002/MC-003A/release gates unchanged.

## Scope and identities

- Worktree `/private/tmp/mattercontrol-backend-be01`, branch `codex/mc-be-01`; intake head `136eae6ad403ae3ede797faf6a0d6179c3b95685` verified clean at session start; base lineage `52b60a4` untouched; no reset/recreate/merge/push; no governance file edits; no dependency/module changes; Makefile unchanged (the original two-bundle codegen change remains as committed at 136eae6 for reviewer confirmation).
- Semble attempted first per local rules: its index does not cover the BE01 worktree (returned unrelated governance design docs); recorded, then targeted reads were used.
- Final state: **HEAD still 136eae6 with the rework as a complete uncommitted working-tree diff — 9 files, +929/−15** (`30-rework.patch`, `31-commit-message.txt`); `git describe` = `136eae6-dirty`. Reason below.

## Changed paths (exact)

| Path | Change |
|---|---|
| `internal/core/domain/matter/access.go` | +`ErrBoundaryDue` sentinel; +`MatterHeader.BoundaryDueAt(now)` pure predicate (due = `!After(tCmd)`, fail-closed at equality) |
| `internal/core/service/matter_service.go` | F01 `authorizeReceiptScope` in the replay path; F02 boundary gate before mutation; F03 error-propagating `accessFrom` (signature change) and both call sites |
| `internal/core/service/matter_service_rework_test.go` | NEW: probe-parity + contract-variant regressions (10 tests / 17 subtests) |
| `internal/adapter/outbound/postgres/queries_mattercontrol/matter.sql` | `CompleteMatter` no longer clears `next_boundary_at` |
| `internal/adapter/outbound/postgres/mcsqlc/matter.sql.go` | regenerated with the pinned sqlc v1.31.1 via the existing Makefile job (SQL body + comment only; params unchanged) |
| `internal/adapter/outbound/postgres/matter_test.go` | pgWorld boundary World methods; `failingTx`/`failingSnapshot` membership-fault steps |
| `internal/adapter/outbound/postgres/matter_rework_test.go` | NEW: real-PG row-level header-integrity regressions (3 tests) |
| `internal/adapter/outbound/repotest/mattercontrol/contract.go` | shared suite cases: receipt-scope authorization (incl. cross-workspace/demotion/revocation), boundary fail-closed/preserved/replay, membership-failure distinctness — run against BOTH adapters |
| `internal/adapter/outbound/repotest/mattercontrol/memory.go` | World interface + memory impls for `SetElapsedBoundary`/`SetFutureBoundary`/`NextBoundary`; membership fault steps; `ErrInjected` |

## F01 — replay authorizes the saved scope and every represented matter

The replay path previously authorized only the command target. Now, inside the same locked transaction and before key-age/hash comparison or any stored-body exposure, the service requires an ACTIVE workspace membership in the receipt's saved workspace and, for EVERY matter in `Receipt.Matters` (sorted for determinism), an ACTIVE matter membership with any role (`policy.DecideReadRequirement`). Loss of any authority is a uniform, audit-committed (`DENIED_HIDDEN`) `port.ErrNotFound`; the extra membership reads are FOR SHARE (share/share compatible, no matter-row locks), so the documented lock order is preserved. Not solved by body shaping and no represented matter is bypassed. Evidence: shared suite `receipt replay authorizes every represented matter/*` (authorized cross-matter reuse stays `ErrIdempotencyKeyReuse`; revoked represented matter → uniform NotFound incl. same-hash targeting of A; cross-workspace saved-scope loss → NotFound; demotion to VIEWER keeps the legitimate replay) on memory double AND real PG; service-package probe-parity tests; failing-before reproductions of the key-reuse leak.

## F02 — fail closed on an unsupported due boundary

After create authorization and before key-age/mutation, `header.BoundaryDueAt(tCmd)` refuses with `matter.ErrBoundaryDue`; the returned error aborts the transaction, leaving header, history, receipts, fence and the pending boundary itself untouched. A boundary exactly at `t_cmd` counts as due (fail-closed). The SQL `CompleteMatter` no longer sets `next_boundary_at = NULL`: after the gate any remaining boundary is strictly future and must stay pending — this also fixes the adapter divergence (the memory double always preserved it; PG cleared it — proven failing-before). Future (not-due) boundaries remain safe and now survive a successful create. Replay performs no mutation and no fence advancement, so explicit replay semantics are unchanged and a pending boundary neither blocks nor is cleared by a replay (pinned by tests on both adapters). No temporal engine, defaults, policy numbers or purge job were invented.

## F03 — only ErrNotFound is absence

`accessFrom` now returns `(policy.Access, error)`: any membership lookup failure other than `port.ErrNotFound` propagates with its wrapped cause on create, replay and read, instead of being converted into missing facts (false not-found). Storage failures abort the transaction (create/replay) or surface as unavailable (read); no fake empty/not-found results. The native C01 classifier is untouched.

## Regression and gate evidence

All evidence: `/private/tmp/mc-be01-evidence/r1/` (manifest `50-hashes.txt`, 24 files). Fixture credentials were sourced privately per-call from `/tmp/mc-be01-credentials.env` (0600); no value in argv/logs/evidence (`49-redaction-scan.txt`: 0 credential/DSN/token values; only the file name and the quoted code-shape in the gate-block record).

- **Failing-before on 136eae6 behavior** (behavioral fixes stashed; the inert domain sentinel was kept unstashed so the new tests compile — recorded honestly in `23-final-provenance.txt`): service package 10 failing subtests (`10-*`, exit 1, 18:24:56Z); memory contract suite 10 failing subtests (`11-*`, exit 1); **real-PG contract suite 12 failing subtests** (`12-*`, exit 1, 18:25:41Z) — including the PG-only `not-due boundary preserved` divergence. Expectations were written from the contract, not weakened to the implementation.
- **Corrected head:** targeted service run exit 0 (`13-*`), then the full gate: **`make check` exit 0** at 2026-10-25T18:26:15–36Z (sqlc-check, gofmt clean, `go mod tidy -diff`, golangci-lint v2.14.0, race suite with `TEST_DATABASE_URL` + `MC_TEST_DATABASE_URL` against the two verified fixtures) — 15 ok packages, 5 no-test (`20-*`).
- **`go test -race -count=1 -json ./...` exit 0** at 18:26:56–18:27:05Z: 1862 events, **441 named passes / 0 fails / 1 intentional named skip** (`pgtest TestFreshSchemaDSNFrom_SkipsWithoutEnv/skip`), 15 test-bearing + 5 no-test packages; +50 vs the retained 391-pass owner run — the delta is exactly the rework regression suite (`21-race-full.json`, parsed `22-race-inventory.json`; this session's run has its own UTC/exit/stdout/stderr, unlike the historical E01 gap, which remains honestly absent and was not fabricated).
- **Fixtures reused after immediate read-only verification** (17:56Z): native `ef94b100…` (mc-be01-pg-native, 127.0.0.1:55433) and product `a61a7912…` (mc-be01-pg-product, 127.0.0.1:55434), both running, image `postgres@sha256:898c60cb…`, 512MiB/1CPU/128pids, loopback-only, labels `mc-be01-fixture=native|product` / `mc-be01-owner=zcode-be01`. Per-test fresh-schema lifecycle only; no current-empty assumption; **resource disposition: both fixtures retained running** for reviewer replay; no container/volume stop/remove/prune; no other DB/volume/INT-A lifecycle touched (the concurrently running INT-A run was not disturbed).

## Commit gate block

The single remaining step — `git commit` with the prepared message — is **blocked by the workstation Mimosa git-gate** (PreToolUse): every commit-shaped command triggers a project-wide L3 scan of the registered governance repository, which force-blocks on a pre-existing `[high] 硬编码凭据` finding at `docs/testing/inta-returns/environment/env-intamvnmoems3pd/provision-command.py:46` — Codex's committed INT-A ENV evidence (governance commit 7cdde53), foreign to this diff. Read-only diagnosis (in `40-commit-gate-block.txt`): the flagged line is a credential-WRITING expression whose password is generated at runtime (`secrets.token_hex(32)`); the line contains no literal secret (long-literal count 0) — a heuristic false positive on reviewed evidence. Per the assignment I did not modify Codex's evidence, did not bypass/disable/route around the hook, and touched no security-tool state. The hook engine is a sealed payload; its scope could not be re-pointed at the BE01 repository. **Recovery is one command for the orchestrator/reviewer once the finding is dispositioned by its owner:** stage the working tree and commit with `31-commit-message.txt`; no test re-execution is required (reviewers may of course rerun the recorded gate commands).

## Policy deviations (unchanged, not promoted)

Nullable `purge_after` and the zero-value key-age policy remain exactly as reviewed at 136eae6: unapproved seams, not product defaults; nothing in this rework promotes them. They stay compatible with injected test policy and imply no production composition; if the reviewer requires a material contract change, the exact choice must come from the owner review — none was made here.

**Skipped:** the physical commit (gate-blocked, above), any BE02/HTTP/auth work, F-08/F-10, native baseline replays (the accepted C01/INT-A checkouts were not rerun), OpenCode invocation (none implied). **Remaining risks/limits:** the failing-before service run used the inert-domain-sentinel tree (documented); the PG failing-before meta file lacks an explicit start timestamp (ended 18:25:41Z, bounded by adjacent runs); owner assertions are not independent QA — a non-author reviewer must validate the diff, the evidence, and then the commit; the Mimosa gate finding needs its owner's disposition before any commit in this project can succeed.
