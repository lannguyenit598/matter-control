# MC-P0-ZCODE-EXECUTION — W1 Slice A continuation intake

Actual inspector: Codex / Local Codex. Human-delivered author return: actual ZCode, W1 backend Slice A. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; observed base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. This is a bounded checkpoint intake inside the existing full BE+FE assignment, not a new wave approval or independent final review.

**Disposition: source progress received; repair two confirmed source defects during W1, then continue the same W1–W7 plan.** No per-wave review hold, planning restart or new task is introduced. Do not mark W1 IMPLEMENTED_SELF_TESTED yet.

## Verified progress and limits

- R3 return hash `cd42f5a44536807ba6e38a4af735ec211fa211dc9185c357ef58e36b8e2106ec` and eight declared output pins match current bytes. This verifies intake integrity, not design acceptance.
- Current local contract remains revision 3, SHA-256 `e0f0cc1867415985f409a34ffa57913825fd767816e7226a4b66785cf75baebc`. The token-store correction remains intact.
- All ten public WorkspaceService methods exist in source. W1 ports/domain/policy/service and memory-store extensions exist, along with the PostgreSQL workspace lookup addition.
- Workboard records `IN_PROGRESS_CORE_COMPILE_GREEN_MEMORY_STORE_DONE`. Build GREEN and existing selected suites PASS are **author-reported**, not rerun by this intake. No new build/test command receipts were found under the assignment's evidence tree beyond the baseline artifacts; retain commands/exits/log references at the next applicable author execution without rerunning solely to create paperwork.
- The author correctly excludes PostgreSQL skips from success and leaves W1 behavioral tests, PostgreSQL implementation, verifier/HTTP wiring and frontend outstanding. Workboard still retains an older `compile_gaps_exact` list alongside the new remaining-work list; reconcile that stale summary while preserving history, rather than treating already-fixed gaps as fresh work.

## W1-A01 — P1: reactivation can restore a more privileged old role than requested

Source: `apps/backend/internal/core/service/workspace_service.go:517–527` and `:662–675`; `apps/backend/internal/adapter/outbound/repotest/mattercontrol/memory_w1.go:128–140` and `:300–312`.

The service rejects role mismatch only when the membership is already ACTIVE. For an existing REVOKED membership it calls `Update*MembershipStatus`, which changes status/revision but preserves the stored role. It then returns a result containing the newly requested role. Thus an old revoked OWNER granted MEMBER at Workspace scope, or VIEWER at Matter scope, becomes ACTIVE with the old OWNER role while the command response describes the lower role.

Repair both scopes and keep future PostgreSQL behavior identical. If role changes are intentionally outside the catalogue, reject a different role before reactivation; otherwise bind an explicitly supported atomic role/status change to the contract. Never return a role different from persisted authorization state. Existing same-role reactivation must still work.

Add fail-first behavioral cases for revoked OWNER → requested lower role in both scopes, inverse role mismatch, same-role reactivation, subsequent read/authorization and unchanged data on rejection. These are source-confirmed paths, not an executed exploit reproduction.

## W1-A02 — P1: CreateMatter has no workspace revision precondition

Source: `apps/backend/internal/core/port/workspace.go:23–28`, `apps/backend/internal/core/service/workspace_service.go:242–360`; contrast `docs/implementation/p0-zcode-execution/local-contract.md:26/46`.

The contract assigns CreateMatter workspace-revision CAS, including 428 for a missing precondition and 412 for a stale one. `CreateMatterCmd` has no expected-revision field and the service's fresh-create path has no workspace CAS check. A workspace row lock serializes execution but does not validate the caller's expected revision. Request fingerprinting also cannot enforce a precondition that the service never receives.

Carry the adopted strong-validator → expected-revision value through the port and check the fresh-create path in the locked transaction, preserving authorization/error precedence and the established receipt-replay semantics. Keep the workspace CAS resource/revision/readback rule consistent rather than silently dropping the contract requirement. Bind it through HTTP and frontend when those adapters are implemented.

Add missing/stale/matching precondition tests proving rejected writes create no Matter/membership/domain-success event, plus same-key replay and concurrent fresh commands with the adopted revision behavior. Existing native User API behavior remains outside this change.

## W1-A03 — contract clarification: non-receipted membership commands

The author's non-receipted CAS membership choice is recorded in the workboard and code, but `port/workspace.go:11–13` still promises receipts for every state-changing intent. The current contract exposes own-key reconciliation without identifying which commands it covers. CAS can prevent stale writes; it does not prove that an earlier timed-out command committed.

Consolidate an explicit per-operation table in the existing local contract: key/receipt participation, CAS scope, lost-response behavior, permitted readback and retry rules. For non-receipted membership writes, never report committed/rejected solely from a later membership state or 412, and never blindly resend. Retain OUTCOME_UNKNOWN when authoritative attribution is unavailable; a self-revoked caller may also lose readback access. Keep receipt lookup privacy intact. If the chosen design cannot satisfy the approved unknown-outcome/retry guarantees, repair the mechanism rather than claiming a waiver. This intake does not declare that every mutation must use one universal receipt implementation.

## Single continuation directive for the running ZCode assignment

Continue **MC-P0-ZCODE-EXECUTION** from the current source. Integrate W1-A01/A02 fixes, their behavioral tests and W1-A03 contract clarification into the same W1 work. Then complete W1 memory/PG contract tests → PostgreSQL implementation and required checks with two isolated verified fixtures → real ZITADEL verifier/HTTP/composition → complete BFF/product FE → W2–W7 author implementation/testing/repair. Preserve the full plan in `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md`; do not return another planning-only pass or stop for intermediate independent approval.

Use the compatible verified R3 source/spec and current contract. R4's separate coordinator intake records conflicting token/Filing/proof/FR directives; do not wholesale adopt those contradictions while continuing implementation. No ZCode source/workboard/contract was modified by this intake and no external agent was messaged.

Final independent review stays at the complete candidate. Proposed checkpoint remains IN_PROGRESS, with source corrections tracked; no formal AC/NFR/GW/design/security/production/Mimosa gate is promoted.

Skipped: build/test/runtime/DB/provider execution, source edits, external dispatch and Git mutations. Risk: existing suite success does not cover new W1 membership/CAS behavior; implementing HTTP/FE before repairing these paths can expose incorrect authorization state or stale writes.
