# MC-002-BE-CORRECTIONS-RECHECK — Actual OpenCode documentary recheck

**Scope honored:** documents-only verdict on M01..M05 and the actual Claude disposition. No tools, no replay, no hash computation, no R01/R02 rerun claims. Reviewer: actual OpenCode, packet-only.

## Correction verdict: **M01–M05 CORRECTIONS_VERIFIED (documentary)**

| ID | OpenCode original finding | Snapshot state | Disposition |
|---|---|---|---|
| M01 | Report said "13 packages ok"; logs show 11 ok + 5 no-test | §4.4 now reads "11 packages ok; 5 packages have no test files"; `checks.json` `test_package_counts` = 11/5 both runs; intake repeats "not 13" | **VERIFIED.** Also correctly retained as *state*: per-test skips stay UNVERIFIED pending R01 |
| M02 | "runs 2 and 3 both no-op" asserted with only one retained no-op log | §4.3 table now shows runs 1–2 only, run 2 labeled "one retained no-op rerun"; intake: "Unretained third-run claim removed" | **VERIFIED.** The minimal-correction alternative ("drop the claim *or* retain its log") was satisfied by dropping the claim. Caveat below |
| M03 | Blanket "redacted in all retained logs" false for the original file; wording + explicit disposition needed | §3/§5 now state the incident precisely (original shell-trace credential; exported copy *and* original task log sanitized after original-hash guard; `source_sha256` / `stored_sha256` / `source_sha256_after_local_redaction` in `manifest.json`); intake documents do-not-reuse for retained container credential; handoff says "Never reuse that credential" | **VERIFIED.** Note: disposition implemented as in-place sanitization rather than OpenCode's suggested owner-destruction — divergent but strictly sufficient since the secret is provably gone (hash triplet) and the recheck input explicitly waives deletion. Precise wording achieved; no blanket claim remains |
| M04 | Six unlabeled bytes cited for three goose/users claims | §4.6 now: "Log62 numbers 7/6/2 are **interpreted** as Goose row count/max version/User count from owner context; original SQL labels not retained; Raw32 separately lists applied rows 0..6" | **VERIFIED.** Annotation route taken (no recapture), correctly qualified as interpretation, cross-anchored to Raw32 |
| M05 | Final `Health.Status: healthy` narrative contradicts `unhealthy` inspection | §7 now: terminal unhealthy tied to stopped/exited-0 snapshot, probes exit-0, FailingStreak 0, "Initial healthy-at-start is a separate timestamp; no exact cause inferred"; §4.2 keeps start-state healthy | **VERIFIED.** Slightly more conservative than "post-stop artifact" — no unproven causal claim is made, which is acceptable |

**Minor residual nit (non-blocking):** §4.8 still repeats the unqualified shorthand "only `context.DeadlineExceeded` → 503" before §8 supplies the Echo-HTTPError qualification. `backend-audit.md` repeats §-style phrasing without overbroad wording. This is an internal cross-reference nit, not a correction failure.

## Claude disposition: **ACTUAL_RETURN_VERIFIED, correctly bounded**

- **Actual, not escalation:** intake records session `d4633b32-7d45-4576-bd6b-22c73c716cc1`, exit 0, as the first actual architect return; the earlier "escalated" wording is explicitly superseded. C01 **CONFIRMED** with the observed/fact/contract table (500+`about:blank`, no `retryAfter` vs 503 `/problems/unavailable`).
- **Classification is correctly split:** native H5 baseline = PASS-with-finding unaffected; future product-conformance = **NON-CONFORMANT, blocking**, no waiver. PASS_WITH_LIMITATIONS for template characterization is not degraded and not upgraded.
- **No normative change:** acknowledged everywhere — catalogue and ADR-002 §1a already cover the obligation; report, intake and audit all state no ADR/contract/source change.
- **Advisory content properly fenced:** the hexagonal remediation outline and acceptance cases A1–A15 are marked advisory and **all NOT_RUN**; the intake explicitly states this is not permission for a blanket 500→503 conversion or new product code.
- **Optional items not selected:** `retryAfter` unit/range, `Retry-After` header, outcom-unknown note — all pending architecture approval, "remain unselected" in intake. Echo-status shorthand ("only deadline can ever yield 503") is qualified as the examined core-error branch, not an exhaustive theorem; diagnostic-log commentary is qualified as sample-scoped, not a logging policy.
- **Small state-phrase divergence (non-blocking):** Claude's own return says "remains IN_REVIEW pending OpenCode QA," while intake sets `EVIDENCE_REWORK_REQUIRED_R01_R02`. Intake's framing is the stricter and correct owner-state account; resumes IN_REVIEW only after recheck output + new review.

## R01/R02 status: **OPEN — NOT_RUN / REWORK_REQUIRED (unchanged)**

- Both mandatory owner rechecks are explicitly NOT_RUN by Codex; no rerun is claimed anywhere in the packet.
- Handoff `MC-002-ZCODE-RECHECK-PROMPT.md` is complete and consistent with my original minimal corrections: fresh uniquely-named capped container + pinned digest, **no reuse/mutation of the retained review DB**, no shell tracing/DSN logging, `-json` race run with per-package/test pass/fail/skip enumeration and reasons (absence of text ≠ zero skips), three separated R02 invocations with clean env, argv/UTC/stdout/stderr/exit-1 capture, optional fourth migrate-no-DSN pair, bounded timeout, redaction-before-handoff, new evidence under `docs/testing/step-02-backend-recheck/`, no DONE self-award.
- Full acceptance of R01/R02 acceptance lines remains gated on that output plus an independent OpenCode look; nothing here proposes Step 03, architecture approval, PoC acceptance, PO/cloud/cost decisions, or MC-002 DONE.

**Remaining work, unambiguous:** (1) ZCode to execute R01 and R02 via the prepared dispatch; (2) OpenCode to review the new evidence; (3) C01 stays a registered future implementation obligation under the unchanged contract (fix work is a separate assignment); (4) advisory A1–A15 remain NOT_RUN; (5) optional numeric clarifications remain unselected.

*Skipped:* no runtime replay, no hash recomputation, no recheck execution, no PO/cost approval. *Residual risk:* R01/R02 evidence gaps persist by design until owner reruns; document-text nit in §4.8 noted above.
