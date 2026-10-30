# MC-BE-01-R1 — independent review received

Date:2026-10-26, Asia/Ho_Chi_Minh. Intake owner: Local Codex. Priority:P0. Requirement linkage: MC-BE-01, FR-001/008/018/020 and BE01-T01..T10. Actual reviewer: OpenCode harness session, route `opencode/glm-5.3-flash-free`, version NOT_RECORDED. Identity and independence are reviewer self-reported, consistent with ZCode authorship; no new Codex provider invocation or live version probe is claimed.

## Verdict and reviewed revision

**SOURCE: PASS_WITH_LIMITATIONS. EVIDENCE: PASS_WITH_LIMITATIONS. No new blocking finding.** Actual human-delivered return supersedes the earlier READY_NOT_DISPATCHED / independent-review-pending labels for this exact packet only. Overall MC-BE-01 remains **IN_REVIEW**, pending the allowed source commit and completion evidence.

Reviewed source is backend HEAD `136eae6ad403ae3ede797faf6a0d6179c3b95685` **plus** nine-file uncommitted patch SHA256 `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`. HEAD alone remains the old implementation. Codex rechecked live HEAD/patch and found they still match the reviewed snapshot.

Original review-manifest SHA256 `84ec58bb873135d5730d5bb33390efc3c72d164eb075f73a8c27e6138dff0719`; Codex reverified all37stored payloads, their expanded hashes and45archive members. Reviewer reports the same37/37 and45/45 checks. Raw human return13731bytes, SHA256 `50cd5832cf8d0678cfa84fde5f7d16928af0aec76f52182b16c3b89bdb7c6ca0`, preserved losslessly under [review evidence](../testing/be01-r1-opencode-review/intake.json). No earlier intake, packet, owner log or hash manifest was rewritten.

## Disposition

| Item | Independent result | Codex disposition |
|---|---|---|
| BE01-F01, saved-scope and every represented-Matter authorization | RESOLVED: source order and retained service/shared/PG regressions support authority before age/hash/body; no new locking blocker | CLOSED for the exact reviewed source/evidence snapshot |
| BE01-F02, unsupported due boundary and pending-boundary preservation | RESOLVED: equality is due, refusal aborts mutation, future boundary remains pending, replay does not advance fence | CLOSED for the exact reviewed source/evidence snapshot |
| BE01-F03, membership error propagation | RESOLVED: only NotFound becomes absence; wrapped failures propagate on create/read/replay | CLOSED for the exact reviewed source/evidence snapshot |
| Original bounded BE01 spine, BE01-T01..T10 | Reviewed with limitations; no new blocking finding; owner gate evidence retained | Source/evidence review complete; not independently replayed runtime or product approval |
| Makefile two-bundle sqlc generation/check exception | Accepted as minimal and scope-consistent | Reviewer confirmation recorded; no rework required |
| Nullable purge_after / zero key-age test policy | Acceptable bounded injected/test seams | No BE01 blocker; remain unavailable as implicitly approved product defaults |

No source correction is assigned for non-blocking observations. O1 records unspecified future temporal-refusal audit policy: the existing no-side-effect refusal matches this slice's contract. O2 records missing membership context-cancellation fault injection. O3 is cosmetic. O4 is the already documented race-summary start-time erratum. Preserve them as future scope/coverage notes; do not reopen BE01 or request another author/reviewer round solely for these notes.

## Evidence boundaries

Reviewer inspected source and retained logs, not the live worktree, and ran no Go/lint/sqlc/HTTP/PG tests. The full makecheck/race/PG runs are owner-executed; the three independent service-double overlay probes were actually executed by Codex. Neither is an OpenCode runtime replay.

Retained race:1862events,441namedpass/0fail/1intentionalnamedskip,15test-bearing+5no-test packages; parent/subtests included. Makecheck owner exit0; historical E01 argv/UTC gaps, inert-domain-sentinel failing-before tree and missing PG failing-before start are preserved. A summary phrase that all runtime evidence is single-owner must be read as the full PG/gate runs: Codex's three separate service probes remain distinctly attributed. Reviewer Python/RTK versions and OpenCode version were not recorded. No retroactive reconstruction or reassurance rerun is necessary.

## Remaining commit gate

The foreign Mimosa finding is **not cleared by this review**. OpenCode assessed the cited expression/provenance, not an actual scanner recheck: the flagged line serializes a runtime-generated password and is a plausible narrow false positive. This is not a project-wide security verdict or permission to override the gate.

Codex only read existing project security-artifact metadata/status. The task-review artifact observed has partial coverage and incomplete baseline capture; an unrelated complete-coverage file-write hook result does not authorize a source commit. No scanner state/config/ignore/baseline was edited and no commit retry or alternate route was used. The claim that every possible project commit remains blocked is owner/reviewer-reported, not established by a new commit attempt here.

Next: actual source owner ZCode uses the [commit-only handoff](../implementation/handoffs/MC-BE-01-R1-COMMIT-ZCODE-PROMPT.md). First obtain an ordinary allowed result through the scanner's documented disposition/rescan mechanism in the enforcing session. If that mechanism is unavailable or still refuses, return BLOCKED with the exact evidence; do not switch tool/host/context to escape it. Once permitted, commit only the unchanged nine-file reviewed patch and return parent/head/file hashes. Codex can verify equivalence without another full test run or review if no source changed and the enforcing tool imposes no additional check.

BE02 preparation can use this scoped source/evidence acceptance, but its input remains dirty/pending commit. It must not silently substitute136eae6 as an accepted corrected base. Its implementation, identity/retry/retention and representation decisions remain separate. No F08/F10, INT-A51results, C01-PRODUCT, MC002/MC003A, architecture/STEP03B, Cloudflare/cost/recovery or release gate is promoted.

Skipped: test replay, source edits, agent dispatch, scanner mutation and commits. Remaining risk: no corrected source commit or cleared commit gate exists; source/evidence PASS does not prove product/production readiness.
