# MC-002-BE-C01 — Intake and Verification Contract

Codex PM/BA intake, 2026-10-24. Governance base `f0f82a6cb9e7372e5917196dbbf81ca973de5686`, branch `task/MC-002-solution-architecture`. Authority: [Step02.2 request](../ai-sdlc/step-02-2-request.md), [original actual Claude disposition](../reviews/step-02-backend-claude-disposition.md), [actual scoped clarification](../reviews/step-02-c01-claude-clarification.md). This is an implementation assignment, not an implementation result.

- Task: `MC-002-BE-C01`; executable slice `C01-NATIVE`; priority P0 for this technical gate.
- Implementation owner: actual ZCode. Independent implementation reviewer: actual OpenCode. Architecture deviations: actual Claude Code; material policy/topology decisions: PO.
- Status: **PREPARED / WAITING_MANUAL_DISPATCH**. No ZCode acknowledgement, source diff or C01 test run yet. Overall C01/R-029 remains OPEN.
- Requirements: NFR-002/003/008/009/012; AC-153/156, SRS unavailable-versus-empty rule; implementation basis API catalogue 503 and ADR-002 §1a. These product criteria remain unimplemented unless separately proven.
- Source: `/tmp/mattercontrol-step021-backend`, clean at `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`; binary remains `ff973fb7883c16898e5cfef6bb4e80df0252abc17ff5235c52fdc7ebabd9ad03`. Preserve this worktree/binary as baseline evidence. New implementation target: `/tmp/mattercontrol-step022-backend-c01`, branch `task/MC-002-be-c01`, created only after exact-path/branch absence checks. No overwrite/reset.
- Inputs/outputs/scope/tests/compatibility and structured return: [complete ZCode contract](../implementation/handoffs/MC-002-BE-C01-ZCODE-PROMPT.md).

## Source applicability and affected path

Current source was inspected read-only after Semble search. `UserRepository.{Create,GetByID,List,Update,Delete}` calls postgres `mapError`; UserService wraps errors and existing CAS behavior; Huma `register` calls `toProblem`; Echo `newErrorHandler` also calls `toProblem`. `completeProblem` and `newErrorHandler` both force `about:blank`. `problem` has no `retryAfter`. `mapError` knows not-found, the specific email constraint, and 57014→DeadlineExceeded, then wraps unknown errors. The exact C01 gap remains applicable. `toProblem` also preserves Echo HTTPError codes: the old architect phrase “everything else500” was not exhaustive. No global replacement is allowed.

Affected runtime routes: existing `/api/v1/users` collection and item read/mutation routes. No new MatterControl endpoints. `/healthz` and `/readyz` are regression checks, not targets for new problem-body semantics. Migration/relay startup and R02 config paths are outside the fix.

## Expected native behavior

Typed outbound unavailability → core/port-owned sentinel → one shared context-aware inbound mapping → 503 `application/problem+json`, `/problems/unavailable`, fixed non-sensitive detail, positive `retryAfter`. Claude permits native-only integer1 seconds, unexported constant, documented as local implementation detail; no env var, header or retry policy. Both Huma/Echo must retain the mapped type, defaulting other empty types to `about:blank`. HEAD stays bodyless.

Preserve validation/not-found/duplicate/version/CAS statuses and bodies, client cancellation499 (including cancelled request context even when a driver chain also looks like timeout), unrelated Echo codes, unexpected500 without retryAfter, existing probe bytes, migration/config exits and existing CAS retries. Do not add transient write retries or infer “not committed” from an error. Exact classification and native/deferred A1..A15 partition are in Claude's clarification; wrapped-error precedence is governed by the follow-up disposition linked from the handoff.

## Independent verification after return — all NOT_RUN

| ID | Required review / runtime evidence | Current result |
|---|---|---|
| C01-V1 | Exact base/head/diff, allowed paths, no new dependencies, no inbound pgx/pgconn imports, unchanged baseline worktree | NOT_RUN on implementation |
| C01-V2 | Failing-before/passing-after focused tests; every retryable SQLSTATE and typed transport predicate; negative schema/data/privilege/constraint/programming/string-lookalike cases; cancellation precedence | NOT_RUN |
| C01-V3 | GET/list/POST/PATCH/DELETE outage503, fixed body and retryAfter1, existing/nonexistent uniformity; Echo and Huma mapping; HEAD; unrelated4xx/500 unchanged | NOT_RUN |
| C01-V4 | New disposable DB only: real connection refusal/termination, statement-timeout barrier and pool-exhaustion barrier; failed-update rollback; recovery without restart; health200/ready503 then both200 | NOT_RUN |
| C01-V5 | make check with explicitly verified fresh TEST_DATABASE_URL; JSON event counts/skips; only affected503 golden bodies changed; log privacy with request_id/status | NOT_RUN |
| C01-V6 | Commands/UTC/exits/raw stdout/stderr, hashes, resource IDs/caps/cleanup and redaction; no assumptions from owner verdict | NOT_RUN |

Codex will intake the actual ZCode diff and logs first; only then dispatch OpenCode against those exact artifacts. OpenCode direct packet-review route is available from recent successful executions; no C01 implementation exists to review now. Where safe, an isolated reviewer runtime replay can use a separately verified disposable DB after the returned commands/dependencies are inspected. A packet review alone must never be labelled replay. If the reviewer cannot execute, record NOT_RUN and assess whether evidence suffices; never silently waive required runtime verification. No premature C01 review prompt with fictional head/outputs is dispatched.

## Closure boundary

Native A1/A2-existing-versus-nonexistent/A3/A7/A8/A9/A10/A11-native/A13/A14-native may pass only after actual implementation and independent verification. Product inaccessible-resource/auth-store, receipts/unknown-commit replay/current-rights, full UoW parity, error-class policy, complete catalogue and Workers A15 remain OPEN/NOT_RUN; no scaffolding to manufacture those passes. A native PASS must be recorded as **NATIVE_PASS / PRODUCT_OPEN**, never whole C01 CLOSED. R01/R02 remain CLOSED at their tested baseline; regression tests on a new source revision do not reopen their historical evidence findings.

Skipped: implementation and runtime/QA execution pending actual owner dispatch. Risk: wrong error precedence or a blanket connection-wrapper rule would turn nonretryable misconfiguration into false503.

## Actual independent handoff review

OpenCode2.1.4 / opencode/glm-5.3-flash-free reviewed the exact document packet, exit0, session ses_e91461a9bffeB9pJ0699jJSv7r, PASS_WITH_LIMITATIONS with three prompt precision findings. Codex cited the pinned If-Match412 source path separately from plain409, made the CAS retry-predicate stop condition explicit and added explicit Echo/pgx error-shape assertions. Actual targeted recheck, exit0, session ses_e9143f5cbffeJ6W5FdO1UPWzy1, PASS_WITH_LIMITATIONS, all three actionable findings CLOSED. This is handoff-document review, not C01 implementation verification or runtime replay. Native task still WAITING_MANUAL_DISPATCH.

[First review](../reviews/step-02-2-opencode-handoff-review.md), [final recheck](../reviews/step-02-2-opencode-handoff-recheck.md); execution and exact immutable packets are under docs/testing/step-02-2/. The raw recheck opening says four snapshots while listing seven; the retained manifest records the actual7/56151bytes. This is a narrative counting typo, not a missing snapshot or new acceptance gate. Codex verified exact source/current baseline, hashes and local links; reviewer did not recompute them.
