# MC-ZCODE-COMMAND-GATE-CROSS-REVIEW-20261030

Status: **PREPARED_NOT_DISPATCHED** — the human pasting this prompt into a ZCode session starts the assignment. Prepared by actual ZCode (the architecture-review session that authored the plan under review) on 2026-10-30.

## 1. Identity and independence (read first)

You are actual ZCode in a **separate review session**. You must not be the session that authored the plan, the review-matrix rework session, or any implementation session. Dispatch requires: a fresh session, and you must declare at the top of your return which session/identity you are.

**Authorship overlap is structural here:** the plan under review was authored by ZCode (another session of the same product). Per this repository's governance, a fresh session alone does not establish nonauthor independence. Your review is therefore a **cross-session author-side review**: its verdicts are evidence and challenge, valuable precisely because you can verify claims empirically — but it does **not** constitute the architect sign-off the plan's §6 requires (that belongs to the Solution Architect role unless the Product Owner explicitly reassigns it), and it does not authorize implementation. Do not claim DONE, APPROVED or independent acceptance over the plan or its author.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Expected branch `codex/unified-project-flow`; HEAD at preparation `20feedbf…` with a large dirty tree — reviewed bytes are the working tree; pin what you read. All shell commands use `rtk`/`rtk proxy`.

## 2. Under review

`docs/implementation/plans/MC-ZCODE-COMMAND-GATE-DEEPENING-20261030.md` — the command-gate deepening plan: settled decisions §2, variant comparison §3 (A held-struct + B generic replay seam; per-row bulk resolution), interface sketch §4, red-green reproducer set §5, **open decisions D1–D4 §6**, blast radius §7, verification §8. Companion: `GLOSSARY.md` (**Command gate** entry). Background: `docs/testing/zcode-system-multitenancy-review-20261029-r2/return.md` (the Phase A audit that surfaced the divergences).

## 3. Required review

### 3a. Plan rulings (recommendation-level, not architect-final)

For each of D1–D4 give a recommendation — AGREE / AMEND (exact wording) / DISAGREE (with reasoning) — and flag which ones you believe genuinely require the architect or Product Owner rather than a cross-session reviewer:

- **D1** bulk-row refusal audit scope (access-class codes only vs all codes; volume vs purpose of the restricted audit);
- **D2** uniform "replay is boundary-exempt; guard before build only" — note it **changes CreateAction's shipped replay behavior under a pending boundary** while preserving the pinned `TestCreateRequirement_ReplayIgnoresPendingBoundary`; rule on whether this is the right uniform rule or guard-first-uniform is required;
- **D3** keyAge added to W2/W3 replay (no-op under today's default wiring);
- **D4** residual body-internal role refusals accepted as follow-up vs explicit `env.deny` now.

Also review: the A+B variant selection and seam placement (what stays outside the gate), the per-row bulk resolution (both designs rejected a batch entry — concur?), the reproducer set and its test-double changes (memory `FailAt` audit-fault hook, audit-count assertion deltas), and the blast-radius/no-port-change/no-migration claims (plan §7).

### 3b. Empirical verification (your differentiator — bounded, isolated)

The plan's three red claims are checkable today on pinned bytes. Verify at least the first two empirically:

1. Copy the bounded backend candidate to a private directory (`/private/tmp/<your-task>-r1/`), verify bytes against a small manifest you create (the plan-cited files suffice: work_service.go, evidence_service.go, matter_service.go, dataops_service.go, workspace_service.go + the test files), and add scratch verifier tests **in the copy only**:
   - deny-audit swallow: a role-denied command via `MatterService` path must today return `ErrForbidden` with the audit-write failure merely logged (`matter_service.go:335-337`) — write the test the plan's `TestGate_DenyAuditFailureIsStorageFailure` sketches (requires extending the memory double's audit fault injection in the copy) and record it RED;
   - receipt refusals unaudited: wrong-hash/aged-key replay via `CreateAction`/`SubmitEvidence` produces no `security_audit` row today — record RED;
   - receipt-scope triple: demonstrate the three copies behave identically-or-differently as claimed (workspace weaker rule vs reference rule) — at minimum source-diff them; a scratch test is optional.
2. If you run Go tests: use a disposable loopback PostgreSQL fixture per repository discipline (unique name/label you own, randomized credential in 0700/0600 files, CPU/memory/PID limits, loopback port, readiness probe, exact cleanup after label check) or the memory contracts only. Record every command and exit. Never touch retained DBs/containers, `features/review/**` writer files, or any other session's checkpoints.
3. Scratch tests stay in your copy; do not carry them into shared source (the implementing owner will write the real ones red).

## 4. Boundaries

- Shared writes confined to a NEW absent namespace `docs/testing/zcode-command-gate-cross-review-20261030-r1/` (check absence first). Everything else read-only.
- No implementation of the plan, no edits to the plan, to `GLOSSARY.md`, to tasks/workboards, or to any other writer's evidence. No commit/push/merge/deploy. No runtime lifecycle; do not stop or restart any retained process.
- If the working tree drifts during your review (the implementation session is active), re-pin and note drift; findings stay tied to your pinned bytes.

## 5. Deliverable and final response

In your namespace, write `return.md` with:

1. Session identity + the authorship-overlap disclosure paragraph (mandatory, verbatim acknowledgment that this is not independent nonauthor approval).
2. Per-D recommendation table (D1–D4 + variant + reproducers + blast radius) with reasoning.
3. Empirical results: which red claims you reproduced, with command receipts, test names, and the scratch patch location (copy-only).
4. Which rulings you assess as needing the Solution Architect or Product Owner regardless of your recommendation (minimum: D2, if your recommendation endorses a behavior change).
5. Skipped checks and remaining risks.

End with skipped checks and remaining risks. Do not stop at a plan of what you would review — perform the review, or return the exact blocker with what you completed.
