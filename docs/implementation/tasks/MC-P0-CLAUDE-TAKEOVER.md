# MC-P0-CLAUDE-TAKEOVER — continue the existing full P0 implementation

Status: **READY_NOT_DISPATCHED**. Priority: P0. Prepared: 2026-10-27, Asia/Ho_Chi_Minh. Coordinator/intake owner: actual Codex / Local Codex. Incoming execution owner: **actual Claude Code**, on human delivery and acknowledgement. Parent implementation remains **MC-P0-ZCODE-EXECUTION**, covering backend AND product frontend W1–W7.

Authority: direct PO instruction: “do zcode hết quota. nên kiểm tra những gì zcode làm sau đó chuyển tiếp cho claude code làm tiếp. biết prompt ra”. This task-scoped amendment supersedes earlier instructions reserving this product assignment to ZCode. It does not transfer independent approval to the implementation author, restart discovery/W0, permit a Mimosa bypass, or authorize production operations. Earlier authorship remains attributed to ZCode.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch: `codex/unified-project-flow`. Governance base/head at intake: `a62d838791ba188838c4ff00b7b6e265ac775056`. Imported product files and current implementation are uncommitted: the content snapshot, not HEAD alone, identifies the handoff.

Requirements: FR-001..020, AC-101..163 as enumerated in the canonical 63-row coverage set, NFR-001..014, GW-01..03. Scope: finish the existing local Go/PostgreSQL/API + Next.js/Atomic Design product, ZITADEL local integration, author tests/repair, and one consolidated final candidate. W1–W7 are internal checkpoints; no repeated per-wave independent review gates.

Owned paths after acknowledgement: `apps/backend/`, `apps/frontend/`, the existing task-owned `ops/p0-local/` profile, and `docs/implementation/p0-zcode-execution/`. Apply component rules. Keep its legacy path/task name for continuity; append an explicit Claude execution-owner entry and preserve the original session log and evidence. Source inspection by Codex does not dispatch Claude.

Read-only inputs: the existing full plan and prompt; workboard/contract v4/resume notes; approved requirements and source-import baseline; [fresh takeover intake](../../reviews/p0-zcode-quota-takeover-intake-20261027.md); `docs/testing/p0-claude-takeover-20261027/`; latest completed design return and R7 review. Design R8 has an IN_PROGRESS checkpoint at intake and no final return; its directory belongs to another design session and is not an editing destination.

Outputs: preserved starting-source manifest; corrected single workboard; completed BE/API/FE source and related tests/config/docs; bounded redacted author evidence; `docs/implementation/p0-zcode-execution/final-return.md` describing actual author and inherited source. No parallel replacement workboard or design assignment.

Acceptance: actual source-linked implementation of all 20 FRs across both stacks; applicable positive/negative/recovery checks; complete three-GW ledgers; exact 63-AC/14-NFR results with skips and blockers; local start/stop/restore instructions; one final source/evidence manifest. If code remains missing, report PARTIAL_IMPLEMENTATION. If code is complete but mandatory verification is blocked, report IMPLEMENTED_WITH_VERIFICATION_BLOCKERS. No self-awarded DONE/ACCEPTED.

Dependencies: finish W1 memory contract tests, PG adapter, identity verifier, product HTTP/composition, BFF and product FE before dependent waves. Existing local IdP is owner-reported provisioned; verify task ownership and health before use, not by reading arbitrary private resources. No need to reselect the PO-approved local provider. Browser/human study, independent acceptance, production hosting/cost/recovery decisions remain explicit external evidence boundaries, not automatic blockers on unrelated code.

Reviewer: Codex may review Claude-authored source it did not author; a nonauthor reviewer is required for acceptance of contributions by the architect/design author. Claude must not independently approve its own implementation or architecture changes. OpenCode remains eligible when available; quota exhaustion does not imply a PASS.

Tests at intake: see the fresh receipt; memory/core race checks executed without database environment variables. Full PG, auth, frontend, integrated and browser acceptance remain outstanding. Claude must run applicable component checks and repair implementation failures as part of the same assignment.

Safety: local synthetic data only; preserve existing databases/volumes and third-party work. No stage/commit/push/merge/deploy, paid/cloud services, account/provider changes, security-scan/commit retry, permission bypass, INT-A replay, MC-003A worktree changes, private evidence disclosure or design-output overwrite. Takeover due to quota does not reopen any previously refused action.

Dispatch artifact: [full Claude continuation prompt](../handoffs/MC-P0-CLAUDE-TAKEOVER-COMPLETE-PLAN-PROMPT.md). Completion evidence for this preparation is the source inventory, executed scoped checks and the handoff files; no Claude invocation or implementation was performed by preparing them.
